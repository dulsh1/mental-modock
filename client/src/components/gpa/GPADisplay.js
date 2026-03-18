import React from 'react';

const GPADisplay = ({ cgpa, semesterGPA, semesterName, totalCredits, courseCount }) => {
  // Determine color based on GPA
  const getGPAColor = (gpa) => {
    if (gpa >= 3.8) return 'text-green-600 dark:text-green-400';
    if (gpa >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (gpa >= 3.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBGColor = (gpa) => {
    if (gpa >= 3.8) return 'bg-green-50 dark:bg-green-900/20';
    if (gpa >= 3.5) return 'bg-blue-50 dark:bg-blue-900/20';
    if (gpa >= 3.0) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* CGPA Card */}
      <div className={`${getBGColor(cgpa || 0)} rounded-lg border border-gray-200 dark:border-gray-700 p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cumulative GPA</p>
            <p className={`text-4xl font-bold ${getGPAColor(cgpa || 0)}`}>
              {(cgpa || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Out of 4.0</p>
          </div>
        </div>
      </div>

      {/* Semester GPA Card */}
      {semesterGPA !== undefined && (
        <div className={`${getBGColor(semesterGPA || 0)} rounded-lg border border-gray-200 dark:border-gray-700 p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {semesterName} GPA
              </p>
              <p className={`text-4xl font-bold ${getGPAColor(semesterGPA || 0)}`}>
                {(semesterGPA || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {courseCount || 0} courses • {totalCredits || 0} credits
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPADisplay;
