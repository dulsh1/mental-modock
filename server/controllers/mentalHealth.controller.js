const MentalHealthLog = require('../models/MentalHealthLog');
const User = require('../models/User');
const { predictStress } = require('../services/ml/predictionService');
const { analyzePatterns } = require('../services/ml/patternAnalyzer');

// @desc    Create daily mental health log
// @route   POST /api/mental-health/log
// @access  Private
exports.createLog = async (req, res) => {
  try {
    const { mood, energy, stress, sleep, journal, activities, tags } = req.body;

    // Check if log exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let existingLog = await MentalHealthLog.findOne({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingLog) {
      // Update existing log
      existingLog = await MentalHealthLog.findByIdAndUpdate(
        existingLog._id,
        { mood, energy, stress, sleep, journal, activities, tags },
        { new: true, runValidators: true }
      );

      return res.json({
        success: true,
        message: 'Log updated successfully',
        data: existingLog
      });
    }

    // Create new log
    const log = await MentalHealthLog.create({
      user: req.user.id,
      date: new Date(),
      mood,
      energy,
      stress,
      sleep,
      journal,
      activities,
      tags
    });

    // Update user stats
    const user = await User.findById(req.user.id);
    user.stats.totalLogs += 1;
    user.updateStreak();
    await user.save();

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's mental health logs
// @route   GET /api/mental-health/logs
// @access  Private
exports.getLogs = async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    let query = { user: req.user.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await MentalHealthLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single log
// @route   GET /api/mental-health/log/:id
// @access  Private
exports.getLog = async (req, res) => {
  try {
    const log = await MentalHealthLog.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get today's log
// @route   GET /api/mental-health/today
// @access  Private
exports.getTodayLog = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const log = await MentalHealthLog.findOne({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get analytics and statistics
// @route   GET /api/mental-health/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get averages
    const averages = await MentalHealthLog.calculateAverages(req.user.id, parseInt(days));

    // Get daily data for charts
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const dailyData = await MentalHealthLog.find({
      user: req.user.id,
      date: { $gte: startDate }
    }).sort({ date: 1 }).select('date mood.score energy.score stress.score sleep.hours');

    // Analyze patterns
    const patterns = await analyzePatterns(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: {
        averages,
        dailyData,
        patterns
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get stress prediction
// @route   GET /api/mental-health/predict
// @access  Private
exports.getStressPrediction = async (req, res) => {
  try {
    const prediction = await predictStress(req.user.id);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete log
// @route   DELETE /api/mental-health/log/:id
// @access  Private
exports.deleteLog = async (req, res) => {
  try {
    const log = await MentalHealthLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      message: 'Log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
