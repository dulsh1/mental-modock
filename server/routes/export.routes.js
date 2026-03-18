const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  exportTimetablePDF,
  exportMonthlySchedulePDF,
  exportMonthlyScheduleExcel
} = require('../controllers/export.controller');

// All routes require authentication
router.use(protect);

// Validation rules
const scheduleExportValidation = [
  body('timeFormat')
    .optional()
    .isIn(['12h', '24h'])
    .withMessage('Time format must be 12h or 24h'),
  body('includeDetails')
    .optional()
    .isBoolean()
    .withMessage('Include details must be boolean')
];

const monthValidation = [
  body('yearMonth')
    .notEmpty()
    .withMessage('Year-month is required')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Year-month must be in YYYY-MM format')
];

// Routes

/**
 * POST /api/export/timetable-pdf/:templateId
 * Export timetable template as PDF
 */
router.post(
 '/timetable-pdf/:templateId',
  scheduleExportValidation,
  validate,
  exportTimetablePDF
);

/**
 * POST /api/export/monthly-schedule-pdf
 * Export monthly schedule overview as PDF
 */
router.post(
  '/monthly-schedule-pdf',
  monthValidation,
  validate,
  exportMonthlySchedulePDF
);

/**
 * POST /api/export/monthly-schedule-excel
 * Export monthly schedule overview as Excel
 */
router.post(
  '/monthly-schedule-excel',
  monthValidation,
  validate,
  exportMonthlyScheduleExcel
);

module.exports = router;
