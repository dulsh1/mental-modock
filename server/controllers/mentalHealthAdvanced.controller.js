/**
 * Mental Health Controller
 * Handles all mental health related endpoints
 */

const MentalHealthLog = require('../models/MentalHealthLog');
const Journal = require('../models/Journal');
const Prediction = require('../models/Prediction');
const { analyzeJournal, getReflectionPrompt, generateInsights } = require('../services/ml/sentimentAnalysis');
const { generatePrediction, updatePredictionWithActuals, getPredictionAccuracy } = require('../services/ml/stressPrediction');

// ==================== MOOD TRACKING ====================

/**
 * Create a new mood entry
 * POST /api/mental-health/mood
 */
exports.createMoodEntry = async (req, res) => {
  try {
    const { mood, stress, energy, sleep, activities, journal, tags } = req.body;

    // Validate required fields
    if (!mood || !stress || !energy) {
      return res.status(400).json({
        success: false,
        message: 'Mood, stress, and energy scores are required'
      });
    }

    // Check if entry exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let existingLog = await MentalHealthLog.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // Prepare mood data with labels
    const getMoodLabel = (score) => {
      if (score <= 2) return 'very_low';
      if (score <= 4) return 'low';
      if (score <= 6) return 'neutral';
      if (score <= 8) return 'good';
      return 'excellent';
    };

    const getEnergyLabel = (score) => {
      if (score <= 2) return 'exhausted';
      if (score <= 4) return 'tired';
      if (score <= 6) return 'moderate';
      if (score <= 8) return 'energetic';
      return 'very_energetic';
    };

    const getStressLabel = (score) => {
      if (score <= 2) return 'very_low';
      if (score <= 4) return 'low';
      if (score <= 6) return 'moderate';
      if (score <= 8) return 'high';
      return 'very_high';
    };

    const logData = {
      user: req.user._id,
      date: new Date(),
      mood: {
        score: mood,
        label: getMoodLabel(mood)
      },
      stress: {
        score: stress,
        label: getStressLabel(stress),
        triggers: req.body.stressTriggers || []
      },
      energy: {
        score: energy,
        label: getEnergyLabel(energy)
      },
      sleep: sleep ? {
        hours: sleep.hours,
        quality: sleep.quality
      } : undefined,
      activities: activities || [],
      journal: journal ? {
        content: journal,
        gratitude: req.body.gratitude || [],
        highlights: req.body.highlights || [],
        challenges: req.body.challenges || []
      } : undefined,
      tags: tags || []
    };

    let log;
    if (existingLog) {
      // Update existing entry
      log = await MentalHealthLog.findByIdAndUpdate(
        existingLog._id,
        logData,
        { new: true }
      );
    } else {
      // Create new entry
      log = await MentalHealthLog.create(logData);
    }

    // Update any predictions with actual values
    const recentPredictions = await Prediction.find({
      user: req.user._id,
      targetDate: { 
        $gte: new Date(today.getTime() - 12 * 60 * 60 * 1000),
        $lte: new Date(today.getTime() + 12 * 60 * 60 * 1000)
      },
      'actuals.stress': { $exists: false }
    });

    for (const pred of recentPredictions) {
      await updatePredictionWithActuals(pred._id, stress, mood, energy);
    }

    res.status(existingLog ? 200 : 201).json({
      success: true,
      message: existingLog ? 'Mood entry updated' : 'Mood entry created',
      data: log
    });
  } catch (error) {
    console.error('Create mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating mood entry',
      error: error.message
    });
  }
};

/**
 * Get today's mood entry
 * GET /api/mental-health/mood/today
 */
exports.getTodayMood = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const log = await MentalHealthLog.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      data: log,
      hasEntry: !!log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s mood',
      error: error.message
    });
  }
};

/**
 * Get mood history
 * GET /api/mental-health/mood/history
 */
exports.getMoodHistory = async (req, res) => {
  try {
    const { days = 30, startDate, endDate } = req.query;

    let query = { user: req.user._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const start = new Date();
      start.setDate(start.getDate() - parseInt(days));
      query.date = { $gte: start };
    }

    const logs = await MentalHealthLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(days));

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mood history',
      error: error.message
    });
  }
};

/**
 * Get mood statistics
 * GET /api/mental-health/mood/stats
 */
exports.getMoodStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const averages = await MentalHealthLog.calculateAverages(req.user._id, parseInt(days));
    
    // Get weekly trend
    const weeklyData = await MentalHealthLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgMood: { $avg: '$mood.score' },
          avgStress: { $avg: '$stress.score' },
          avgEnergy: { $avg: '$energy.score' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get stress triggers distribution
    const triggerStats = await MentalHealthLog.aggregate([
      {
        $match: {
          user: req.user._id,
          'stress.triggers': { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$stress.triggers' },
      {
        $group: {
          _id: '$stress.triggers',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        averages,
        weeklyTrend: weeklyData,
        stressTriggers: triggerStats,
        totalEntries: averages.count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mood statistics',
      error: error.message
    });
  }
};

// ==================== JOURNAL ====================

/**
 * Create a journal entry
 * POST /api/mental-health/journal
 */
exports.createJournalEntry = async (req, res) => {
  try {
    const { content, quickNote, reflectionResponse, tags, linkedMoodEntryId } = req.body;

    if (!content && !quickNote && !reflectionResponse) {
      return res.status(400).json({
        success: false,
        message: 'Content, quick note, or reflection response is required'
      });
    }

    // Enforce 200 char limit for quickNote
    if (quickNote && quickNote.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Quick note cannot exceed 200 characters'
      });
    }

    // Analyze content with NLP
    const textToAnalyze = content || quickNote || reflectionResponse;
    const analysis = analyzeJournal(textToAnalyze);

    // Use quickNote as content if content is not provided
    const journalContent = content || quickNote || reflectionResponse || 'Daily reflection';

    const journalEntry = await Journal.create({
      user: req.user._id,
      date: new Date(),
      content: journalContent,
      quickNote: quickNote || '',
      reflectionPrompt: reflectionResponse ? {
        question: req.body.reflectionQuestion || getReflectionPrompt(),
        response: reflectionResponse
      } : undefined,
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      keywords: analysis.keywords,
      flags: analysis.flags,
      linkedMoodEntry: linkedMoodEntryId,
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: 'Journal entry created',
      data: journalEntry,
      analysis: {
        sentiment: analysis.sentiment,
        topics: analysis.topics,
        flags: analysis.flags.needsReview ? {
          needsReview: true,
          message: 'We noticed some concerning patterns. Consider reaching out to someone you trust.'
        } : null
      }
    });
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating journal entry',
      error: error.message
    });
  }
};

/**
 * Get journal entries
 * GET /api/mental-health/journal
 */
exports.getJournalEntries = async (req, res) => {
  try {
    const { days = 30, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const journals = await Journal.find({
      user: req.user._id,
      date: { $gte: startDate }
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Journal.countDocuments({
      user: req.user._id,
      date: { $gte: startDate }
    });

    res.json({
      success: true,
      count: journals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: journals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching journal entries',
      error: error.message
    });
  }
};

/**
 * Get journal insights
 * GET /api/mental-health/journal/insights
 */
exports.getJournalInsights = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get sentiment trend
    const sentimentTrend = await Journal.getSentimentTrend(req.user._id, parseInt(days));

    // Get top topics
    const topTopics = await Journal.getTopTopics(req.user._id);

    // Get recent journals for insights
    const recentJournals = await Journal.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(20);

    const insights = generateInsights(recentJournals);

    // Get flagged entries count
    const flaggedCount = await Journal.countDocuments({
      user: req.user._id,
      'flags.needsReview': true
    });

    res.json({
      success: true,
      data: {
        sentimentTrend,
        topTopics,
        insights,
        flaggedEntriesCount: flaggedCount,
        totalEntries: recentJournals.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching journal insights',
      error: error.message
    });
  }
};

/**
 * Get daily reflection prompt
 * GET /api/mental-health/journal/prompt
 */
exports.getReflectionPrompt = async (req, res) => {
  try {
    const prompt = getReflectionPrompt();
    res.json({
      success: true,
      data: { prompt }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting reflection prompt',
      error: error.message
    });
  }
};

// ==================== PREDICTIONS ====================

/**
 * Generate stress prediction
 * POST /api/mental-health/predictions/generate
 */
exports.generateStressPrediction = async (req, res) => {
  try {
    const { horizon = 24 } = req.body;

    if (![24, 48, 72].includes(parseInt(horizon))) {
      return res.status(400).json({
        success: false,
        message: 'Horizon must be 24, 48, or 72 hours'
      });
    }

    const result = await generatePrediction(req.user._id, parseInt(horizon));

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Prediction generated successfully',
      data: result.prediction
    });
  } catch (error) {
    console.error('Generate prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating prediction',
      error: error.message
    });
  }
};

/**
 * Get predictions for user
 * GET /api/mental-health/predictions
 */
exports.getPredictions = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const predictions = await Prediction.getPredictionsForUser(req.user._id, parseInt(days));

    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching predictions',
      error: error.message
    });
  }
};

/**
 * Get high risk predictions (alerts)
 * GET /api/mental-health/predictions/alerts
 */
exports.getPredictionAlerts = async (req, res) => {
  try {
    const alerts = await Prediction.getHighRiskPredictions(req.user._id);

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
      hasHighRiskAlerts: alerts.length > 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prediction alerts',
      error: error.message
    });
  }
};

/**
 * Get prediction accuracy
 * GET /api/mental-health/predictions/accuracy
 */
exports.getPredictionAccuracy = async (req, res) => {
  try {
    const accuracy = await getPredictionAccuracy(req.user._id);

    res.json({
      success: true,
      data: {
        ...accuracy,
        targetAccuracy: 0.7,
        meetsTarget: (accuracy.avgOverallAccuracy || 0) >= 0.7
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prediction accuracy',
      error: error.message
    });
  }
};

/**
 * Acknowledge prediction alert
 * PUT /api/mental-health/predictions/:id/acknowledge
 */
exports.acknowledgePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { userAcknowledged: true, acknowledgedAt: new Date() },
      { new: true }
    );

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.json({
      success: true,
      message: 'Prediction acknowledged',
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error acknowledging prediction',
      error: error.message
    });
  }
};

// ==================== CALENDAR & HEATMAP ====================

/**
 * Get calendar heatmap data
 * GET /api/mental-health/calendar
 */
exports.getCalendarData = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let startDate, endDate;
    
    if (year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else {
      // Default to last 90 days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
    }

    const logs = await MentalHealthLog.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).select('date mood.score stress.score energy.score');

    // Format for calendar heatmap
    const heatmapData = logs.map(log => ({
      date: log.date.toISOString().split('T')[0],
      mood: log.mood?.score || 5,
      stress: log.stress?.score || 5,
      energy: log.energy?.score || 5,
      // Calculate overall wellness score (inverse stress for proper coloring)
      wellness: Math.round(((log.mood?.score || 5) + (log.energy?.score || 5) + (10 - (log.stress?.score || 5))) / 3)
    }));

    res.json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar data',
      error: error.message
    });
  }
};

// ==================== ANALYTICS ====================

/**
 * Get comprehensive analytics
 * GET /api/mental-health/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get mood averages
    const averages = await MentalHealthLog.calculateAverages(req.user._id, parseInt(days));

    // Get daily trends
    const dailyTrends = await MentalHealthLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          mood: { $avg: '$mood.score' },
          stress: { $avg: '$stress.score' },
          energy: { $avg: '$energy.score' },
          sleep: { $avg: '$sleep.hours' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get day of week analysis
    const dayOfWeekAnalysis = await MentalHealthLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          avgMood: { $avg: '$mood.score' },
          avgStress: { $avg: '$stress.score' },
          avgEnergy: { $avg: '$energy.score' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get correlations (simplified)
    const logs = await MentalHealthLog.find({
      user: req.user._id,
      date: { $gte: startDate }
    });

    const correlations = calculateCorrelations(logs);

    // Journal sentiment trend
    const sentimentTrend = await Journal.getSentimentTrend(req.user._id, parseInt(days));

    // Prediction accuracy
    const predictionAccuracy = await getPredictionAccuracy(req.user._id);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        averages,
        dailyTrends,
        dayOfWeekAnalysis: formatDayOfWeekData(dayOfWeekAnalysis),
        correlations,
        sentimentTrend,
        predictionAccuracy,
        insights: generateAnalyticsInsights(averages, dailyTrends, correlations)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Helper function to calculate correlations
function calculateCorrelations(logs) {
  if (logs.length < 5) return {};

  const sleep = logs.map(l => l.sleep?.hours || 7);
  const stress = logs.map(l => l.stress?.score || 5);
  const mood = logs.map(l => l.mood?.score || 5);
  const energy = logs.map(l => l.energy?.score || 5);

  return {
    sleepStress: pearsonCorrelation(sleep, stress),
    sleepMood: pearsonCorrelation(sleep, mood),
    sleepEnergy: pearsonCorrelation(sleep, energy),
    moodStress: pearsonCorrelation(mood, stress),
    energyStress: pearsonCorrelation(energy, stress)
  };
}

// Pearson correlation helper
function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

// Format day of week data
function formatDayOfWeekData(data) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return data.map(d => ({
    day: days[d._id - 1] || 'Unknown',
    ...d
  }));
}

// Generate analytics insights
function generateAnalyticsInsights(averages, trends, correlations) {
  const insights = [];

  if (averages.avgStress > 7) {
    insights.push({
      type: 'warning',
      title: 'High Stress Levels',
      message: 'Your average stress has been elevated. Consider incorporating relaxation techniques.'
    });
  }

  if (averages.avgSleep < 6) {
    insights.push({
      type: 'warning',
      title: 'Sleep Deficit',
      message: 'You\'re averaging less than 6 hours of sleep. This may be affecting your mood and stress.'
    });
  }

  if (correlations.sleepStress < -0.3) {
    insights.push({
      type: 'insight',
      title: 'Sleep-Stress Connection',
      message: 'Better sleep correlates with lower stress for you. Prioritizing sleep could help.'
    });
  }

  if (trends.length > 7) {
    const recentTrend = trends.slice(-7);
    const avgRecentStress = recentTrend.reduce((s, t) => s + (t.stress || 5), 0) / 7;
    const avgPreviousStress = trends.slice(0, -7).reduce((s, t) => s + (t.stress || 5), 0) / (trends.length - 7);
    
    if (avgRecentStress < avgPreviousStress - 1) {
      insights.push({
        type: 'positive',
        title: 'Improving Trend',
        message: 'Your stress levels have been decreasing recently. Keep up the great work!'
      });
    }
  }

  return insights;
}
