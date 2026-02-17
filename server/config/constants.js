module.exports = {
  // Stress level thresholds
  STRESS_THRESHOLDS: {
    LOW: 3,
    MODERATE: 5,
    HIGH: 7,
    CRITICAL: 9
  },

  // Energy level thresholds
  ENERGY_THRESHOLDS: {
    LOW: 3,
    MODERATE: 5,
    HIGH: 7
  },

  // Mood categories
  MOOD_CATEGORIES: {
    VERY_LOW: 1,
    LOW: 3,
    NEUTRAL: 5,
    GOOD: 7,
    EXCELLENT: 9
  },

  // Task priorities
  TASK_PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Intervention types
  INTERVENTION_TYPES: {
    BREATHING: 'breathing',
    MEDITATION: 'meditation',
    EXERCISE: 'exercise',
    BREAK: 'break',
    POMODORO: 'pomodoro',
    JOURNALING: 'journaling',
    SOCIAL: 'social'
  },

  // Prediction confidence levels
  PREDICTION_CONFIDENCE: {
    LOW: 0.5,
    MEDIUM: 0.7,
    HIGH: 0.85
  },

  // Default productive hours (can be personalized per user)
  DEFAULT_PRODUCTIVE_HOURS: {
    morning: { start: 9, end: 12 },
    afternoon: { start: 14, end: 17 },
    evening: { start: 19, end: 21 }
  }
};
