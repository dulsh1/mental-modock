const express = require('express');
const { protect } = require('../middleware/auth');

const semesterController = require('../controllers/gpa.semester.controller');
const courseController = require('../controllers/gpa.course.controller');
const calculationController = require('../controllers/gpa.calculation.controller');
const goalController = require('../controllers/gpa.goal.controller');
const exportController = require('../controllers/gpa.export.controller');

const router = express.Router();

// All routes are protected
router.use(protect);

// ==================== SEMESTER ROUTES ====================
router.get('/semesters', semesterController.getSemesters);
router.post('/semesters', semesterController.createSemester);
router.get('/semesters/:id', semesterController.getSemester);
router.put('/semesters/:id', semesterController.updateSemester);
router.delete('/semesters/:id', semesterController.deleteSemester);
router.get('/semester-gpa/:semesterId', semesterController.getSemesterGPA);

// ==================== COURSE ROUTES ====================
router.get('/semesters/:semesterId/courses', courseController.getCoursesForSemester);
router.post('/semesters/:semesterId/courses', courseController.createCourse);
router.get('/courses/:id', courseController.getCourse);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

// ==================== CALCULATION ROUTES ====================
router.get('/cgpa', calculationController.getCGPA);
router.post('/whatif', calculationController.getWhatIf);
router.get('/analytics', calculationController.getAnalytics);
router.get('/semesters/:semesterId/analytics', calculationController.getSemesterAnalytics);

// ==================== GOAL ROUTES ====================
router.post('/goals/:semesterId', goalController.setGoal);
router.get('/goals/:semesterId', goalController.getGoal);
router.put('/goals/:semesterId', goalController.updateGoal);
router.delete('/goals/:semesterId', goalController.deleteGoal);
router.get('/semesters/:semesterId/goals/recommendations', goalController.getRecommendations);

// ==================== EXPORT ROUTES ====================
router.post('/export/pdf', exportController.exportPDF);
router.post('/export/excel', exportController.exportExcel);

module.exports = router;
