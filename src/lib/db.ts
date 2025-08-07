// src/lib/db.ts
import { Pool } from 'pg';

// This ensures that the code inside this block is only run once.
// In a serverless environment or with hot-reloading, multiple pools could be created otherwise.
let pool: Pool;

if (!global.dbPool) {
  global.dbPool = new Pool({
    // The connection string is read from the PGDATABASE_URL environment variable
    // format: postgres://user:password@host:port/database
    connectionString: process.env.PGDATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

pool = global.dbPool;

export default pool;
