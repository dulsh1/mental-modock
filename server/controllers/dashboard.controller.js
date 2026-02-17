const MentalHealthLog = require('../models/MentalHealthLog');
const Task = require('../models/Task');
const StressPrediction = require('../models/StressPrediction');
const WellnessIntervention = require('../models/WellnessIntervention');

// @desc    Get dashboard overview
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's mental health log
    const todayLog = await MentalHealthLog.findOne({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });

    // Get week's averages
    const weekAverages = await MentalHealthLog.calculateAverages(req.user.id, 7);

    // Get today's tasks
    const todaysTasks = await Task.getTodaysTasks(req.user.id);

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get latest stress prediction
    const latestPrediction = await StressPrediction.findOne({
      user: req.user.id
    }).sort({ predictionDate: -1 });

    // Get pending interventions
    const pendingInterventions = await WellnessIntervention.find({
      user: req.user.id,
      status: 'suggested'
    }).limit(3);

    // Get recent logs for mini chart (last 7 days)
    const recentLogs = await MentalHealthLog.find({
      user: req.user.id
    })
      .sort({ date: -1 })
      .limit(7)
      .select('date mood.score energy.score stress.score');

    res.json({
      success: true,
      data: {
        todayLog,
        weekAverages,
        todaysTasks,
        taskStats: taskStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        stressPrediction: latestPrediction,
        pendingInterventions,
        recentLogs: recentLogs.reverse(),
        hasLoggedToday: !!todayLog
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get weekly summary
// @route   GET /api/dashboard/weekly-summary
// @access  Private
exports.getWeeklySummary = async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    // Get logs for the week
    const weekLogs = await MentalHealthLog.find({
      user: req.user.id,
      date: { $gte: startOfWeek }
    }).sort({ date: 1 });

    // Get completed tasks for the week
    const completedTasks = await Task.countDocuments({
      user: req.user.id,
      status: 'completed',
      completedAt: { $gte: startOfWeek }
    });

    // Get completed interventions
    const completedInterventions = await WellnessIntervention.countDocuments({
      user: req.user.id,
      status: 'completed',
      completedAt: { $gte: startOfWeek }
    });

    // Calculate trends
    const firstHalfLogs = weekLogs.slice(0, Math.ceil(weekLogs.length / 2));
    const secondHalfLogs = weekLogs.slice(Math.ceil(weekLogs.length / 2));

    const calculateAvg = (logs, field) => {
      if (logs.length === 0) return 0;
      return logs.reduce((sum, log) => sum + (log[field]?.score || 0), 0) / logs.length;
    };

    const trends = {
      mood: calculateAvg(secondHalfLogs, 'mood') - calculateAvg(firstHalfLogs, 'mood'),
      stress: calculateAvg(secondHalfLogs, 'stress') - calculateAvg(firstHalfLogs, 'stress'),
      energy: calculateAvg(secondHalfLogs, 'energy') - calculateAvg(firstHalfLogs, 'energy')
    };

    res.json({
      success: true,
      data: {
        logs: weekLogs,
        completedTasks,
        completedInterventions,
        loggingStreak: weekLogs.length,
        trends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
