import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalculatorIcon, StarIcon } from '@heroicons/react/24/outline';
import { gpaService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import ProgressGauge from '../gpa/ProgressGauge';

const GPADashboardCard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [gpaData, setGpaData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGPAData();
  }, [token]);

  const fetchGPAData = async () => {
    if (!token) return;

    try {
      const [cgpaRes, analyticsRes] = await Promise.all([
        gpaService.getCGPA(token),
        gpaService.getAnalytics(token)
      ]);

      const cgpa = cgpaRes.data.data.cgpa || 0;
      const analytics = analyticsRes.data.data;
      const currentSemester = analytics.semesterSummary?.[analytics.semesterSummary.length - 1];

      setGpaData({
        semesterId: currentSemester?._id || null,
        cgpa,
        currentSemesterGPA: currentSemester?.gpa || 0,
        currentSemesterName: currentSemester?.semesterName || 'No semesters',
        targetGPA: currentSemester?.targetGPA,
        goalStatus: currentSemester?.goalStatus
      });

      // Fetch recommendations if target GPA is set
      if (currentSemester?._id && currentSemester?.targetGPA) {
        try {
          const recRes = await gpaService.getRecommendations(currentSemester._id, token);
          setRecommendations(recRes.data.data);
        } catch (error) {
          setRecommendations(null);
        }
      } else {
        setRecommendations(null);
      }
    } catch (error) {
      console.error('Failed to fetch GPA data:', error);
      setGpaData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!gpaData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Academic Performance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track your GPA
            </p>
          </div>
          <button
            onClick={() => navigate('/gpa')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
          >
            Set Up GPA
          </button>
        </div>
      </div>
    );
  }

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
    <div className={`${getBGColor(gpaData.cgpa)} rounded-lg border border-gray-200 dark:border-gray-700 p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Academic Performance
        </h3>
        <CalculatorIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* CGPA */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cumulative GPA</p>
          <p className={`text-2xl font-bold ${getGPAColor(gpaData.cgpa)}`}>
            {gpaData.cgpa.toFixed(2)}
          </p>
        </div>

        {/* Current Semester GPA */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Semester GPA</p>
          <p className={`text-2xl font-bold ${getGPAColor(gpaData.currentSemesterGPA)}`}>
            {gpaData.currentSemesterGPA.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Semester Info */}
      <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">Current Semester</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {gpaData.currentSemesterName}
        </p>
        {gpaData.targetGPA && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Target: {gpaData.targetGPA.toFixed(2)}
          </p>
        )}
      </div>

      {/* Target Progress Section */}
      {gpaData.targetGPA && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Target Progress
            </p>
          </div>
          <div className="flex justify-center mb-3">
            <ProgressGauge
              current={gpaData.currentSemesterGPA}
              target={gpaData.targetGPA}
              label="Semester Progress"
              size="sm"
            />
          </div>
          {gpaData.currentSemesterGPA >= gpaData.targetGPA ? (
            <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">
              ✓ Target achieved!
            </p>
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {(gpaData.targetGPA - gpaData.currentSemesterGPA).toFixed(2)} points needed
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => navigate('/gpa')}
        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
      >
        View Full GPA Calculator
      </button>
    </div>
  );
};

export default GPADashboardCard;
