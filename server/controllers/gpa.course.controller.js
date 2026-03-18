const Course = require('../models/Course');
const Semester = require('../models/Semester');
const GPACalculationService = require('../services/gpaCalculationService');

// @desc    Get courses for a semester
// @route   GET /api/gpa/semesters/:semesterId/courses
// @access  Private
exports.getCoursesForSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.semesterId,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const courses = await Course.find({ semester: req.params.semesterId });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create course in semester
// @route   POST /api/gpa/semesters/:semesterId/courses
// @access  Private
exports.createCourse = async (req, res) => {
  try {
    const { courseCode, courseName, credits, letterGrade, status } = req.body;

    // Validation
    if (!courseCode || !courseName || !credits || !letterGrade) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const semester = await Semester.findOne({
      _id: req.params.semesterId,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const course = await Course.create({
      user: req.user.id,
      semester: req.params.semesterId,
      courseCode,
      courseName,
      credits: parseFloat(credits),
      letterGrade,
      status: status || 'completed'
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/gpa/courses/:id
// @access  Private
exports.updateCourse = async (req, res) => {
  try {
    const { courseCode, courseName, credits, letterGrade, status } = req.body;

    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (courseCode) course.courseCode = courseCode;
    if (courseName) course.courseName = courseName;
    if (credits) course.credits = parseFloat(credits);
    if (letterGrade) course.letterGrade = letterGrade;
    if (status) course.status = status;
    course.updatedAt = Date.now();

    await course.save();

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/gpa/courses/:id
// @access  Private
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await Course.deleteOne({ _id: course._id });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/gpa/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
