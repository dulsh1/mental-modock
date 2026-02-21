const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createMoodEntry,
  getTodayMood,
  getMoodHistory,
  getMoodStats,
  createJournalEntry,
  getJournalEntries,
  getJournalInsights,
  getReflectionPrompt,
  generateStressPrediction,
  getPredictions,
  getPredictionAlerts,
  getPredictionAccuracy,
  acknowledgePrediction,
  getCalendarData,
  getAnalytics
} = require('../controllers/mentalHealthAdvanced.controller');

// All routes require authentication
router.use(protect);

// ==================== MOOD TRACKING ====================
router.post('/mood', createMoodEntry);
router.get('/mood/today', getTodayMood);
router.get('/mood/history', getMoodHistory);
router.get('/mood/stats', getMoodStats);

// ==================== JOURNAL ====================
router.post('/journal', createJournalEntry);
router.get('/journal', getJournalEntries);
router.get('/journal/insights', getJournalInsights);
router.get('/journal/prompt', getReflectionPrompt);

// ==================== PREDICTIONS ====================
router.post('/predictions/generate', generateStressPrediction);
router.get('/predictions', getPredictions);
router.get('/predictions/alerts', getPredictionAlerts);
router.get('/predictions/accuracy', getPredictionAccuracy);
router.put('/predictions/:id/acknowledge', acknowledgePrediction);

// ==================== CALENDAR & ANALYTICS ====================
router.get('/calendar', getCalendarData);
router.get('/analytics', getAnalytics);

module.exports = router;
