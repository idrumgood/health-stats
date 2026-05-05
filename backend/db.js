const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, 'health_data.db');

async function setupDatabase() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS tokens (
            service TEXT PRIMARY KEY,
            access_token TEXT,
            refresh_token TEXT,
            expires_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS strava_activities (
            id TEXT PRIMARY KEY,
            name TEXT,
            distance REAL,
            moving_time INTEGER,
            elapsed_time INTEGER,
            type TEXT,
            start_date TEXT,
            average_heartrate REAL,
            max_heartrate REAL,
            suffer_score REAL
        );

        CREATE TABLE IF NOT EXISTS whoop_data (
            id TEXT PRIMARY KEY,
            cycle_id TEXT,
            date TEXT,
            sleep_performance REAL,
            strain REAL,
            recovery_score REAL,
            hrv REAL,
            rhr REAL
        );
    `);

    console.log('Database initialized successfully.');
    return db;
}

module.exports = { setupDatabase };
