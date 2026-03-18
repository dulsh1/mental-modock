const SemesterGPAGoal = require('../models/SemesterGPAGoal');
const Semester = require('../models/Semester');
const Course = require('../models/Course');
const GPACalculationService = require('../services/gpaCalculationService');

// @desc    Set target GPA for semester
// @route   POST /api/gpa/goals/:semesterId
// @access  Private
exports.setGoal = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { targetGPA, status } = req.body;

    // Validation
    if (!targetGPA) {
      return res.status(400).json({
        success: false,
        message: 'Please provide target GPA'
      });
    }

    if (targetGPA < 0 || targetGPA > 4.0) {
      return res.status(400).json({
        success: false,
        message: 'Target GPA must be between 0 and 4.0'
      });
    }

    // Check if semester exists
    const semester = await Semester.findOne({
      _id: semesterId,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Check if goal already exists
    let goal = await SemesterGPAGoal.findOne({ semester: semesterId });

    if (goal) {
      // Update existing goal
      goal.targetGPA = parseFloat(targetGPA);
      if (status) goal.status = status;
      goal.updatedAt = Date.now();
      await goal.save();
    } else {
      // Create new goal
      goal = await SemesterGPAGoal.create({
        user: req.user.id,
        semester: semesterId,
        targetGPA: parseFloat(targetGPA),
        status: status || 'active'
      });
    }

    res.status(201).json({
      success: true,
      data: goal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get goal for semester
// @route   GET /api/gpa/goals/:semesterId
// @access  Private
exports.getGoal = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findOne({
      _id: semesterId,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const goal = await SemesterGPAGoal.findOne({ semester: semesterId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'No goal set for this semester'
      });
    }

    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update goal for semester
// @route   PUT /api/gpa/goals/:semesterId
// @access  Private
exports.updateGoal = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { targetGPA, status } = req.body;

    const semester = await Semester.findOne({
      _id: semesterId,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const goal = await SemesterGPAGoal.findOne({ semester: semesterId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'No goal set for this semester'
      });
    }

    if (targetGPA !== undefined) {
      if (targetGPA < 0 || targetGPA > 4.0) {
        return res.status(400).json({
          success: false,
          message: 'Target GPA must be between 0 and 4.0'
        });
      }
      goal.targetGPA = parseFloat(targetGPA);
    }

    if (status) goal.status = status;
    goal.updatedAt = Date.now();

    await goal.save();

    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete goal for semester
// @route   DELETE /api/gpa/goals/:semesterId
// @access  Private
exports.deleteGoal = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findOne({
      _id: semesterId,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const goal = await SemesterGPAGoal.findOneAndDelete({ semester: semesterId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'No goal set for this semester'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recommendations for achieving goal
// @route   GET /api/gpa/semesters/:semesterId/goals/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findOne({
      _id: semesterId,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const goal = await SemesterGPAGoal.findOne({ semester: semesterId });

    if (!goal) {
      return res.json({
        success: true,
        data: {
          hasGoal: false,
          message: 'No goal set for this semester'
        }
      });
    }

    const courses = await Course.find({ semester: semesterId });
    const recommendations = GPACalculationService.calculateRequiredGPA(
      courses,
      goal.targetGPA
    );

    res.json({
      success: true,
      data: {
        hasGoal: true,
        targetGPA: goal.targetGPA,
        goalStatus: goal.status,
        ...recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
