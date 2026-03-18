import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WhatIfCalculator = ({ semesterId, onCalculate, isLoading }) => {
  const [targetGPA, setTargetGPA] = useState('3.5');
  const [courses, setCourses] = useState([
    { credits: 3, letterGrade: 'A', status: 'completed' }
  ]);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

  const gradeToPoint = (grade) => {
    const gradeMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };
    return gradeMap[grade] || 0;
  };

  const handleAddCourse = () => {
    setCourses([...courses, { credits: 3, letterGrade: 'A', status: 'planned' }]);
    setShowResult(false);
  };

  const handleRemoveCourse = (index) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index));
      setShowResult(false);
    }
  };

  const handleCourseChange = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
    setShowResult(false);
  };

  const handleCalculate = async () => {
    if (!targetGPA || parseFloat(targetGPA) < 0 || parseFloat(targetGPA) > 4.0) {
      toast.error('Please enter a valid target GPA (0-4.0)');
      return;
    }

    try {
      // Calculate current GPA from completed courses
      let totalPoints = 0;
      let totalCredits = 0;
      let remainingCredits = 0;

      courses.forEach(course => {
        const credits = parseFloat(course.credits) || 0;
        if (course.status === 'completed') {
          const gradePoint = gradeToPoint(course.letterGrade);
          totalPoints += gradePoint * credits;
          totalCredits += credits;
        } else {
          remainingCredits += credits;
        }
      });

      const currentGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

      // Calculate required GPA
      if (remainingCredits === 0) {
        setResult({
          currentGPA: currentGPA.toFixed(2),
          targetGPA: parseFloat(targetGPA).toFixed(2),
          remainingCredits: 0,
          requiredGPA: currentGPA.toFixed(2),
          isAchievable: currentGPA >= parseFloat(targetGPA),
          message: 'All courses have been graded. Your final GPA is calculated above.',
          allCoursesGraded: true
        });
      } else {
        const totalNeeded = parseFloat(targetGPA) * (totalCredits + remainingCredits);
        const requiredPoints = totalNeeded - totalPoints;
        const requiredGPA = requiredPoints / remainingCredits;
        const roundedRequired = Math.max(0, Math.round(requiredGPA * 100) / 100);

        setResult({
          currentGPA: currentGPA.toFixed(2),
          targetGPA: parseFloat(targetGPA).toFixed(2),
          remainingCredits,
          totalCredits,
          requiredGPA: roundedRequired.toFixed(2),
          isAchievable: roundedRequired <= 4.0,
          message: roundedRequired > 4.0
            ? `❌ Target GPA cannot be achieved. You need ${roundedRequired.toFixed(2)} GPA (max 4.0) in remaining courses.`
            : `✅ You need ${roundedRequired.toFixed(2)} GPA in remaining ${remainingCredits} credits to achieve ${parseFloat(targetGPA).toFixed(2)} semester GPA`,
          allCoursesGraded: false
        });
      }
      setShowResult(true);
    } catch (error) {
      toast.error('Failed to calculate');
      console.error('Calculation error:', error);
    }
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (['B+', 'B', 'B-'].includes(grade)) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (['C+', 'C', 'C-'].includes(grade)) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (['D+', 'D', 'D-'].includes(grade)) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <SparklesIcon className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          What-If Calculator
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Simulate different grade scenarios to calculate what GPA you need in remaining courses to achieve your target.
      </p>

      {/* Target GPA Input */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Semester GPA
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={targetGPA}
            onChange={(e) => {
              setTargetGPA(e.target.value);
              setShowResult(false);
            }}
            step="0.1"
            min="0"
            max="4.0"
            placeholder="3.5"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">/ 4.0</span>
        </div>

        {/* Quick Presets */}
        <div className="flex gap-2 mt-3">
          {['3.0', '3.5', '3.8', '4.0'].map((gpa) => (
            <button
              key={gpa}
              onClick={() => {
                setTargetGPA(gpa);
                setShowResult(false);
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                targetGPA === gpa
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {gpa}
            </button>
          ))}
        </div>
      </div>

      {/* Courses List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Courses</h4>
          <button
            onClick={handleAddCourse}
            className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition"
          >
            + Add Course
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {courses.map((course, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              {/* Credits */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  value={course.credits}
                  onChange={(e) => handleCourseChange(index, 'credits', e.target.value)}
                  step="0.5"
                  min="0.5"
                  max="5"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Grade */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Grade
                </label>
                <select
                  value={course.letterGrade}
                  onChange={(e) => handleCourseChange(index, 'letterGrade', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={course.status}
                  onChange={(e) => handleCourseChange(index, 'status', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="completed">Completed</option>
                  <option value="planned">Planned</option>
                </select>
              </div>

              {/* Delete Button */}
              {courses.length > 1 && (
                <button
                  onClick={() => handleRemoveCourse(index)}
                  className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition h-fit mt-6"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
      >
        <SparklesIcon className="w-5 h-5" />
        {isLoading ? 'Calculating...' : 'Calculate Required GPA'}
      </button>

      {/* Result */}
      {showResult && result && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${
          result.isAchievable
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          <h4 className={`font-semibold mb-3 ${
            result.isAchievable
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {result.message}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {!result.allCoursesGraded && (
              <>
                <div className="p-3 bg-white dark:bg-gray-800 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Current GPA</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.currentGPA}
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Remaining Credits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.remainingCredits}
                  </p>
                </div>
              </>
            )}

            <div className={`p-3 rounded ${
              result.isAchievable
                ? 'bg-white dark:bg-gray-800'
                : 'bg-white dark:bg-gray-800'
            }`}>
              <p className="text-xs text-gray-600 dark:text-gray-400">Target GPA</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.targetGPA}
              </p>
            </div>

            <div className={`p-3 rounded ${
              result.isAchievable
                ? 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700'
                : 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700'
            }`}>
              <p className={`text-xs ${
                result.isAchievable
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                Required GPA
              </p>
              <p className={`text-2xl font-bold ${
                result.isAchievable
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {result.requiredGPA}
              </p>
            </div>
          </div>

          {result.isAchievable && !result.allCoursesGraded && (
            <div className="mt-4 p-3 bg-green-100/50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                💡 <strong>Tip:</strong> If you achieve {result.requiredGPA} GPA in your remaining {result.remainingCredits} credits, you'll reach your target of {result.targetGPA}!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatIfCalculator;
