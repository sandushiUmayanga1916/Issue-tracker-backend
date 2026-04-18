require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;