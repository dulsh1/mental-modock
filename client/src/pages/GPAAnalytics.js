import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gpaService } from '../services/services';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProgressGauge from '../components/gpa/ProgressGauge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GPAAnalytics = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await gpaService.getAnalytics(token);
      setAnalytics(response.data.data);
      toast.success('Analytics loaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to load analytics');
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !analytics) {
    return <LoadingSpinner />;
  }

  // GPA Trend Chart Data
  const trendData = {
    labels: analytics.trends.map(t => t.name),
    datasets: [
      {
        label: 'Semester GPA',
        data: analytics.trends.map(t => t.gpa),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  };

  // Grade Distribution Data
  const gradeDistribution = analytics.gradeDistribution;
  const gradeLabels = Object.keys(gradeDistribution).filter(grade => gradeDistribution[grade] > 0);
  const gradeData = gradeLabels.map(grade => gradeDistribution[grade]);

  const gradeColors = {
    'A+': '#10b981', 'A': '#10b981', 'A-': '#34d399',
    'B+': '#3b82f6', 'B': '#60a5fa', 'B-': '#93c5fd',
    'C+': '#f59e0b', 'C': '#fbbf24', 'C-': '#fcd34d',
    'D+': '#f97316', 'D': '#fb923c', 'D-': '#fdba74',
    'F': '#ef4444'
  };

  const distributionData = {
    labels: gradeLabels,
    datasets: [
      {
        label: 'Number of Courses',
        data: gradeData,
        backgroundColor: gradeLabels.map(g => gradeColors[g]),
        borderColor: '#fff',
        borderWidth: 2,
      }
    ]
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 4.0,
        ticks: {
          stepSize: 0.5
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/gpa')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
              title="Go back to GPA Calculator"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GPA Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your academic performance trends and insights
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* CGPA */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cumulative GPA</p>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {(analytics.cgpa || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {analytics.semesterGPAs.length} semesters • {analytics.totalCourses} courses
            </p>
          </div>

          {/* Total Credits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credits</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {analytics.totalCredits}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Credits completed
            </p>
          </div>

          {/* Average GPA */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Semester GPA</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
              {analytics.semesterGPAs.length > 0
                ? (analytics.semesterGPAs.reduce((sum, s) => sum + s.gpa, 0) / analytics.semesterGPAs.length).toFixed(2)
                : '0.00'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Across all semesters
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* GPA Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              GPA Trend Over Semesters
            </h3>
            {analytics.trends.length > 0 ? (
              <div className="relative h-80">
                <Line data={trendData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No semester data available
              </p>
            )}
          </div>

          {/* Grade Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Grade Distribution
            </h3>
            {gradeLabels.length > 0 ? (
              <div className="relative h-80">
                <Doughnut
                  data={distributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          font: { size: 12 }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No grade data available
              </p>
            )}
          </div>
        </div>

        {/* Semester Summary Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Semester Summaries
          </h3>

          {analytics.semesterSummary && analytics.semesterSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Semester
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      GPA
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Courses
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Credits
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Target GPA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.semesterSummary.map((semester) => (
                    <tr key={semester.semesterId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {semester.semesterName}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">{semester.gpa.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {semester.courseCount}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {semester.totalCredits}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {semester.targetGPA ? semester.targetGPA.toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No semester data available
            </p>
          )}
        </div>

        {/* Course History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Complete Course History
          </h3>

          {analytics.courseHistory && analytics.courseHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Course Name
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Credits
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.courseHistory.map((course) => (
                    <tr key={course._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {course.courseCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {course.courseName}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {course.credits}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {course.letterGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {course.gradePoint.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No course data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPAAnalytics;
