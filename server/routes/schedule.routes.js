const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  generateOptimizedSchedule,
  generateDailyOptimizedSchedule,
  getScheduleForWeek,
  getScheduleForMonth,
  addTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  getSuggestedSchedules,
  getSchedules,
  archiveSchedule,
  deleteSchedule
} = require('../controllers/schedule.controller');

// All routes require authentication
router.use(protect);

// Validation rules
const scheduleGenerationValidation = [
  body('weekStartDate')
    .notEmpty()
    .withMessage('Week start date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('preferences.workdayStart')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Work day start must be in HH:MM format'),
  body('preferences.workdayEnd')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Work day end must be in HH:MM format'),
  body('preferences.maxDailyHours')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Max daily hours must be between 1 and 24'),
  body('taskIds')
    .optional()
    .isArray()
    .withMessage('Task IDs must be an array')
];

const timeBlockUpdateValidation = [
  body('startTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in-progress', 'completed', 'rescheduled', 'skipped'])
    .withMessage('Invalid status'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
];

// Routes

/**
 * GET /api/schedules
 * Get all schedules for current user
 */
router.get('/', getSchedules);

/**
 * POST /api/schedules/generate
 * Generate an optimized schedule
 */
router.post(
  '/generate',
  scheduleGenerationValidation,
  validate,
  generateOptimizedSchedule
);

/**
 * POST /api/schedules/daily/generate
 * Generate optimized schedule for a single day
 */
router.post('/daily/generate', generateDailyOptimizedSchedule);

/**
 * GET /api/schedules/week/:weekStartDate
 * Get schedule for a specific week
 */
router.get('/week/:weekStartDate', getScheduleForWeek);

/**
 * GET /api/schedules/month/:yearMonth
 * Get schedule and deadlines for a specific month
 * Format: yearMonth = "2024-03"
 */
router.get('/month/:yearMonth', getScheduleForMonth);

/**
 * GET /api/schedules/:scheduleId/suggestions
 * Get alternative schedule suggestions
 */
router.get('/:scheduleId/suggestions', getSuggestedSchedules);

/**
 * PUT /api/schedules/:scheduleId/timeblock/:blockId
 * Update a specific time block
 */
router.put(
  '/:scheduleId/timeblock/:blockId',
  timeBlockUpdateValidation,
  validate,
  updateTimeBlock
);

/**
 * POST /api/schedules/:scheduleId/timeblock
 * Add a time block
 */
router.post('/:scheduleId/timeblock', addTimeBlock);

/**
 * DELETE /api/schedules/:scheduleId/timeblock/:blockId
 * Delete a time block
 */
router.delete('/:scheduleId/timeblock/:blockId', deleteTimeBlock);

/**
 * PUT /api/schedules/:scheduleId/archive
 * Archive a schedule
 */
router.put('/:scheduleId/archive', archiveSchedule);

/**
 * DELETE /api/schedules/:scheduleId
 * Delete a schedule
 */
router.delete('/:scheduleId', deleteSchedule);

module.exports = router;
