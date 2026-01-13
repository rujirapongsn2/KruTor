const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/kruai_db',
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false
});

// --- API Routes ---

// 1. Users
// Create User
app.post('/api/users', async (req, res) => {
    try {
        const { nickname, grade, summary_style } = req.body;
        const result = await pool.query(
            'INSERT INTO users (nickname, grade, summary_style) VALUES ($1, $2, $3) RETURNING *',
            [nickname, grade, summary_style || 'SHORT']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Update User (Summary Style)
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { summary_style } = req.body;

        const result = await pool.query(
            'UPDATE users SET summary_style = $1 WHERE id = $2 RETURNING *',
            [summary_style, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Summaries
// Save Summary
app.post('/api/summaries', async (req, res) => {
    try {
        const { user_id, title, content } = req.body;
        const result = await pool.query(
            'INSERT INTO summaries (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
            [user_id, title, content]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Summaries
app.get('/api/summaries/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT * FROM summaries WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Quiz History
// Save Quiz Result
app.post('/api/quiz-history', async (req, res) => {
    try {
        const { user_id, score, total_questions, details } = req.body;
        const result = await pool.query(
            'INSERT INTO quiz_history (user_id, score, total_questions, details) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, score, total_questions, details]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Quiz History
app.get('/api/quiz-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT * FROM quiz_history WHERE user_id = $1 ORDER BY timestamp DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.send('API is running');
});

// DB Test
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0], env: !!process.env.DATABASE_URL });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
