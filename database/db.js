const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for many hosted providers like Supabase/Railway
    }
});

/**
 * SECURE QUERY WRAPPER
 * Always use parameterized queries: db.query('SELECT * FROM users WHERE id = $1', [userId])
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error('❌ [DATABASE_ERROR]:', err.message);
        throw err;
    }
}

/**
 * INITIALIZE SCHEMA
 * Sets up tables for 1M+ server scale
 */
async function init() {
    console.log('📡 [Database] Verifying schema integrity...');

    // 1. Guild Configuration
    await query(`
        CREATE TABLE IF NOT EXISTS guild_config (
            guild_id TEXT PRIMARY KEY,
            antinuke_enabled BOOLEAN DEFAULT FALSE,
            autorestore_enabled BOOLEAN DEFAULT TRUE,
            antinuke_limits JSONB DEFAULT '{"channelDelete": 2, "roleDelete": 2, "ban": 3, "kick": 3, "interval": 10000}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Extra Owners (Trust Chain)
    await query(`
        CREATE TABLE IF NOT EXISTS extra_owners (
            id SERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            added_by TEXT,
            added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(guild_id, user_id)
        );
    `);

    // 3. Whitelist (Immunity registry)
    await query(`
        CREATE TABLE IF NOT EXISTS whitelist (
            id SERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            added_by TEXT,
            added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(guild_id, user_id)
        );
    `);

    // Create indexes for high-speed lookups at scale
    await query(`CREATE INDEX IF NOT EXISTS idx_extra_owners_guild ON extra_owners(guild_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_whitelist_guild ON whitelist(guild_id);`);

    console.log('✅ [Database] Schema integrity verified. Secure connection pool active.');
}

module.exports = {
    query,
    init,
    pool
};
