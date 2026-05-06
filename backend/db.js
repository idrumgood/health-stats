const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, 'health_data.db');

async function setupDatabase(filename = dbPath) {
    const db = await open({
        filename: filename,
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

        CREATE TABLE IF NOT EXISTS ai_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE,
            data_hash TEXT,
            summary TEXT
        );

        CREATE TABLE IF NOT EXISTS sync_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            last_sync_date TEXT UNIQUE
        );
    `);

    console.log('Database initialized successfully.');
    return db;
}

module.exports = { setupDatabase };
