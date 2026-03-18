import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const CourseTable = ({ courses, onEdit, onDelete, isLoading }) => {
  const getGradeColor = (grade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (['B+', 'B', 'B-'].includes(grade)) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (['C+', 'C', 'C-'].includes(grade)) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (['D+', 'D', 'D-'].includes(grade)) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getGradePoint = (grade) => {
    const gradeMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };
    return gradeMap[grade] || 0;
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No courses added yet. Click "Add Course" to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Code</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Course Name</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Credits</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Grade</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Points</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr
              key={course._id}
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {course.courseCode}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {course.courseName}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                {course.credits}
              </td>
              <td className="px-4 py-3 text-sm text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getGradeColor(course.letterGrade)}`}>
                  {course.letterGrade}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                {getGradePoint(course.letterGrade).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-center">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(course)}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                    title="Edit course"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this course?')) {
                        onDelete(course._id);
                      }
                    }}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    title="Delete course"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseTable;
