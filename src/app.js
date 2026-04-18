require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');

const app = express();

app.use(cors({
  origin: [
    'https://trackflowissuetracker.netlify.app',
    'http://localhost:5173',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dbtest', async (req, res) => {
  const { pool } = require('./config/db');
  try {
    const [rows] = await pool.execute('SELECT 1+1 AS result');
    res.json({ db: 'connected', result: rows[0].result });
  } catch (err) {
    res.status(500).json({ db: 'failed', error: err.message, code: err.code });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;