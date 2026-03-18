const Semester = require('../models/Semester');
const Course = require('../models/Course');
const SemesterGPAGoal = require('../models/SemesterGPAGoal');
const GPACalculationService = require('../services/gpaCalculationService');

// @desc    Get all semesters for user
// @route   GET /api/gpa/semesters
// @access  Private
exports.getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({ user: req.user.id })
      .sort({ semesterNumber: 1 });

    // Populate courses and calculate GPA for each semester
    const semestersWithData = await Promise.all(
      semesters.map(async (semester) => {
        const courses = await Course.find({ semester: semester._id });
        const semesterGPA = GPACalculationService.calculateSemesterGPA(courses);
        const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

        return {
          _id: semester._id,
          semesterName: semester.semesterName,
          semesterNumber: semester.semesterNumber,
          startDate: semester.startDate,
          endDate: semester.endDate,
          status: semester.status,
          gpa: semesterGPA,
          courseCount: courses.length,
          totalCredits,
          createdAt: semester.createdAt,
          updatedAt: semester.updatedAt
        };
      })
    );

    res.json({
      success: true,
      count: semestersWithData.length,
      data: semestersWithData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single semester with courses
// @route   GET /api/gpa/semesters/:id
// @access  Private
exports.getSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const courses = await Course.find({ semester: semester._id });
    const semesterGPA = GPACalculationService.calculateSemesterGPA(courses);
    const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

    res.json({
      success: true,
      data: {
        _id: semester._id,
        semesterName: semester.semesterName,
        semesterNumber: semester.semesterNumber,
        startDate: semester.startDate,
        endDate: semester.endDate,
        status: semester.status,
        gpa: semesterGPA,
        totalCredits,
        courses,
        createdAt: semester.createdAt,
        updatedAt: semester.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create semester
// @route   POST /api/gpa/semesters
// @access  Private
exports.createSemester = async (req, res) => {
  try {
    const { semesterName, semesterNumber, startDate, endDate, status } = req.body;

    // Validation
    if (!semesterName || !semesterNumber || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const semester = await Semester.create({
      user: req.user.id,
      semesterName,
      semesterNumber,
      startDate,
      endDate,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      data: semester
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update semester
// @route   PUT /api/gpa/semesters/:id
// @access  Private
exports.updateSemester = async (req, res) => {
  try {
    const { semesterName, semesterNumber, startDate, endDate, status } = req.body;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const semester = await Semester.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { semesterName, semesterNumber, startDate, endDate, status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    res.json({
      success: true,
      data: semester
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete semester (cascade delete courses and goals)
// @route   DELETE /api/gpa/semesters/:id
// @access  Private
exports.deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Delete all courses in semester
    await Course.deleteMany({ semester: semester._id });

    // Delete goal if exists
    await SemesterGPAGoal.deleteOne({ semester: semester._id });

    // Delete semester
    await Semester.deleteOne({ _id: semester._id });

    res.json({
      success: true,
      message: 'Semester deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get semester GPA
// @route   GET /api/gpa/semester-gpa/:semesterId
// @access  Private
exports.getSemesterGPA = async (req, res) => {
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

    const courses = await Course.find({ semester: semester._id });
    const gpa = GPACalculationService.calculateSemesterGPA(courses);
    const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

    res.json({
      success: true,
      data: {
        semesterId: semester._id,
        semesterName: semester.semesterName,
        gpa,
        courseCount: courses.length,
        totalCredits
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
