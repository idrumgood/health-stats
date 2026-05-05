const axios = require('axios');
const { setupDatabase } = require('./db');

async function getValidToken(db, service) {
    const tokenData = await db.get('SELECT * FROM tokens WHERE service = ?', [service]);
    if (!tokenData) throw new Error(`${service} is not connected.`);

    const now = Math.floor(Date.now() / 1000);
    if (tokenData.expires_at && tokenData.expires_at < now + 300) {
        return await refreshAccessToken(db, service, tokenData.refresh_token);
    }
    return tokenData.access_token;
}

async function refreshAccessToken(db, service, refreshToken) {
    try {
        let response;
        if (service === 'strava') {
            response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            });
        } else if (service === 'whoop') {
            const params = new URLSearchParams();
            params.append('client_id', process.env.WHOOP_CLIENT_ID);
            params.append('client_secret', process.env.WHOOP_CLIENT_SECRET);
            params.append('grant_type', 'refresh_token');
            params.append('refresh_token', refreshToken);

            response = await axios.post('https://api.prod.whoop.com/oauth/oauth2/token', params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        }

        const data = response.data;
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token;
        const expiresAt = service === 'strava' ? data.expires_at : Math.floor(Date.now() / 1000) + data.expires_in;

        await db.run(
            'UPDATE tokens SET access_token = ?, refresh_token = ?, expires_at = ? WHERE service = ?',
            [newAccessToken, newRefreshToken, expiresAt, service]
        );

        return newAccessToken;
    } catch (error) {
        console.error(`Error refreshing ${service} token:`, error.response?.data || error.message);
        throw new Error(`Could not refresh ${service} token`);
    }
}

async function syncStrava(db) {
    const token = await getValidToken(db, 'strava');
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
        headers: { Authorization: `Bearer ${token}` }
    });

    const activities = response.data;
    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO strava_activities
        (id, name, distance, moving_time, elapsed_time, type, start_date, average_heartrate, max_heartrate, suffer_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const act of activities) {
        await stmt.run(
            act.id, act.name, act.distance, act.moving_time, act.elapsed_time, act.type, act.start_date,
            act.average_heartrate || null, act.max_heartrate || null, act.suffer_score || null
        );
    }
    await stmt.finalize();
}

async function syncWhoop(db) {
    const token = await getValidToken(db, 'whoop');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const startParam = thirtyDaysAgo.toISOString();

    const response = await axios.get(`https://api.prod.whoop.com/developer/v1/cycle?start=${startParam}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const cycles = response.data.records;
    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO whoop_data
        (id, cycle_id, date, sleep_performance, strain, recovery_score, hrv, rhr)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cycle of cycles) {
        let sleepPerformance = null;
        let recoveryScore = null;
        let hrv = null;
        let rhr = null;
        let strain = cycle.score?.strain || null;

        try {
            if (cycle.sleep?.id) {
                const sleepResp = await axios.get(`https://api.prod.whoop.com/developer/v1/activity/sleep/${cycle.sleep.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                sleepPerformance = sleepResp.data.score?.sleep_performance_percentage;
            }
            if (cycle.recovery?.id) {
                const recResp = await axios.get(`https://api.prod.whoop.com/developer/v1/recovery/${cycle.recovery.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                recoveryScore = recResp.data.score?.recovery_score;
                hrv = recResp.data.score?.hrv_rmssd_milli;
                rhr = recResp.data.score?.resting_heart_rate;
            }
        } catch (e) {
            console.error(`Error fetching sleep/recovery for cycle ${cycle.id}`);
        }

        const date = cycle.created_at.split('T')[0];
        await stmt.run(cycle.id, cycle.id, date, sleepPerformance, strain, recoveryScore, hrv, rhr);
    }
    await stmt.finalize();
}

module.exports = { syncStrava, syncWhoop };
