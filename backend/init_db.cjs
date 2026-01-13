const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/kruai_db',
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false
});

const createTables = async () => {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nickname VARCHAR(100) NOT NULL,
        grade VARCHAR(50) NOT NULL,
        summary_style VARCHAR(20) DEFAULT 'SHORT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Add summary_style to users if not exists (for existing tables)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='summary_style') THEN
          ALTER TABLE users ADD COLUMN summary_style VARCHAR(20) DEFAULT 'SHORT';
        END IF;
      END $$;
    `);
    console.log('Users table created/verified');

    // Create Summaries Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS summaries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Summaries table created/verified');

    // Create Quiz History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Quiz History table created/verified');

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await client.end();
  }
};

createTables();
