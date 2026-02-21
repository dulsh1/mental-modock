/**
 * Stress Prediction Service
 * Time-series forecasting using simplified ARIMA-like algorithm
 * Predicts stress levels 24-48 hours ahead with confidence intervals
 */

const MentalHealthLog = require('../../models/MentalHealthLog');
const Journal = require('../../models/Journal');
const Task = require('../../models/Task');
const Prediction = require('../../models/Prediction');

/**
 * Simple moving average calculation
 */
function movingAverage(data, window = 3) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(avg);
  }
  return result;
}

/**
 * Calculate trend using linear regression
 */
function calculateTrend(data) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 5 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 5 : intercept };
}

/**
 * Detect seasonality patterns (day of week effects)
 */
function detectSeasonality(logs) {
  const dayAverages = Array(7).fill(null).map(() => ({ sum: 0, count: 0 }));
  
  logs.forEach(log => {
    const day = new Date(log.date).getDay();
    dayAverages[day].sum += log.stress?.score || log.stress || 5;
    dayAverages[day].count++;
  });

  return dayAverages.map(d => d.count > 0 ? d.sum / d.count : 5);
}

/**
 * Calculate prediction confidence interval
 */
function calculateConfidenceInterval(predictions, actualValues) {
  if (actualValues.length < 3) {
    return { lower: 0.5, upper: 0.5 }; // Default 50% interval
  }

  // Calculate standard error
  let sumSquaredError = 0;
  const minLen = Math.min(predictions.length, actualValues.length);
  
  for (let i = 0; i < minLen; i++) {
    sumSquaredError += Math.pow(predictions[i] - actualValues[i], 2);
  }
  
  const standardError = Math.sqrt(sumSquaredError / minLen);
  const confidenceMultiplier = 1.96; // 95% confidence
  
  return {
    lower: standardError * confidenceMultiplier,
    upper: standardError * confidenceMultiplier
  };
}

/**
 * ARIMA-like prediction for stress levels
 */
function arimaPrediction(historicalData, horizon = 1) {
  if (historicalData.length < 7) {
    // Not enough data, return average
    const avg = historicalData.length > 0 
      ? historicalData.reduce((a, b) => a + b, 0) / historicalData.length 
      : 5;
    return {
      predicted: avg,
      confidence: 0.3,
      method: 'average'
    };
  }

  // Calculate components
  const ma = movingAverage(historicalData, 3);
  const trend = calculateTrend(historicalData);
  
  // Autoregressive component (weighted recent values)
  const weights = [0.4, 0.3, 0.2, 0.1];
  let arComponent = 0;
  for (let i = 0; i < Math.min(weights.length, historicalData.length); i++) {
    arComponent += weights[i] * historicalData[historicalData.length - 1 - i];
  }

  // Combine components
  const trendPrediction = trend.slope * (historicalData.length + horizon) + trend.intercept;
  const maPrediction = ma[ma.length - 1];
  
  // Weighted ensemble
  const predicted = 0.4 * arComponent + 0.3 * trendPrediction + 0.3 * maPrediction;
  
  // Clamp to valid range
  const clampedPrediction = Math.max(1, Math.min(10, predicted));
  
  // Calculate confidence based on data stability
  const variance = calculateVariance(historicalData);
  const confidence = Math.max(0.3, Math.min(0.95, 1 - variance / 10));

  return {
    predicted: Math.round(clampedPrediction * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    method: 'arima'
  };
}

/**
 * Calculate variance
 */
function calculateVariance(data) {
  if (data.length < 2) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Analyze contributing factors
 */
async function analyzeContributingFactors(userId, targetDate) {
  const factors = [];
  
  // Day of week effect
  const dayOfWeek = new Date(targetDate).getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Get historical data for this day
  const logs = await MentalHealthLog.find({ user: userId }).sort({ date: -1 }).limit(90);
  const dayAverages = detectSeasonality(logs);
  const overallAvg = logs.reduce((sum, l) => sum + (l.stress?.score || 5), 0) / logs.length;
  
  const dayEffect = dayAverages[dayOfWeek] - overallAvg;
  if (Math.abs(dayEffect) > 0.5) {
    factors.push({
      factor: 'day_of_week',
      impact: dayEffect / 5, // Normalize to -1 to 1
      description: `${dayNames[dayOfWeek]}s typically show ${dayEffect > 0 ? 'higher' : 'lower'} stress levels`
    });
  }

  // Check upcoming deadlines
  const upcomingTasks = await Task.find({
    user: userId,
    dueDate: { 
      $gte: new Date(), 
      $lte: new Date(targetDate.getTime() + 48 * 60 * 60 * 1000) 
    },
    status: { $ne: 'completed' }
  });

  if (upcomingTasks.length > 3) {
    factors.push({
      factor: 'workload',
      impact: Math.min(upcomingTasks.length / 10, 1),
      description: `${upcomingTasks.length} tasks due around this time`
    });
  }

  const urgentTasks = upcomingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  if (urgentTasks.length > 0) {
    factors.push({
      factor: 'deadline_approaching',
      impact: Math.min(urgentTasks.length / 5, 1),
      description: `${urgentTasks.length} high-priority deadlines approaching`
    });
  }

  // Sleep pattern analysis
  const recentLogs = logs.slice(0, 7);
  const avgSleep = recentLogs.reduce((sum, l) => sum + (l.sleep?.hours || 7), 0) / recentLogs.length;
  if (avgSleep < 6) {
    factors.push({
      factor: 'sleep_pattern',
      impact: (6 - avgSleep) / 6,
      description: 'Recent sleep duration below optimal levels'
    });
  }

  // Activity level
  const avgActivities = recentLogs.reduce((sum, l) => sum + (l.activities?.length || 0), 0) / recentLogs.length;
  if (avgActivities < 1) {
    factors.push({
      factor: 'activity_level',
      impact: 0.3,
      description: 'Low physical/social activity in recent days'
    });
  }

  // Journal sentiment
  const recentJournals = await Journal.find({ user: userId })
    .sort({ date: -1 })
    .limit(7);
  
  if (recentJournals.length > 0) {
    const avgSentiment = recentJournals.reduce((sum, j) => sum + (j.sentiment?.score || 0), 0) / recentJournals.length;
    if (avgSentiment < -0.2) {
      factors.push({
        factor: 'journal_sentiment',
        impact: Math.abs(avgSentiment),
        description: 'Recent journal entries show negative sentiment'
      });
    }
  }

  return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

/**
 * Identify recurring patterns
 */
async function identifyPatterns(userId) {
  const logs = await MentalHealthLog.find({ user: userId })
    .sort({ date: -1 })
    .limit(90);

  const patterns = [];

  // Day of week patterns
  const dayData = {};
  logs.forEach(log => {
    const day = new Date(log.date).getDay();
    if (!dayData[day]) dayData[day] = [];
    dayData[day].push(log.stress?.score || 5);
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  Object.entries(dayData).forEach(([day, values]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg > 6) {
      patterns.push({
        pattern: `High stress on ${dayNames[day]}s`,
        frequency: values.length,
        lastOccurred: logs.find(l => new Date(l.date).getDay() === parseInt(day))?.date,
        correlation: avg / 10
      });
    }
  });

  // Sleep-stress correlation
  const sleepStressCorrelation = calculateCorrelation(
    logs.map(l => l.sleep?.hours || 7),
    logs.map(l => l.stress?.score || 5)
  );

  if (Math.abs(sleepStressCorrelation) > 0.3) {
    patterns.push({
      pattern: sleepStressCorrelation < 0 
        ? 'Poor sleep correlates with higher stress' 
        : 'Good sleep correlates with stress management',
      frequency: logs.length,
      lastOccurred: logs[0]?.date,
      correlation: Math.abs(sleepStressCorrelation)
    });
  }

  return patterns;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Determine risk level based on predicted stress
 */
function determineRiskLevel(predictedStress, confidence, factors) {
  const baseRisk = predictedStress / 10;
  const factorImpact = factors.reduce((sum, f) => sum + Math.max(0, f.impact), 0) / factors.length;
  const combinedRisk = 0.7 * baseRisk + 0.3 * factorImpact;

  if (combinedRisk >= 0.8 || predictedStress >= 9) return 'critical';
  if (combinedRisk >= 0.6 || predictedStress >= 7) return 'high';
  if (combinedRisk >= 0.4 || predictedStress >= 5) return 'moderate';
  return 'low';
}

/**
 * Generate recommendations based on prediction
 */
function generateRecommendations(riskLevel, factors) {
  const recommendations = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push({
      type: 'professional_help',
      priority: 'high',
      description: 'Consider speaking with a mental health professional or counselor',
      actionable: true
    });
    recommendations.push({
      type: 'mindfulness',
      priority: 'high',
      description: 'Try our guided breathing exercises or meditation',
      actionable: true
    });
  }

  if (riskLevel === 'high' || riskLevel === 'moderate') {
    recommendations.push({
      type: 'rest',
      priority: 'medium',
      description: 'Schedule some downtime and ensure adequate sleep',
      actionable: true
    });
  }

  // Factor-specific recommendations
  factors.forEach(factor => {
    if (factor.factor === 'sleep_pattern' && factor.impact > 0.3) {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        description: 'Prioritize getting 7-8 hours of sleep tonight',
        actionable: true
      });
    }
    if (factor.factor === 'activity_level') {
      recommendations.push({
        type: 'exercise',
        priority: 'medium',
        description: 'A short walk or light exercise can help reduce stress',
        actionable: true
      });
    }
    if (factor.factor === 'workload' || factor.factor === 'deadline_approaching') {
      recommendations.push({
        type: 'activity',
        priority: 'medium',
        description: 'Break down tasks into smaller chunks using our AI task breakdown',
        actionable: true
      });
    }
  });

  // Default low-risk recommendations
  if (riskLevel === 'low') {
    recommendations.push({
      type: 'social',
      priority: 'low',
      description: 'Great stress levels! Consider connecting with friends or family',
      actionable: false
    });
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

/**
 * Main prediction function
 */
async function generatePrediction(userId, horizon = 24) {
  try {
    // Get historical data
    const logs = await MentalHealthLog.find({ user: userId })
      .sort({ date: -1 })
      .limit(90);

    if (logs.length < 3) {
      return {
        success: false,
        message: 'Not enough historical data for prediction (minimum 3 days required)',
        minimumDataRequired: 3,
        currentDataPoints: logs.length
      };
    }

    // Extract stress values
    const stressValues = logs.map(l => l.stress?.score || l.stress || 5).reverse();
    const moodValues = logs.map(l => l.mood?.score || l.mood || 5).reverse();
    const energyValues = logs.map(l => l.energy?.score || l.energy || 5).reverse();

    // Calculate target date
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + horizon);

    // Generate predictions
    const stressPrediction = arimaPrediction(stressValues, horizon / 24);
    const moodPrediction = arimaPrediction(moodValues, horizon / 24);
    const energyPrediction = arimaPrediction(energyValues, horizon / 24);

    // Calculate confidence intervals
    const stressCI = calculateConfidenceInterval(
      stressValues.slice(-7),
      stressValues.slice(-14, -7)
    );

    // Analyze contributing factors
    const factors = await analyzeContributingFactors(userId, targetDate);

    // Identify patterns
    const patterns = await identifyPatterns(userId);

    // Determine risk level
    const riskLevel = determineRiskLevel(stressPrediction.predicted, stressPrediction.confidence, factors);

    // Generate recommendations
    const recommendations = generateRecommendations(riskLevel, factors);

    // Create prediction record
    const prediction = new Prediction({
      user: userId,
      targetDate,
      horizon,
      predictions: {
        stress: {
          predicted: stressPrediction.predicted,
          confidence: stressPrediction.confidence,
          lowerBound: Math.max(1, stressPrediction.predicted - stressCI.lower),
          upperBound: Math.min(10, stressPrediction.predicted + stressCI.upper)
        },
        mood: {
          predicted: moodPrediction.predicted,
          confidence: moodPrediction.confidence,
          lowerBound: Math.max(1, moodPrediction.predicted - 1),
          upperBound: Math.min(10, moodPrediction.predicted + 1)
        },
        energy: {
          predicted: energyPrediction.predicted,
          confidence: energyPrediction.confidence,
          lowerBound: Math.max(1, energyPrediction.predicted - 1),
          upperBound: Math.min(10, energyPrediction.predicted + 1)
        }
      },
      riskLevel,
      contributingFactors: factors,
      patterns: patterns.slice(0, 5),
      modelInfo: {
        algorithm: 'ensemble',
        version: '1.0.0',
        trainingDataPoints: logs.length,
        modelAccuracy: stressPrediction.confidence
      },
      recommendations
    });

    await prediction.save();

    return {
      success: true,
      prediction: {
        id: prediction._id,
        targetDate: prediction.targetDate,
        horizon: prediction.horizon,
        predictions: prediction.predictions,
        riskLevel: prediction.riskLevel,
        contributingFactors: prediction.contributingFactors,
        patterns: prediction.patterns,
        recommendations: prediction.recommendations,
        confidence: stressPrediction.confidence,
        modelAccuracy: logs.length >= 30 ? 0.75 : 0.6 // Estimated accuracy
      }
    };
  } catch (error) {
    console.error('Prediction error:', error);
    return {
      success: false,
      message: 'Error generating prediction',
      error: error.message
    };
  }
}

/**
 * Update prediction with actual values (for accuracy tracking)
 */
async function updatePredictionWithActuals(predictionId, actualStress, actualMood, actualEnergy) {
  try {
    const prediction = await Prediction.findById(predictionId);
    if (!prediction) {
      return { success: false, message: 'Prediction not found' };
    }

    // Calculate errors
    const stressError = Math.abs(prediction.predictions.stress.predicted - actualStress);
    const moodError = Math.abs(prediction.predictions.mood.predicted - actualMood);
    const energyError = Math.abs(prediction.predictions.energy.predicted - actualEnergy);
    
    // Overall accuracy (1 - normalized error)
    const overallAccuracy = 1 - ((stressError + moodError + energyError) / 3) / 10;

    prediction.actuals = {
      stress: actualStress,
      mood: actualMood,
      energy: actualEnergy,
      recordedAt: new Date()
    };

    prediction.accuracy = {
      stressError,
      moodError,
      energyError,
      overallAccuracy: Math.max(0, overallAccuracy)
    };

    await prediction.save();

    return {
      success: true,
      accuracy: prediction.accuracy
    };
  } catch (error) {
    console.error('Error updating prediction:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get prediction accuracy metrics
 */
async function getPredictionAccuracy(userId) {
  return await Prediction.calculateModelAccuracy(userId);
}

module.exports = {
  generatePrediction,
  updatePredictionWithActuals,
  getPredictionAccuracy,
  analyzeContributingFactors,
  identifyPatterns,
  arimaPrediction
};
