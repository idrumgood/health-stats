const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { setupDatabase } = require('./db');
const { syncStrava, syncWhoop } = require('./sync');
const { generateInsights } = require('./ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || `http://localhost:${PORT}/api/auth/strava/callback`;
const WHOOP_CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const WHOOP_CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
const WHOOP_REDIRECT_URI = process.env.WHOOP_REDIRECT_URI || `http://localhost:${PORT}/api/auth/whoop/callback`;

let db;

async function init() {
    db = await setupDatabase();

    app.get('/api/auth/status', async (req, res) => {
        const stravaToken = await db.get('SELECT * FROM tokens WHERE service = ?', ['strava']);
        const whoopToken = await db.get('SELECT * FROM tokens WHERE service = ?', ['whoop']);
        res.json({ strava: !!stravaToken, whoop: !!whoopToken });
    });

    app.get('/api/auth/strava', (req, res) => {
        const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&scope=read,activity:read_all&approval_prompt=force`;
        res.json({ url });
    });

    app.get('/api/auth/strava/callback', async (req, res) => {
        if (!req.query.code) return res.status(400).send('No code');
        try {
            const resp = await axios.post('https://www.strava.com/oauth/token', {
                client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, code: req.query.code, grant_type: 'authorization_code'
            });
            await db.run('INSERT OR REPLACE INTO tokens (service, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
                ['strava', resp.data.access_token, resp.data.refresh_token, resp.data.expires_at]);
            res.send('Strava connected successfully!');
        } catch (err) { res.status(500).send('Failed'); }
    });

    app.get('/api/auth/whoop', (req, res) => {
        const url = `https://api.prod.whoop.com/oauth/oauth2/auth?client_id=${WHOOP_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(WHOOP_REDIRECT_URI)}&scope=read:recovery read:sleep read:workout read:cycles read:profile&state=123`;
        res.json({ url });
    });

    app.get('/api/auth/whoop/callback', async (req, res) => {
        if (!req.query.code) return res.status(400).send('No code');
        try {
            const params = new URLSearchParams({ client_id: WHOOP_CLIENT_ID, client_secret: WHOOP_CLIENT_SECRET, grant_type: 'authorization_code', code: req.query.code, redirect_uri: WHOOP_REDIRECT_URI });
            const resp = await axios.post('https://api.prod.whoop.com/oauth/oauth2/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            const expires_at = Math.floor(Date.now() / 1000) + resp.data.expires_in;
            await db.run('INSERT OR REPLACE INTO tokens (service, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
                ['whoop', resp.data.access_token, resp.data.refresh_token, expires_at]);
            res.send('Whoop connected successfully!');
        } catch (err) { res.status(500).send('Failed'); }
    });

    app.post('/api/sync', async (req, res) => {
        const results = { strava: false, whoop: false, errors: [] };
        if (await db.get('SELECT * FROM tokens WHERE service = ?', ['strava'])) {
            try { await syncStrava(db); results.strava = true; } catch (e) { results.errors.push(e.message); }
        }
        if (await db.get('SELECT * FROM tokens WHERE service = ?', ['whoop'])) {
            try { await syncWhoop(db); results.whoop = true; } catch (e) { results.errors.push(e.message); }
        }
        res.json({ message: 'Sync complete', results });
    });

    app.get('/api/data', async (req, res) => {
        res.json({
            strava: await db.all('SELECT * FROM strava_activities ORDER BY start_date DESC LIMIT 50'),
            whoop: await db.all('SELECT * FROM whoop_data ORDER BY date DESC LIMIT 50')
        });
    });

    app.get('/api/insights', async (req, res) => {
        const stravaData = await db.all('SELECT * FROM strava_activities ORDER BY start_date DESC LIMIT 15');
        const whoopData = await db.all('SELECT * FROM whoop_data ORDER BY date DESC LIMIT 15');
        if (!stravaData.length && !whoopData.length) return res.json({ text: "Not enough data to generate insights yet." });
        res.json({ text: await generateInsights(stravaData, whoopData) });
    });

    app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
}
init().catch(console.error);
