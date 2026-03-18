// GPA Calculation Service
// Handles all mathematical calculations for GPA, CGPA, and what-if scenarios

const Course = require('../models/Course');
const Semester = require('../models/Semester');

class GPACalculationService {
  /**
   * Convert letter grade to numeric point value
   * @param {string} letterGrade - Letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)
   * @returns {number} Numeric point value (0-4.0)
   */
  static gradeToPoint(letterGrade) {
    const gradeMap = {
      'A+': 4.0,
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'D-': 0.7,
      'F': 0.0
    };
    return gradeMap[letterGrade] || 0;
  }

  /**
   * Calculate semester GPA using weighted calculation
   * GPA = Sum(grade_point × credits) / Sum(credits)
   * @param {Array} courses - Array of course objects with letterGrade and credits
   * @returns {number} Semester GPA (0-4.0)
   */
  static calculateSemesterGPA(courses) {
    if (!courses || courses.length === 0) {
      return 0;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const gradePoint = this.gradeToPoint(course.letterGrade);
      const credits = parseFloat(course.credits) || 0;
      totalPoints += gradePoint * credits;
      totalCredits += credits;
    });

    if (totalCredits === 0) {
      return 0;
    }

    const gpa = totalPoints / totalCredits;
    return Math.round(gpa * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate cumulative GPA across all semesters
   * @param {Array} semesters - Array of semester objects with courses
   * @returns {number} Cumulative GPA (0-4.0)
   */
  static calculateCGPA(semesters) {
    if (!semesters || semesters.length === 0) {
      return 0;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(semester => {
      if (semester.courses && semester.courses.length > 0) {
        semester.courses.forEach(course => {
          const gradePoint = this.gradeToPoint(course.letterGrade);
          const credits = parseFloat(course.credits) || 0;
          totalPoints += gradePoint * credits;
          totalCredits += credits;
        });
      }
    });

    if (totalCredits === 0) {
      return 0;
    }

    const cgpa = totalPoints / totalCredits;
    return Math.round(cgpa * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate the required GPA to achieve target GPA for remaining courses
   * Required GPA formula: (Target GPA × Total Credits - Earned Points) / Remaining Credits
   * @param {Array} courses - Array of all courses in semester
   * @param {number} targetGPA - Target GPA to achieve
   * @returns {object} Required GPA information
   */
  static calculateRequiredGPA(courses, targetGPA) {
    if (!courses || courses.length === 0) {
      return {
        requiredGPA: 0,
        remainingCredits: 0,
        earnedPoints: 0,
        totalCredits: 0,
        isAchievable: true,
        message: 'No courses in semester'
      };
    }

    let totalPoints = 0;
    let totalCredits = 0;
    let remainingCredits = 0;

    courses.forEach(course => {
      const credits = parseFloat(course.credits) || 0;
      totalCredits += credits;

      if (course.status === 'completed') {
        const gradePoint = this.gradeToPoint(course.letterGrade);
        totalPoints += gradePoint * credits;
      } else {
        remainingCredits += credits;
      }
    });

    if (remainingCredits === 0) {
      const currentGPA = this.calculateSemesterGPA(courses);
      return {
        requiredGPA: currentGPA,
        remainingCredits: 0,
        earnedPoints: totalPoints,
        totalCredits: totalCredits,
        isAchievable: currentGPA >= targetGPA,
        message: 'All courses have been graded'
      };
    }

    // Calculate required GPA for remaining courses
    const requiredPoints = (targetGPA * totalCredits) - totalPoints;
    const requiredGPA = requiredPoints / remainingCredits;
    const roundedRequired = Math.round(requiredGPA * 100) / 100;

    return {
      requiredGPA: Math.max(0, roundedRequired),
      remainingCredits,
      earnedPoints: totalPoints,
      totalCredits,
      isAchievable: roundedRequired <= 4.0,
      message: roundedRequired > 4.0
        ? 'Target GPA cannot be achieved (requires GPA > 4.0 in remaining courses)'
        : `You need ${roundedRequired} GPA in remaining ${remainingCredits} credits to achieve ${targetGPA} semester GPA`
    };
  }

  /**
   * Get grade distribution statistics
   * @param {Array} courses - Array of course objects
   * @returns {object} Grade distribution counts
   */
  static getGradeDistribution(courses) {
    const distribution = {
      'A+': 0,
      'A': 0,
      'A-': 0,
      'B+': 0,
      'B': 0,
      'B-': 0,
      'C+': 0,
      'C': 0,
      'C-': 0,
      'D+': 0,
      'D': 0,
      'D-': 0,
      'F': 0
    };

    if (!courses || courses.length === 0) {
      return distribution;
    }

    courses.forEach(course => {
      if (distribution.hasOwnProperty(course.letterGrade)) {
        distribution[course.letterGrade]++;
      }
    });

    return distribution;
  }

  /**
   * Get analytics data for a user
   * @param {Array} semesters - Array of semester objects with courses
   * @returns {object} Analytics data including trends and statistics
   */
  static getAnalyticsData(semesters) {
    if (!semesters || semesters.length === 0) {
      return {
        cgpa: 0,
        semesterGPAs: [],
        totalCredits: 0,
        totalCourses: 0,
        gradeDistribution: {},
        trends: []
      };
    }

    const semesterGPAs = [];
    let totalCourses = 0;
    let totalCredits = 0;
    let allGradeDistribution = {
      'A+': 0, 'A': 0, 'A-': 0,
      'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0,
      'D+': 0, 'D': 0, 'D-': 0, 'F': 0
    };

    // Sort semesters by semester number to get chronological order
    const sortedSemesters = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);

    sortedSemesters.forEach(semester => {
      if (semester.courses && semester.courses.length > 0) {
        const semesterGPA = this.calculateSemesterGPA(semester.courses);
        const totalSemesterCredits = semester.courses.reduce((sum, course) =>
          sum + (parseFloat(course.credits) || 0), 0);

        semesterGPAs.push({
          semesterName: semester.semesterName,
          semesterNumber: semester.semesterNumber,
          gpa: semesterGPA,
          credits: totalSemesterCredits,
          courseCount: semester.courses.length
        });

        totalCourses += semester.courses.length;
        totalCredits += totalSemesterCredits;

        // Accumulate grade distribution
        const distribution = this.getGradeDistribution(semester.courses);
        Object.keys(distribution).forEach(grade => {
          allGradeDistribution[grade] += distribution[grade];
        });
      }
    });

    const cgpa = this.calculateCGPA(sortedSemesters);

    return {
      cgpa,
      semesterGPAs,
      totalCredits,
      totalCourses,
      gradeDistribution: allGradeDistribution,
      trends: semesterGPAs.map((s, index) => ({
        index: index + 1,
        name: s.semesterName,
        gpa: s.gpa
      }))
    };
  }
}

module.exports = GPACalculationService;
