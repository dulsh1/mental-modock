const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  createLog,
  getLogs,
  getLog,
  getTodayLog,
  getAnalytics,
  getStressPrediction,
  deleteLog
} = require('../controllers/mentalHealth.controller');

// Validation rules
const logValidation = [
  body('mood.score')
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood score must be between 1 and 10'),
  body('mood.label')
    .isIn(['very_low', 'low', 'neutral', 'good', 'excellent'])
    .withMessage('Invalid mood label'),
  body('energy.score')
    .isInt({ min: 1, max: 10 })
    .withMessage('Energy score must be between 1 and 10'),
  body('stress.score')
    .isInt({ min: 1, max: 10 })
    .withMessage('Stress score must be between 1 and 10')
];

// All routes require authentication
router.use(protect);

// Routes
router.post('/log', logValidation, validate, createLog);
router.get('/logs', getLogs);
router.get('/today', getTodayLog);
router.get('/analytics', getAnalytics);
router.get('/predict', getStressPrediction);
router.get('/log/:id', getLog);
router.delete('/log/:id', deleteLog);

module.exports = router;
