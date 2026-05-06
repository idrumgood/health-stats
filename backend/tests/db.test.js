const { setupDatabase } = require('../db');

describe('Database Setup', () => {
    let db;

    beforeAll(async () => {
        // Use an in-memory database for testing
        db = await setupDatabase(':memory:');
    });

    afterAll(async () => {
        if (db) {
            await db.close();
        }
    });

    test('should initialize tables correctly', async () => {
        // Check if tables exist by querying sqlite_master
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        const tableNames = tables.map(t => t.name);

        expect(tableNames).toContain('tokens');
        expect(tableNames).toContain('strava_activities');
        expect(tableNames).toContain('whoop_data');
    });

    test('tokens table should have correct schema', async () => {
        const columns = await db.all("PRAGMA table_info(tokens)");
        const columnNames = columns.map(c => c.name);
        expect(columnNames).toEqual(expect.arrayContaining(['service', 'access_token', 'refresh_token', 'expires_at']));
    });

    test('strava_activities table should have correct schema', async () => {
        const columns = await db.all("PRAGMA table_info(strava_activities)");
        const columnNames = columns.map(c => c.name);
        expect(columnNames).toEqual(expect.arrayContaining(['id', 'name', 'distance', 'moving_time', 'elapsed_time', 'type', 'start_date', 'average_heartrate', 'max_heartrate', 'suffer_score']));
    });

    test('whoop_data table should have correct schema', async () => {
        const columns = await db.all("PRAGMA table_info(whoop_data)");
        const columnNames = columns.map(c => c.name);
        expect(columnNames).toEqual(expect.arrayContaining(['id', 'cycle_id', 'date', 'sleep_performance', 'strain', 'recovery_score', 'hrv', 'rhr']));
    });
});
