import React from 'react';
import { Fragment } from 'react';

const GradeSelector = ({ value, onChange, label }) => {
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

  const getGradeColor = (grade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200';
    if (['B+', 'B', 'B-'].includes(grade)) return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200';
    if (['C+', 'C', 'C-'].includes(grade)) return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200';
    if (['D+', 'D', 'D-'].includes(grade)) return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200';
    return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200';
  };

  return (
    <Fragment>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {grades.map((grade) => (
          <button
            key={grade}
            onClick={() => onChange(grade)}
            className={`
              px-3 py-2 rounded-lg border-2 font-semibold transition-all
              ${value === grade
                ? `${getGradeColor(grade)} border-current`
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            {grade}
          </button>
        ))}
      </div>
    </Fragment>
  );
};

export default GradeSelector;
