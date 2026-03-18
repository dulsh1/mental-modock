const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  aiBreakdown,
  createWithBreakdown,
  autoSchedule,
  getTodaysTasks,
  updateSubtask
} = require('../controllers/task.controller');

// Validation rules
const taskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .isIn(['work', 'personal', 'academic', 'health', 'finance', 'social', 'other', 'general', 'learning'])
    .withMessage('Invalid category')
];

// All routes require authentication
router.use(protect);

// Routes
router.get('/', getTasks);
router.get('/today', getTodaysTasks);
router.post('/', taskValidation, validate, createTask);
router.post('/ai-breakdown', aiBreakdown);
router.post('/create-with-breakdown', createWithBreakdown);
router.post('/auto-schedule', autoSchedule);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.put('/:id/subtask/:subtaskId', updateSubtask);

module.exports = router;
