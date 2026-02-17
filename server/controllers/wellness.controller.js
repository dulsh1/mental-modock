const WellnessIntervention = require('../models/WellnessIntervention');
const MentalHealthLog = require('../models/MentalHealthLog');
const Task = require('../models/Task');
const { getRecommendedInterventions } = require('../services/wellness/interventionEngine');
const { wellnessExercises } = require('../services/wellness/exercises');

// @desc    Get personalized wellness interventions
// @route   GET /api/wellness/interventions
// @access  Private
exports.getInterventions = async (req, res) => {
  try {
    // Get current user state
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's log
    const todayLog = await MentalHealthLog.findOne({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });

    // Get pending tasks count
    const pendingTasks = await Task.countDocuments({
      user: req.user.id,
      status: { $in: ['pending', 'in_progress'] }
    });

    // Get recommended interventions based on current state
    const recommendations = await getRecommendedInterventions(
      req.user.id,
      todayLog,
      pendingTasks
    );

    res.json({
      success: true,
      data: {
        currentState: {
          mood: todayLog?.mood?.score || null,
          stress: todayLog?.stress?.score || null,
          energy: todayLog?.energy?.score || null,
          pendingTasks
        },
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all wellness exercises
// @route   GET /api/wellness/exercises
// @access  Private
exports.getExercises = async (req, res) => {
  try {
    const { type, duration } = req.query;

    let exercises = wellnessExercises;

    if (type) {
      exercises = exercises.filter(ex => ex.type === type);
    }

    if (duration) {
      const maxDuration = parseInt(duration);
      exercises = exercises.filter(ex => ex.duration <= maxDuration);
    }

    res.json({
      success: true,
      data: exercises
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get specific exercise
// @route   GET /api/wellness/exercises/:id
// @access  Private
exports.getExercise = async (req, res) => {
  try {
    const exercise = wellnessExercises.find(ex => ex.id === req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      data: exercise
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start wellness intervention
// @route   POST /api/wellness/start
// @access  Private
exports.startIntervention = async (req, res) => {
  try {
    const { type, exerciseId, trigger, moodBefore } = req.body;

    const exercise = wellnessExercises.find(ex => ex.id === exerciseId);

    const intervention = await WellnessIntervention.create({
      user: req.user.id,
      type,
      trigger: {
        condition: trigger || 'manual',
        detectedAt: new Date()
      },
      exercise: exercise ? {
        name: exercise.name,
        description: exercise.description,
        duration: exercise.duration,
        instructions: exercise.instructions,
        mediaUrl: exercise.mediaUrl,
        mediaType: exercise.mediaType
      } : null,
      status: 'in_progress',
      startedAt: new Date(),
      moodBefore
    });

    res.status(201).json({
      success: true,
      data: intervention
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete wellness intervention
// @route   PUT /api/wellness/complete/:id
// @access  Private
exports.completeIntervention = async (req, res) => {
  try {
    const { moodAfter, feedback } = req.body;

    const intervention = await WellnessIntervention.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    intervention.status = 'completed';
    intervention.completedAt = new Date();
    intervention.duration = Math.floor(
      (intervention.completedAt - intervention.startedAt) / 1000
    );
    intervention.moodAfter = moodAfter;
    intervention.feedback = feedback;

    await intervention.save();

    res.json({
      success: true,
      data: intervention
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Skip/dismiss intervention
// @route   PUT /api/wellness/dismiss/:id
// @access  Private
exports.dismissIntervention = async (req, res) => {
  try {
    const { reason } = req.body;

    const intervention = await WellnessIntervention.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id
      },
      {
        status: 'dismissed',
        'feedback.notes': reason
      },
      { new: true }
    );

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    res.json({
      success: true,
      data: intervention
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get intervention history
// @route   GET /api/wellness/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const { limit = 20, type, status } = req.query;

    let query = { user: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;

    const interventions = await WellnessIntervention.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: interventions.length,
      data: interventions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get intervention effectiveness stats
// @route   GET /api/wellness/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const effectiveness = await WellnessIntervention.getEffectiveness(req.user.id);

    // Get total counts
    const totalCompleted = await WellnessIntervention.countDocuments({
      user: req.user.id,
      status: 'completed'
    });

    const totalDismissed = await WellnessIntervention.countDocuments({
      user: req.user.id,
      status: 'dismissed'
    });

    res.json({
      success: true,
      data: {
        effectiveness,
        totals: {
          completed: totalCompleted,
          dismissed: totalDismissed
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
