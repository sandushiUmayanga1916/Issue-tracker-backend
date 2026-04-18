const { pool } = require('../config/db');
const { validationResult } = require('express-validator');
const { Parser } = require('json2csv');

// GET /issues - list with search, filter, pagination
const getIssues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      priority,
      severity,
      sort = 'created_at',
      order = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const allowedSort = ['created_at', 'updated_at', 'title', 'priority', 'status'];
    const sortField = allowedSort.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let where = [];
    let params = [];

    if (search) {
      where.push('(i.title LIKE ? OR i.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) { where.push('i.status = ?'); params.push(status); }
    if (priority) { where.push('i.priority = ?'); params.push(priority); }
    if (severity) { where.push('i.severity = ?'); params.push(severity); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total FROM issues i ${whereClause}
    `;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    const sql = `
      SELECT 
        i.id, i.title, i.description, i.status, i.priority, i.severity,
        i.created_at, i.updated_at,
        u1.id as creator_id, u1.name as creator_name,
        u2.id as assignee_id, u2.name as assignee_name
      FROM issues i
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      ${whereClause}
      ORDER BY i.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.execute(sql, [...params, String(parseInt(limit)), String(offset)]);

    res.json({
      issues: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /issues/stats - status counts
const getStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT status, COUNT(*) as count FROM issues GROUP BY status
    `);
    const stats = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
    rows.forEach(r => { stats[r.status] = r.count; });
    const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM issues');
    res.json({ stats, total: totalRows[0].total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /issues/:id
const getIssue = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        i.*, 
        u1.name as creator_name, u1.email as creator_email,
        u2.name as assignee_name, u2.email as assignee_email
      FROM issues i
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Issue not found' });
    res.json({ issue: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /issues
const createIssue = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, priority, severity, assigned_to } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO issues (title, description, priority, severity, created_by, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || null, priority || 'Medium', severity || 'Minor', req.user.id, assigned_to || null]
    );
    const [rows] = await pool.execute('SELECT * FROM issues WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Issue created', issue: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /issues/:id
const updateIssue = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    // Fetch current row so we can fall back to existing values for any omitted fields
    const [existing] = await pool.execute('SELECT * FROM issues WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Issue not found' });

    const current = existing[0];
    const body = req.body;

    // Use incoming value if provided, otherwise keep the current DB value
    const title       = body.title       !== undefined ? body.title       : current.title;
    const description = body.description !== undefined ? body.description : current.description;
    const status      = body.status      !== undefined ? body.status      : current.status;
    const priority    = body.priority    !== undefined ? body.priority    : current.priority;
    const severity    = body.severity    !== undefined ? body.severity    : current.severity;
    const assigned_to = body.assigned_to !== undefined ? body.assigned_to : current.assigned_to;

    await pool.execute(
      `UPDATE issues SET
        title = ?,
        description = ?,
        status = ?,
        priority = ?,
        severity = ?,
        assigned_to = ?
      WHERE id = ?`,
      [title, description ?? null, status, priority, severity, assigned_to ?? null, req.params.id]
    );

    const [rows] = await pool.execute('SELECT * FROM issues WHERE id = ?', [req.params.id]);
    res.json({ message: 'Issue updated', issue: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /issues/:id
const deleteIssue = async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id FROM issues WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Issue not found' });

    await pool.execute('DELETE FROM issues WHERE id = ?', [req.params.id]);
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /issues/export - export CSV or JSON
const exportIssues = async (req, res) => {
  const { format = 'json' } = req.query;
  try {
    const [rows] = await pool.execute(`
      SELECT i.id, i.title, i.description, i.status, i.priority, i.severity,
             u1.name as created_by, u2.name as assigned_to, i.created_at, i.updated_at
      FROM issues i
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      ORDER BY i.created_at DESC
    `);

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=issues.csv');
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=issues.json');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Export failed' });
  }
};

module.exports = { getIssues, getStats, getIssue, createIssue, updateIssue, deleteIssue, exportIssues };