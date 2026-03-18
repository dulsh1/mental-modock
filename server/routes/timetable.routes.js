const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  applyTemplate,
  addTimeSlot,
  removeTimeSlot,
  rateTemplate,
  getTemplateSuggestions
} = require('../controllers/timetable.controller');

// All routes require authentication
router.use(protect);

// Validation rules
const templateCreationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('templateType')
    .optional()
    .isIn(['study-focused', 'balanced', 'flexible', 'exam-prep', 'custom'])
    .withMessage('Invalid template type'),
  body('schedulePattern')
    .notEmpty()
    .withMessage('Schedule pattern is required'),
  body('schedulePattern.timeSlots')
    .isArray()
    .withMessage('Time slots must be an array'),
  body('schedulePattern.workdayStart')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Work day start must be in HH:MM format'),
  body('schedulePattern.workdayEnd')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Work day end must be in HH:MM format')
];

const timeSlotValidation = [
  body('dayOfWeek')
    .notEmpty()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be 0-6 (Monday-Sunday)'),
  body('startTime')
    .notEmpty()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .notEmpty()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
  body('activity')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Activity name must be between 1 and 100 characters'),
  body('activityType')
    .optional()
    .isIn(['study', 'break', 'meal', 'exercise', 'other'])
    .withMessage('Invalid activity type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority')
];

const applyTemplateValidation = [
  body('weekStartDate')
    .notEmpty()
    .withMessage('Week start date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('autoGenerateSchedule')
    .optional()
    .isBoolean()
    .withMessage('Auto generate schedule must be boolean')
];

const ratingValidation = [
  body('score')
    .notEmpty()
    .isInt({ min: 0, max: 5 })
    .withMessage('Score must be between 0 and 5')
];

// Routes

/**
 * GET /api/templates
 * Get all templates for current user
 */
router.get('/', getTemplates);

/**
 * POST /api/templates
 * Create a new template
 */
router.post(
  '/',
  templateCreationValidation,
  validate,
  createTemplate
);

/**
 * GET /api/templates/:templateId
 * Get a specific template
 */
router.get('/:templateId', getTemplate);

/**
 * PUT /api/templates/:templateId
 * Update a template
 */
router.put('/:templateId', updateTemplate);

/**
 * DELETE /api/templates/:templateId
 * Delete a template
 */
router.delete('/:templateId', deleteTemplate);

/**
 * POST /api/templates/:templateId/set-default
 * Set template as default
 */
router.post('/:templateId/set-default', setDefaultTemplate);

/**
 * POST /api/templates/:templateId/apply
 * Apply template to a week
 */
router.post(
  '/:templateId/apply',
  applyTemplateValidation,
  validate,
  applyTemplate
);

/**
 * POST /api/templates/:templateId/slots
 * Add a time slot to template
 */
router.post(
  '/:templateId/slots',
  timeSlotValidation,
  validate,
  addTimeSlot
);

/**
 * DELETE /api/templates/:templateId/slots/:slotId
 * Remove a time slot from template
 */
router.delete('/:templateId/slots/:slotId', removeTimeSlot);

/**
 * POST /api/templates/:templateId/rate
 * Rate a template
 */
router.post(
  '/:templateId/rate',
  ratingValidation,
  validate,
  rateTemplate
);

/**
 * GET /api/templates/suggestions/:templateType
 * Get template suggestions based on type
 */
router.get('/suggestions/:templateType', getTemplateSuggestions);

module.exports = router;
