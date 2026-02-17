const ss = require('simple-statistics');
const MentalHealthLog = require('../../models/MentalHealthLog');
const Task = require('../../models/Task');
const StressPrediction = require('../../models/StressPrediction');
const User = require('../../models/User');

/**
 * Predict stress level for the next day using linear regression
 * and multiple contributing factors
 */
async function predictStress(userId) {
  try {
    // Get historical data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await MentalHealthLog.find({
      user: userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    if (logs.length < 7) {
      return {
        prediction: null,
        message: 'Need at least 7 days of data for prediction',
        confidence: 0
      };
    }

    // Prepare data for linear regression
    const stressData = logs.map((log, index) => [index, log.stress.score]);
    
    // Calculate linear regression
    const regression = ss.linearRegression(stressData);
    const regressionLine = ss.linearRegressionLine(regression);
    
    // Predict next day's stress (base prediction)
    const basePrediction = regressionLine(logs.length);

    // Calculate R-squared for confidence
    const predicted = stressData.map(d => regressionLine(d[0]));
    const actual = stressData.map(d => d[1]);
    const rSquared = ss.rSquared(actual, predicted);

    // Factor analysis
    const factors = await calculateFactors(userId, logs);

    // Weighted prediction combining regression and factors
    const weightedPrediction = calculateWeightedPrediction(basePrediction, factors);

    // Clamp prediction between 1 and 10
    const finalPrediction = Math.max(1, Math.min(10, Math.round(weightedPrediction * 10) / 10));

    // Calculate confidence based on data quality and R-squared
    const confidence = calculateConfidence(logs.length, rSquared, factors);

    // Generate recommendation
    const recommendation = generateRecommendation(finalPrediction, factors);

    // Save prediction
    const predictionDoc = await StressPrediction.create({
      user: userId,
      predictionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      predictedStressLevel: finalPrediction,
      confidence,
      factors,
      recommendation
    });

    return {
      prediction: finalPrediction,
      confidence,
      factors,
      recommendation,
      trend: regression.m > 0 ? 'increasing' : regression.m < 0 ? 'decreasing' : 'stable',
      slope: regression.m,
      predictionId: predictionDoc._id
    };
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

/**
 * Calculate various factors that influence stress
 */
async function calculateFactors(userId, logs) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

  // Task load factor
  const pendingTasks = await Task.find({
    user: userId,
    status: { $in: ['pending', 'in_progress'] }
  });

  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  
  // Tasks due tomorrow
  const tasksDueTomorrow = pendingTasks.filter(t => 
    t.dueDate && t.dueDate >= tomorrow && t.dueDate < endOfTomorrow
  );

  const taskLoadScore = Math.min(10, (pendingTasks.length * 0.5) + (urgentTasks.length * 1.5) + (tasksDueTomorrow.length * 2));

  // Historical pattern for day of week
  const tomorrowDayOfWeek = tomorrow.getDay();
  const sameDayLogs = logs.filter(log => new Date(log.date).getDay() === tomorrowDayOfWeek);
  const dayOfWeekAverage = sameDayLogs.length > 0
    ? sameDayLogs.reduce((sum, log) => sum + log.stress.score, 0) / sameDayLogs.length
    : 5;

  // Recent trend (last 3 days)
  const recentLogs = logs.slice(-3);
  const recentStress = recentLogs.map(log => log.stress.score);
  const recentTrend = recentLogs.length >= 2
    ? ss.linearRegression(recentStress.map((s, i) => [i, s])).m
    : 0;

  // Sleep pattern (last 7 days)
  const recentSleepLogs = logs.slice(-7).filter(log => log.sleep?.hours);
  const avgSleep = recentSleepLogs.length > 0
    ? recentSleepLogs.reduce((sum, log) => sum + log.sleep.hours, 0) / recentSleepLogs.length
    : 7;
  const sleepScore = avgSleep < 6 ? 3 : avgSleep < 7 ? 1 : avgSleep > 8 ? -1 : 0;

  return {
    taskLoad: {
      count: pendingTasks.length,
      urgentCount: urgentTasks.length,
      dueTomorrow: tasksDueTomorrow.length,
      score: taskLoadScore
    },
    historicalPattern: {
      dayOfWeek: tomorrowDayOfWeek,
      averageForDay: Math.round(dayOfWeekAverage * 10) / 10,
      score: dayOfWeekAverage
    },
    recentTrend: {
      direction: recentTrend > 0.3 ? 'increasing' : recentTrend < -0.3 ? 'decreasing' : 'stable',
      slope: Math.round(recentTrend * 100) / 100,
      score: recentTrend > 0 ? Math.min(2, recentTrend * 2) : Math.max(-2, recentTrend * 2)
    },
    sleepPattern: {
      recentAverage: Math.round(avgSleep * 10) / 10,
      score: sleepScore
    },
    upcomingDeadlines: {
      count: tasksDueTomorrow.length,
      score: Math.min(3, tasksDueTomorrow.length)
    }
  };
}

/**
 * Calculate weighted prediction from base prediction and factors
 */
function calculateWeightedPrediction(basePrediction, factors) {
  const weights = {
    base: 0.4,
    taskLoad: 0.2,
    historicalPattern: 0.15,
    recentTrend: 0.15,
    sleep: 0.1
  };

  return (
    basePrediction * weights.base +
    factors.taskLoad.score * weights.taskLoad +
    factors.historicalPattern.score * weights.historicalPattern +
    (basePrediction + factors.recentTrend.score) * weights.recentTrend +
    (basePrediction + factors.sleepPattern.score) * weights.sleep
  );
}

/**
 * Calculate prediction confidence
 */
function calculateConfidence(dataPoints, rSquared, factors) {
  // Base confidence from data quantity
  let confidence = Math.min(0.5, dataPoints / 60);
  
  // Adjust for R-squared (model fit)
  confidence += rSquared * 0.3;
  
  // Adjust for factor reliability
  const factorBonus = 0.2 * (
    (factors.taskLoad.count > 0 ? 0.3 : 0) +
    (factors.historicalPattern.averageForDay ? 0.4 : 0) +
    (factors.sleepPattern.recentAverage ? 0.3 : 0)
  );
  
  confidence += factorBonus;
  
  return Math.min(0.95, Math.round(confidence * 100) / 100);
}

/**
 * Generate personalized recommendation based on prediction
 */
function generateRecommendation(prediction, factors) {
  const recommendations = [];

  if (prediction >= 7) {
    recommendations.push('High stress predicted. Consider scheduling lighter tasks or taking breaks.');
    
    if (factors.taskLoad.urgentCount > 2) {
      recommendations.push('You have multiple urgent tasks. Try to delegate or reschedule some if possible.');
    }
    
    if (factors.sleepPattern.recentAverage < 7) {
      recommendations.push('Your recent sleep has been low. Prioritize rest tonight.');
    }

    recommendations.push('Consider starting the day with a brief meditation or breathing exercise.');
  } else if (prediction >= 5) {
    recommendations.push('Moderate stress expected. Stay mindful and take regular breaks.');
    
    if (factors.recentTrend.direction === 'increasing') {
      recommendations.push('Your stress has been trending up. Consider what activities help you decompress.');
    }
  } else {
    recommendations.push('Low stress predicted. Great time to tackle challenging tasks!');
    
    if (factors.taskLoad.count > 5) {
      recommendations.push('You have several pending tasks. Use this low-stress period productively.');
    }
  }

  return recommendations.join(' ');
}

/**
 * Run daily predictions for all active users (called by cron job)
 */
async function runDailyPredictions() {
  try {
    // Get users who have logged in the last 7 days
    const activeUsers = await User.find({
      'stats.lastLogDate': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    console.log(`Running predictions for ${activeUsers.length} active users`);

    for (const user of activeUsers) {
      try {
        await predictStress(user._id);
      } catch (error) {
        console.error(`Failed to predict for user ${user._id}:`, error.message);
      }
    }

    console.log('Daily predictions completed');
  } catch (error) {
    console.error('Daily prediction job failed:', error);
  }
}

module.exports = {
  predictStress,
  runDailyPredictions,
  calculateFactors
};
