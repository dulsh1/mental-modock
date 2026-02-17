const WellnessIntervention = require('../../models/WellnessIntervention');
const { wellnessExercises } = require('./exercises');
const { STRESS_THRESHOLDS, ENERGY_THRESHOLDS } = require('../../config/constants');

/**
 * Get recommended interventions based on user's current state
 */
async function getRecommendedInterventions(userId, todayLog, pendingTaskCount) {
  const recommendations = [];
  
  // Analyze current state
  const state = analyzeCurrentState(todayLog, pendingTaskCount);
  
  // Get user's historical effectiveness
  const effectiveness = await WellnessIntervention.getEffectiveness(userId);
  
  // Get most effective intervention types for this user
  const effectiveTypes = effectiveness
    .filter(e => e.avgMoodImprovement > 0)
    .map(e => e._id);

  // High stress interventions
  if (state.stressLevel === 'high' || state.stressLevel === 'critical') {
    recommendations.push(...getStressInterventions(effectiveTypes));
  }

  // Low energy interventions
  if (state.energyLevel === 'low') {
    recommendations.push(...getEnergyInterventions(effectiveTypes));
  }

  // Low mood interventions
  if (state.moodLevel === 'low') {
    recommendations.push(...getMoodInterventions(effectiveTypes));
  }

  // Task overload interventions
  if (state.taskOverload) {
    recommendations.push({
      type: 'pomodoro',
      reason: 'You have many tasks. Try the Pomodoro technique for better focus.',
      priority: 'medium',
      exercise: wellnessExercises.find(e => e.type === 'pomodoro')
    });
  }

  // Long work session (if logged activities show extended work)
  if (state.longWorkSession) {
    recommendations.push({
      type: 'break',
      reason: 'You\'ve been working for a while. Time for a break!',
      priority: 'high',
      exercise: wellnessExercises.find(e => e.type === 'break')
    });
  }

  // Default recommendation if nothing specific
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'meditation',
      reason: 'A quick mindfulness session can help maintain your well-being.',
      priority: 'low',
      exercise: wellnessExercises.find(e => e.id === 'quick-meditation')
    });
  }

  // Sort by priority and return top 3
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 3);
}

/**
 * Analyze the current state from log data
 */
function analyzeCurrentState(todayLog, pendingTaskCount) {
  const state = {
    stressLevel: 'normal',
    energyLevel: 'normal',
    moodLevel: 'normal',
    taskOverload: false,
    longWorkSession: false
  };

  if (todayLog) {
    // Stress level
    const stress = todayLog.stress?.score || 5;
    if (stress >= STRESS_THRESHOLDS.CRITICAL) {
      state.stressLevel = 'critical';
    } else if (stress >= STRESS_THRESHOLDS.HIGH) {
      state.stressLevel = 'high';
    } else if (stress <= STRESS_THRESHOLDS.LOW) {
      state.stressLevel = 'low';
    }

    // Energy level
    const energy = todayLog.energy?.score || 5;
    if (energy <= ENERGY_THRESHOLDS.LOW) {
      state.energyLevel = 'low';
    } else if (energy >= ENERGY_THRESHOLDS.HIGH) {
      state.energyLevel = 'high';
    }

    // Mood level
    const mood = todayLog.mood?.score || 5;
    if (mood <= 3) {
      state.moodLevel = 'low';
    } else if (mood >= 7) {
      state.moodLevel = 'high';
    }

    // Check for long work sessions
    const workActivities = todayLog.activities?.filter(a => a.type === 'work') || [];
    const totalWorkMinutes = workActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    state.longWorkSession = totalWorkMinutes >= 180; // 3+ hours
  }

  // Task overload
  state.taskOverload = pendingTaskCount >= 10;

  return state;
}

/**
 * Get interventions for high stress
 */
function getStressInterventions(effectiveTypes) {
  const interventions = [];
  
  // Breathing exercises are universally helpful
  interventions.push({
    type: 'breathing',
    reason: 'High stress detected. Try a breathing exercise to calm your nervous system.',
    priority: 'high',
    exercise: wellnessExercises.find(e => e.id === 'box-breathing')
  });

  // If meditation has been effective
  if (effectiveTypes.includes('meditation')) {
    interventions.push({
      type: 'meditation',
      reason: 'Meditation has helped you before. A guided session might help now.',
      priority: 'medium',
      exercise: wellnessExercises.find(e => e.id === 'stress-relief-meditation')
    });
  }

  return interventions;
}

/**
 * Get interventions for low energy
 */
function getEnergyInterventions(effectiveTypes) {
  const interventions = [];

  // Quick physical movement
  interventions.push({
    type: 'exercise',
    reason: 'Low energy detected. A quick movement break can help boost your energy.',
    priority: 'high',
    exercise: wellnessExercises.find(e => e.id === 'desk-stretches')
  });

  // Suggest break
  interventions.push({
    type: 'break',
    reason: 'You might need a proper break. Step away for a few minutes.',
    priority: 'medium',
    exercise: wellnessExercises.find(e => e.id === 'mindful-break')
  });

  return interventions;
}

/**
 * Get interventions for low mood
 */
function getMoodInterventions(effectiveTypes) {
  const interventions = [];

  // Journaling can help process emotions
  interventions.push({
    type: 'journaling',
    reason: 'Writing down your thoughts can help process emotions.',
    priority: 'medium',
    exercise: wellnessExercises.find(e => e.id === 'gratitude-journal')
  });

  // Social suggestion
  interventions.push({
    type: 'social',
    reason: 'Consider reaching out to someone you trust.',
    priority: 'low',
    exercise: null
  });

  return interventions;
}

module.exports = {
  getRecommendedInterventions,
  analyzeCurrentState
};
