import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gpaService } from '../services/services';
import toast from 'react-hot-toast';
import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import GPADisplay from '../components/gpa/GPADisplay';
import SemesterForm from '../components/gpa/SemesterForm';
import SemesterCard from '../components/gpa/SemesterCard';
import WhatIfCalculator from '../components/gpa/WhatIfCalculator';
import ExportButtons from '../components/gpa/ExportButtons';
import LoadingSpinner from '../components/common/LoadingSpinner';

const GPACalculator = () => {
  const { token } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [coursesBySemester, setCoursesBySemester] = useState({});
  const [goalsBySemester, setGoalsBySemester] = useState({});
  const [cgpa, setCGPA] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSemesterFormOpen, setIsSemesterFormOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);

  // Fetch all data
  const fetchData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Fetch semesters
      const semestersRes = await gpaService.getSemesters(token);
      setSemesters(semestersRes.data.data || []);

      // Fetch courses for each semester
      const courseData = {};
      const goalData = {};
      const semesterIds = semestersRes.data.data || [];

      for (const semester of semesterIds) {
        const coursesRes = await gpaService.getCourses(semester._id, token);
        courseData[semester._id] = coursesRes.data.data || [];

        // Fetch goal for this semester
        try {
          const goalRes = await gpaService.getGoal(semester._id, token);
          goalData[semester._id] = goalRes.data.data;
        } catch (error) {
          // Goal doesn't exist, that's okay
          goalData[semester._id] = null;
        }
      }
      setCoursesBySemester(courseData);
      setGoalsBySemester(goalData);

      // Fetch CGPA
      const cgpaRes = await gpaService.getCGPA(token);
      setCGPA(cgpaRes.data.data.cgpa || 0);

      toast.success('Data loaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Add semester
  const handleAddSemester = async (semesterData) => {
    try {
      await gpaService.createSemester(semesterData, token);
      toast.success('Semester added successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to add semester');
    }
  };

  // Edit semester
  const handleEditSemester = async (semesterData) => {
    try {
      await gpaService.updateSemester(semesterData._id, semesterData, token);
      toast.success('Semester updated successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update semester');
    }
  };

  // Delete semester
  const handleDeleteSemester = async (semesterId) => {
    try {
      await gpaService.deleteSemester(semesterId, token);
      toast.success('Semester deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete semester');
    }
  };

  // Add course
  const handleAddCourse = async (courseData) => {
    try {
      const { semesterId, ...data } = courseData;
      await gpaService.createCourse(semesterId, data, token);
      toast.success('Course added successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to add course');
    }
  };

  // Edit course
  const handleEditCourse = async (courseData) => {
    try {
      const { semesterId, _id, ...data } = courseData;
      await gpaService.updateCourse(_id, data, token);
      toast.success('Course updated successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update course');
    }
  };

  // Delete course
  const handleDeleteCourse = async (courseId) => {
    try {
      await gpaService.deleteCourse(courseId, token);
      toast.success('Course deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete course');
    }
  };

  // Set goal
  const handleSetGoal = async (goalData) => {
    try {
      await gpaService.setGoal(goalData.semesterId, { targetGPA: goalData.targetGPA }, token);
      toast.success('Target GPA set successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to set target GPA');
    }
  };

  // Delete goal
  const handleDeleteGoal = async (semesterId) => {
    try {
      await gpaService.deleteGoal(semesterId, token);
      toast.success('Target GPA removed successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete target GPA');
    }
  };

  const handleSemesterSubmit = (semesterData) => {
    if (editingSemester) {
      handleEditSemester({ ...editingSemester, ...semesterData });
    } else {
      handleAddSemester(semesterData);
    }
    setEditingSemester(null);
  };

  const handleEditSemesterClick = (semester) => {
    setEditingSemester(semester);
    setIsSemesterFormOpen(true);
  };

  const handleCloseSemesterForm = () => {
    setEditingSemester(null);
    setIsSemesterFormOpen(false);
  };

  if (isLoading && semesters.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GPA Calculator</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track and manage your academic performance
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setEditingSemester(null);
                  setIsSemesterFormOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
              >
                <PlusIcon className="w-5 h-5" />
                Add Semester
              </button>

              <ExportButtons />

              <a
                href="/gpa/analytics"
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition"
              >
                <ChartBarIcon className="w-5 h-5" />
                Analytics
              </a>
            </div>
          </div>
        </div>

        {/* GPA Display */}
        <GPADisplay cgpa={cgpa} />

        {/* What-If Calculator */}
        {semesters.length > 0 && (
          <div className="mt-8">
            <WhatIfCalculator
              semesterId={semesters[semesters.length - 1]?._id}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Semesters Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Semesters</h2>

          {semesters.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No semesters added yet. Create your first semester to get started!
              </p>
              <button
                onClick={() => setIsSemesterFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
              >
                <PlusIcon className="w-5 h-5" />
                Add First Semester
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {semesters.map((semester) => (
                <SemesterCard
                  key={semester._id}
                  semester={semester}
                  courses={coursesBySemester[semester._id] || []}
                  targetGoal={goalsBySemester[semester._id]}
                  onEditSemester={handleEditSemesterClick}
                  onDeleteSemester={handleDeleteSemester}
                  onAddCourse={handleAddCourse}
                  onEditCourse={handleEditCourse}
                  onDeleteCourse={handleDeleteCourse}
                  onSetGoal={handleSetGoal}
                  onDeleteGoal={handleDeleteGoal}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* Semester Form Modal */}
        <SemesterForm
          isOpen={isSemesterFormOpen}
          onClose={handleCloseSemesterForm}
          onSubmit={handleSemesterSubmit}
          initialData={editingSemester}
        />
      </div>
    </div>
  );
};

export default GPACalculator;
