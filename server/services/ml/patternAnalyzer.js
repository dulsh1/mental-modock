const ss = require('simple-statistics');
const MentalHealthLog = require('../../models/MentalHealthLog');

/**
 * Analyze patterns in mental health data
 */
async function analyzePatterns(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await MentalHealthLog.find({
    user: userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });

  if (logs.length < 7) {
    return {
      hasEnoughData: false,
      message: 'Need at least 7 days of data for pattern analysis'
    };
  }

  return {
    hasEnoughData: true,
    dayOfWeekPatterns: analyzeDayOfWeekPatterns(logs),
    correlations: analyzeCorrelations(logs),
    triggers: analyzeStressTriggers(logs),
    trends: analyzeTrends(logs),
    insights: generateInsights(logs)
  };
}

/**
 * Analyze patterns by day of week
 */
function analyzeDayOfWeekPatterns(logs) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData = {};

  // Initialize
  for (let i = 0; i < 7; i++) {
    dayData[i] = { mood: [], stress: [], energy: [] };
  }

  // Collect data by day
  logs.forEach(log => {
    const day = new Date(log.date).getDay();
    dayData[day].mood.push(log.mood.score);
    dayData[day].stress.push(log.stress.score);
    dayData[day].energy.push(log.energy.score);
  });

  // Calculate averages
  const patterns = [];
  for (let i = 0; i < 7; i++) {
    if (dayData[i].mood.length > 0) {
      patterns.push({
        day: dayNames[i],
        dayIndex: i,
        avgMood: Math.round(ss.mean(dayData[i].mood) * 10) / 10,
        avgStress: Math.round(ss.mean(dayData[i].stress) * 10) / 10,
        avgEnergy: Math.round(ss.mean(dayData[i].energy) * 10) / 10,
        dataPoints: dayData[i].mood.length
      });
    }
  }

  // Find best and worst days
  const sortedByMood = [...patterns].sort((a, b) => b.avgMood - a.avgMood);
  const sortedByStress = [...patterns].sort((a, b) => a.avgStress - b.avgStress);

  return {
    byDay: patterns,
    bestMoodDay: sortedByMood[0]?.day || null,
    worstMoodDay: sortedByMood[sortedByMood.length - 1]?.day || null,
    lowestStressDay: sortedByStress[0]?.day || null,
    highestStressDay: sortedByStress[sortedByStress.length - 1]?.day || null
  };
}

/**
 * Analyze correlations between different metrics
 */
function analyzeCorrelations(logs) {
  if (logs.length < 5) return null;

  const moodScores = logs.map(l => l.mood.score);
  const stressScores = logs.map(l => l.stress.score);
  const energyScores = logs.map(l => l.energy.score);
  const sleepHours = logs.filter(l => l.sleep?.hours).map(l => l.sleep.hours);

  const correlations = {
    moodStress: calculateCorrelation(moodScores, stressScores),
    moodEnergy: calculateCorrelation(moodScores, energyScores),
    stressEnergy: calculateCorrelation(stressScores, energyScores)
  };

  // Sleep correlations if enough data
  if (sleepHours.length >= 5) {
    const logsWithSleep = logs.filter(l => l.sleep?.hours);
    correlations.sleepMood = calculateCorrelation(
      logsWithSleep.map(l => l.sleep.hours),
      logsWithSleep.map(l => l.mood.score)
    );
    correlations.sleepStress = calculateCorrelation(
      logsWithSleep.map(l => l.sleep.hours),
      logsWithSleep.map(l => l.stress.score)
    );
  }

  return correlations;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length < 3) return null;
  
  try {
    const correlation = ss.sampleCorrelation(x, y);
    return Math.round(correlation * 100) / 100;
  } catch {
    return null;
  }
}

/**
 * Analyze stress triggers
 */
function analyzeStressTriggers(logs) {
  const triggerCounts = {};
  const triggerStressSum = {};

  logs.forEach(log => {
    if (log.stress?.triggers) {
      log.stress.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        triggerStressSum[trigger] = (triggerStressSum[trigger] || 0) + log.stress.score;
      });
    }
  });

  const triggers = Object.keys(triggerCounts).map(trigger => ({
    trigger,
    count: triggerCounts[trigger],
    avgStressWhenPresent: Math.round((triggerStressSum[trigger] / triggerCounts[trigger]) * 10) / 10
  }));

  return triggers.sort((a, b) => b.count - a.count);
}

/**
 * Analyze trends over time
 */
function analyzeTrends(logs) {
  const moodData = logs.map((log, i) => [i, log.mood.score]);
  const stressData = logs.map((log, i) => [i, log.stress.score]);
  const energyData = logs.map((log, i) => [i, log.energy.score]);

  const moodTrend = ss.linearRegression(moodData);
  const stressTrend = ss.linearRegression(stressData);
  const energyTrend = ss.linearRegression(energyData);

  return {
    mood: {
      slope: Math.round(moodTrend.m * 1000) / 1000,
      direction: moodTrend.m > 0.05 ? 'improving' : moodTrend.m < -0.05 ? 'declining' : 'stable'
    },
    stress: {
      slope: Math.round(stressTrend.m * 1000) / 1000,
      direction: stressTrend.m > 0.05 ? 'increasing' : stressTrend.m < -0.05 ? 'decreasing' : 'stable'
    },
    energy: {
      slope: Math.round(energyTrend.m * 1000) / 1000,
      direction: energyTrend.m > 0.05 ? 'improving' : energyTrend.m < -0.05 ? 'declining' : 'stable'
    }
  };
}

/**
 * Generate insights based on patterns
 */
function generateInsights(logs) {
  const insights = [];
  
  // Calculate overall stats
  const moodScores = logs.map(l => l.mood.score);
  const stressScores = logs.map(l => l.stress.score);
  const avgMood = ss.mean(moodScores);
  const avgStress = ss.mean(stressScores);

  // Mood insight
  if (avgMood >= 7) {
    insights.push({
      type: 'positive',
      category: 'mood',
      message: 'Your average mood has been great! Keep up the positive habits.'
    });
  } else if (avgMood <= 4) {
    insights.push({
      type: 'attention',
      category: 'mood',
      message: 'Your mood has been lower than usual. Consider talking to someone or trying new wellness activities.'
    });
  }

  // Stress insight
  if (avgStress >= 7) {
    insights.push({
      type: 'warning',
      category: 'stress',
      message: 'Your stress levels have been consistently high. Consider stress management techniques.'
    });
  }

  // Consistency insight
  const loggedDays = logs.length;
  const totalDays = Math.ceil((new Date() - new Date(logs[0].date)) / (1000 * 60 * 60 * 24)) + 1;
  const consistency = loggedDays / totalDays;

  if (consistency >= 0.8) {
    insights.push({
      type: 'positive',
      category: 'consistency',
      message: `Great consistency! You've logged ${Math.round(consistency * 100)}% of days.`
    });
  } else if (consistency < 0.5) {
    insights.push({
      type: 'suggestion',
      category: 'consistency',
      message: 'Try to log more consistently for better insights and predictions.'
    });
  }

  return insights;
}

module.exports = {
  analyzePatterns,
  analyzeDayOfWeekPatterns,
  analyzeCorrelations,
  analyzeTrends
};
