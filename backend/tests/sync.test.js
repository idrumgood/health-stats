const { syncStrava, syncWhoop } = require('../sync');
const axios = require('axios');
const { setupDatabase } = require('../db');

jest.mock('axios');

describe('Sync module', () => {
    let db;

    beforeEach(async () => {
        db = await setupDatabase(':memory:');
        jest.clearAllMocks();
    });

    afterEach(async () => {
        if (db) await db.close();
    });

    describe('syncStrava', () => {
        test('should throw if strava is not connected', async () => {
            await expect(syncStrava(db)).rejects.toThrow('strava is not connected.');
        });

        test('should fetch and insert strava activities', async () => {
            // Insert mock token
            const expiresAt = Math.floor(Date.now() / 1000) + 3600;
            await db.run(
                'INSERT INTO tokens (service, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
                ['strava', 'mock_strava_access_token', 'mock_refresh_token', expiresAt]
            );

            const mockActivities = [
                {
                    id: 'act1',
                    name: 'Morning Run',
                    distance: 5000,
                    moving_time: 1800,
                    elapsed_time: 1900,
                    type: 'Run',
                    start_date: '2023-01-01T08:00:00Z',
                    average_heartrate: 150,
                    max_heartrate: 180,
                    suffer_score: 50
                }
            ];

            axios.get.mockResolvedValueOnce({ data: mockActivities });

            await syncStrava(db);

            expect(axios.get).toHaveBeenCalledWith(
                'https://www.strava.com/api/v3/athlete/activities?per_page=30',
                expect.objectContaining({ headers: { Authorization: 'Bearer mock_strava_access_token' } })
            );

            const activities = await db.all('SELECT * FROM strava_activities');
            expect(activities).toHaveLength(1);
            expect(activities[0].id).toBe('act1');
            expect(activities[0].name).toBe('Morning Run');
        });

        test('should refresh token if expired', async () => {
            // Insert expired token
            const expiresAt = Math.floor(Date.now() / 1000) - 3600;
            await db.run(
                'INSERT INTO tokens (service, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
                ['strava', 'expired_token', 'valid_refresh_token', expiresAt]
            );

            // Mock refresh response
            axios.post.mockResolvedValueOnce({
                data: {
                    access_token: 'new_access_token',
                    refresh_token: 'new_refresh_token',
                    expires_at: Math.floor(Date.now() / 1000) + 3600
                }
            });

            // Mock activities response
            axios.get.mockResolvedValueOnce({ data: [] });

            await syncStrava(db);

            expect(axios.post).toHaveBeenCalledWith(
                'https://www.strava.com/oauth/token',
                expect.objectContaining({
                    grant_type: 'refresh_token',
                    refresh_token: 'valid_refresh_token'
                })
            );

            const tokenRow = await db.get('SELECT * FROM tokens WHERE service = ?', ['strava']);
            expect(tokenRow.access_token).toBe('new_access_token');
        });
    });

    describe('syncWhoop', () => {
        test('should throw if whoop is not connected', async () => {
            await expect(syncWhoop(db)).rejects.toThrow('whoop is not connected.');
        });

        test('should fetch and insert whoop cycles', async () => {
            const expiresAt = Math.floor(Date.now() / 1000) + 3600;
            await db.run(
                'INSERT INTO tokens (service, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
                ['whoop', 'mock_whoop_access_token', 'mock_refresh_token', expiresAt]
            );

            const mockCycles = [
                {
                    id: 'cycle1',
                    created_at: '2023-01-01T08:00:00Z',
                    score: { strain: 12.5 },
                    sleep: { id: 'sleep1' },
                    recovery: { id: 'recovery1' }
                }
            ];

            // Mock cycles fetch
            axios.get.mockResolvedValueOnce({ data: { records: mockCycles } });

            // Mock sleep fetch
            axios.get.mockResolvedValueOnce({ data: { score: { sleep_performance_percentage: 90 } } });

            // Mock recovery fetch
            axios.get.mockResolvedValueOnce({ data: { score: { recovery_score: 80, hrv_rmssd_milli: 60, resting_heart_rate: 55 } } });

            await syncWhoop(db);

            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('https://api.prod.whoop.com/developer/v1/cycle'),
                expect.any(Object)
            );

            const cycles = await db.all('SELECT * FROM whoop_data');
            expect(cycles).toHaveLength(1);
            expect(cycles[0].id).toBe('cycle1');
            expect(cycles[0].strain).toBe(12.5);
            expect(cycles[0].sleep_performance).toBe(90);
            expect(cycles[0].recovery_score).toBe(80);
        });
    });
});
