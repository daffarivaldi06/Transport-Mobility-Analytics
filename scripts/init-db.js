const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const dbHost = process.env.PG_HOST || 'localhost';
const dbPort = process.env.PG_PORT || 5432;
const dbUser = process.env.PG_USER || 'postgres';
const dbPassword = process.env.PG_PASSWORD || 'postgres';
const dbName = process.env.PG_DATABASE || 'mobility';

async function main() {
  // Step 1: Connect to default 'postgres' database to ensure the target database exists
  console.log(`Connecting to postgres server to check for database "${dbName}"...`);
  
  const defaultClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres'
  });

  try {
    await defaultClient.connect();
    
    // Check if database exists
    const res = await defaultClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // CREATE DATABASE cannot run in a transaction block, so we run it directly
      await defaultClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Failed to check/create database:', err.message);
    process.exit(1);
  } finally {
    await defaultClient.end();
  }

  // Step 2: Connect to the target database and execute the SQL initialization
  console.log(`Connecting to database "${dbName}" to run schema initialization...`);
  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName
  });

  try {
    const sqlPath = path.join(__dirname, 'init_db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
      console.log('Running SQL initialization script...');
      await client.query(sql);
      console.log('Database schema and sample data initialized successfully!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to run schema initialization:', err.message);
  } finally {
    await pool.end();
  }
}

main();
