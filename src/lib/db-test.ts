// src/lib/db-test.ts
import pool from './db';

/**
 * A test function to verify the database connection.
 * It attempts to connect to the pool and run a simple query.
 * This function is for testing purposes only.
 */
export async function testDatabaseConnection() {
  let client;
  try {
    console.log('Attempting to get a client from the connection pool...');
    client = await pool.connect();
    console.log('Successfully connected to the database pool.');

    console.log('Executing a test query (SELECT NOW())...');
    const result = await client.query('SELECT NOW()');
    console.log('Query successful. Current database time:', result.rows[0].now);
    
    return { success: true, time: result.rows[0].now };
  } catch (error: any) {
    console.error('Database connection test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (client) {
      client.release();
      console.log('Database client released.');
    }
  }
}

// To run this test, you could call this function from a server-side component or an API route.
// For example, in a test API route:
/*
import { testDatabaseConnection } from '@/lib/db-test';

export async function GET() {
  const result = await testDatabaseConnection();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}
*/
