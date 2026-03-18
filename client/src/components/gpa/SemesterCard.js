import React, { useState } from 'react';
import { ChevronDownIcon, PencilIcon, TrashIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline';
import CourseTable from './CourseTable';
import CourseForm from './CourseForm';
import TargetGPAForm from './TargetGPAForm';
import ProgressGauge from './ProgressGauge';

const SemesterCard = ({
  semester,
  courses,
  targetGoal,
  onEditSemester,
  onDeleteSemester,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onSetGoal,
  onDeleteGoal,
  isLoading
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [isTargetFormOpen, setIsTargetFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const handleAddCourse = (courseData) => {
    onAddCourse(courseData);
    setIsCourseFormOpen(false);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setIsCourseFormOpen(true);
  };

  const handleSaveCourse = (courseData) => {
    if (editingCourse) {
      onEditCourse({
        ...editingCourse,
        ...courseData
      });
    } else {
      handleAddCourse(courseData);
    }
    setEditingCourse(null);
    setIsCourseFormOpen(false);
  };

  const handleCloseForm = () => {
    setEditingCourse(null);
    setIsCourseFormOpen(false);
  };

  const handleSetGoal = (goalData) => {
    onSetGoal(goalData);
    setIsTargetFormOpen(false);
  };

  const handleDeleteGoal = () => {
    if (window.confirm('Are you sure you want to delete this target GPA?')) {
      onDeleteGoal(semester._id);
    }
  };

  const getGPAColor = (gpa) => {
    if (gpa >= 3.8) return 'text-green-600 dark:text-green-400';
    if (gpa >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (gpa >= 3.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 transition-all">
      {/* Semester Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
      >
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
            {semester.semesterName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} • {totalCredits} credits {!targetGoal && <span className="text-primary-600 dark:text-primary-400 font-medium">• Click to add target</span>}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-2xl font-bold ${getGPAColor(semester.gpa || 0)}`}>
              {(semester.gpa || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">GPA</p>
            {targetGoal && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                Target: {targetGoal.targetGPA.toFixed(2)}
              </p>
            )}
          </div>

          <ChevronDownIcon
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
              isExpanded ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Semester Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {/* Target GPA Section */}
          {targetGoal && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                  Target GPA: {targetGoal.targetGPA.toFixed(2)}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTargetFormOpen(true)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteGoal}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded transition"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <ProgressGauge
                  current={semester.gpa || 0}
                  target={targetGoal.targetGPA}
                  label="Progress to Target"
                  size="md"
                />
              </div>
            </div>
          )}

          {!targetGoal && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-300 dark:border-gray-600 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                No target GPA set for this semester
              </p>
              <button
                onClick={() => setIsTargetFormOpen(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition"
              >
                <StarIcon className="w-4 h-4 inline mr-2" />
                Set Target GPA
              </button>
            </div>
          )}
          {/* Courses Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Courses</h4>
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setIsCourseFormOpen(true);
                }}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition"
              >
                <PlusIcon className="w-4 h-4" />
                Add Course
              </button>
            </div>

            <CourseTable
              courses={courses}
              onEdit={handleEditCourse}
              onDelete={onDeleteCourse}
              isLoading={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => onEditSemester(semester)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this semester and all its courses?')) {
                  onDeleteSemester(semester._id);
                }
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Target GPA Form Modal */}
      <TargetGPAForm
        isOpen={isTargetFormOpen}
        onClose={() => setIsTargetFormOpen(false)}
        onSubmit={handleSetGoal}
        semesterId={semester._id}
        initialData={targetGoal}
      />

      {/* Course Form Modal */}
      <CourseForm
        isOpen={isCourseFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSaveCourse}
        initialData={editingCourse}
        semesterId={semester._id}
      />
    </div>
  );
};

export default SemesterCard;
