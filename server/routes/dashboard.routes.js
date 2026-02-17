const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboard,
  getWeeklySummary
} = require('../controllers/dashboard.controller');

// All routes require authentication
router.use(protect);

// Routes
router.get('/', getDashboard);
router.get('/weekly-summary', getWeeklySummary);

module.exports = router;
