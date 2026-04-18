const express = require('express');
const { body } = require('express-validator');
const {
  getIssues,
  getStats,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  exportIssues,
} = require('../controllers/issuesController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getStats);
router.get('/export', exportIssues);

router.get('/', getIssues);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('severity').optional().isIn(['Minor', 'Major', 'Critical', 'Blocker']),
], createIssue);

router.get('/:id', getIssue);
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['Open', 'In Progress', 'Resolved', 'Closed']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('severity').optional().isIn(['Minor', 'Major', 'Critical', 'Blocker']),
], updateIssue);
router.delete('/:id', deleteIssue);

module.exports = router;
