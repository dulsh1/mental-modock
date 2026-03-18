const Semester = require('../models/Semester');
const Course = require('../models/Course');
const SemesterGPAGoal = require('../models/SemesterGPAGoal');
const GPACalculationService = require('../services/gpaCalculationService');

// @desc    Get cumulative GPA
// @route   GET /api/gpa/cgpa
// @access  Private
exports.getCGPA = async (req, res) => {
  try {
    const semesters = await Semester.find({ user: req.user.id })
      .sort({ semesterNumber: 1 });

    // Get all courses for all semesters
    const semestersWithCourses = await Promise.all(
      semesters.map(async (semester) => {
        const courses = await Course.find({ semester: semester._id });
        return { ...semester.toObject(), courses };
      })
    );

    const cgpa = GPACalculationService.calculateCGPA(semestersWithCourses);
    const totalCourses = semestersWithCourses.reduce(
      (sum, s) => sum + (s.courses ? s.courses.length : 0), 0
    );
    const totalCredits = semestersWithCourses.reduce((sum, s) => {
      if (!s.courses) return sum;
      return sum + s.courses.reduce((credSum, c) => credSum + (parseFloat(c.credits) || 0), 0);
    }, 0);

    res.json({
      success: true,
      data: {
        cgpa: cgpa,
        totalSemesters: semesters.length,
        totalCourses,
        totalCredits: Math.round(totalCredits * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get what-if scenario (required grade for target)
// @route   POST /api/gpa/whatif
// @access  Private
exports.getWhatIf = async (req, res) => {
  try {
    const { semesterId, targetGPA } = req.body;

    if (!semesterId || (targetGPA === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide semesterId and targetGPA'
      });
    }

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

    const courses = await Course.find({ semester: semesterId });

    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No courses in this semester'
      });
    }

    const result = GPACalculationService.calculateRequiredGPA(
      courses,
      parseFloat(targetGPA)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get analytics data
// @route   GET /api/gpa/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const semesters = await Semester.find({ user: req.user.id })
      .sort({ semesterNumber: 1 });

    // Get all courses for all semesters
    const semestersWithCourses = await Promise.all(
      semesters.map(async (semester) => {
        const courses = await Course.find({ semester: semester._id });
        return { ...semester.toObject(), courses };
      })
    );

    const analyticsData = GPACalculationService.getAnalyticsData(semestersWithCourses);

    // Get all courses for additional analytics
    const allCourses = semestersWithCourses.flatMap(s => s.courses || []);

    // Get semester summary with goals
    const semestorySummary = await Promise.all(
      semestersWithCourses.map(async (semester) => {
        const goal = await SemesterGPAGoal.findOne({ semester: semester._id });
        const courses = semester.courses || [];
        const semesterGPA = GPACalculationService.calculateSemesterGPA(courses);
        const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

        return {
          semesterId: semester._id,
          semesterName: semester.semesterName,
          semesterNumber: semester.semesterNumber,
          gpa: semesterGPA,
          totalCredits,
          courseCount: courses.length,
          targetGPA: goal ? goal.targetGPA : null,
          goalStatus: goal ? goal.status : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...analyticsData,
        semesterSummary: semestorySummary,
        courseHistory: allCourses.map(course => ({
          _id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          letterGrade: course.letterGrade,
          gradePoint: GPACalculationService.gradeToPoint(course.letterGrade),
          semester: course.semester,
          createdAt: course.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get semester analytics
// @route   GET /api/gpa/semesters/:semesterId/analytics
// @access  Private
exports.getSemesterAnalytics = async (req, res) => {
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
    const goal = await SemesterGPAGoal.findOne({ semester: semester._id });

    const semesterGPA = GPACalculationService.calculateSemesterGPA(courses);
    const gradeDistribution = GPACalculationService.getGradeDistribution(courses);
    const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

    let requiredForTarget = null;
    if (goal && goal.targetGPA) {
      requiredForTarget = GPACalculationService.calculateRequiredGPA(courses, goal.targetGPA);
    }

    res.json({
      success: true,
      data: {
        semester: {
          _id: semester._id,
          semesterName: semester.semesterName,
          semesterNumber: semester.semesterNumber
        },
        gpa: semesterGPA,
        totalCredits,
        courseCount: courses.length,
        gradeDistribution,
        targetGPA: goal ? goal.targetGPA : null,
        requiredForTarget,
        courses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
