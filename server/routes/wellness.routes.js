const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInterventions,
  getExercises,
  getExercise,
  startIntervention,
  completeIntervention,
  dismissIntervention,
  getHistory,
  getStats
} = require('../controllers/wellness.controller');

// All routes require authentication
router.use(protect);

// Routes
router.get('/interventions', getInterventions);
router.get('/exercises', getExercises);
router.get('/exercises/:id', getExercise);
router.post('/start', startIntervention);
router.put('/complete/:id', completeIntervention);
router.put('/dismiss/:id', dismissIntervention);
router.get('/history', getHistory);
router.get('/stats', getStats);

module.exports = router;
