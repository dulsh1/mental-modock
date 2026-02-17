import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { mentalHealthService } from '../services/services';

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

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
    fetchPrediction();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await mentalHealthService.getAnalytics(timeRange);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async () => {
    try {
      const response = await mentalHealthService.getPrediction();
      setPrediction(response.data.data);
    } catch (error) {
      console.error('Failed to fetch prediction:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading analytics..." />
      </div>
    );
  }

  // Line chart data
  const lineChartData = {
    labels: analytics?.dailyData?.map(d => 
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Mood',
        data: analytics?.dailyData?.map(d => d.mood?.score) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Stress',
        data: analytics?.dailyData?.map(d => d.stress?.score) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Energy',
        data: analytics?.dailyData?.map(d => d.energy?.score) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Day of week patterns
  const dayOfWeekData = analytics?.patterns?.dayOfWeekPatterns?.byDay ? {
    labels: analytics.patterns.dayOfWeekPatterns.byDay.map(d => d.day),
    datasets: [
      {
        label: 'Average Mood',
        data: analytics.patterns.dayOfWeekPatterns.byDay.map(d => d.avgMood),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
      {
        label: 'Average Stress',
        data: analytics.patterns.dayOfWeekPatterns.byDay.map(d => d.avgStress),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      }
    ]
  } : null;

  // Stress triggers doughnut
  const triggerData = analytics?.patterns?.triggers?.length > 0 ? {
    labels: analytics.patterns.triggers.map(t => t.trigger),
    datasets: [{
      data: analytics.patterns.triggers.map(t => t.count),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(107, 114, 128, 0.8)'
      ]
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        min: 0,
        max: 10
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Analytics & Insights 📊
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Understand your patterns and trends
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="input"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
          </select>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Mood</p>
            <p className="text-3xl font-bold text-green-500">
              {Math.round((analytics?.averages?.avgMood || 0) * 10) / 10}
            </p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Stress</p>
            <p className="text-3xl font-bold text-red-500">
              {Math.round((analytics?.averages?.avgStress || 0) * 10) / 10}
            </p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Energy</p>
            <p className="text-3xl font-bold text-blue-500">
              {Math.round((analytics?.averages?.avgEnergy || 0) * 10) / 10}
            </p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Sleep</p>
            <p className="text-3xl font-bold text-purple-500">
              {Math.round((analytics?.averages?.avgSleep || 0) * 10) / 10}h
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Stress Prediction */}
      {prediction && prediction.prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={`${
            prediction.prediction >= 7 
              ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200' 
              : prediction.prediction >= 5 
              ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200'
              : 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  🔮 Tomorrow's Stress Prediction
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Based on your patterns and upcoming tasks
                </p>
              </div>
              <div className="mt-4 md:mt-0 text-center">
                <div className={`inline-flex items-center px-6 py-3 rounded-full ${
                  prediction.prediction >= 7 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                    : prediction.prediction >= 5 
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  <span className="text-4xl font-bold mr-2">{prediction.prediction}</span>
                  <span className="text-lg">/10</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Confidence: {Math.round(prediction.confidence * 100)}%
                </p>
              </div>
            </div>
            {prediction.recommendation && (
              <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💡 <strong>Recommendation:</strong> {prediction.recommendation}
                </p>
              </div>
            )}
            {prediction.factors && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Task Load</p>
                  <p className="font-semibold">{prediction.factors.taskLoad?.count || 0} tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Recent Trend</p>
                  <p className="font-semibold capitalize">{prediction.factors.recentTrend?.direction || 'stable'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Sleep Avg</p>
                  <p className="font-semibold">{prediction.factors.sleepPattern?.recentAverage || '--'}h</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Due Tomorrow</p>
                  <p className="font-semibold">{prediction.factors.upcomingDeadlines?.count || 0} tasks</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trends Over Time
            </h2>
            <div className="h-80">
              {analytics?.dailyData?.length > 0 ? (
                <Line data={lineChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Not enough data to display trends
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Day of Week Patterns */}
        {dayOfWeekData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Day of Week Patterns
              </h2>
              <div className="h-64">
                <Bar 
                  data={dayOfWeekData} 
                  options={{
                    ...chartOptions,
                    scales: { y: { min: 0, max: 10 } }
                  }} 
                />
              </div>
              {analytics?.patterns?.dayOfWeekPatterns && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-700 dark:text-green-300">
                      😊 Best mood: {analytics.patterns.dayOfWeekPatterns.bestMoodDay}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-red-700 dark:text-red-300">
                      😰 Most stress: {analytics.patterns.dayOfWeekPatterns.highestStressDay}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Stress Triggers */}
        {triggerData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Stress Triggers
              </h2>
              <div className="h-64">
                <Doughnut 
                  data={triggerData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right'
                      }
                    }
                  }}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Insights */}
      {analytics?.patterns?.insights?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💡 Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.patterns.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    insight.type === 'positive' 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : insight.type === 'warning'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <p className={`text-sm ${
                    insight.type === 'positive'
                      ? 'text-green-700 dark:text-green-300'
                      : insight.type === 'warning'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Correlations */}
      {analytics?.patterns?.correlations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Correlations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.patterns.correlations).map(([key, value]) => (
                value !== null && (
                  <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className={`text-xl font-bold ${
                      value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {value > 0 ? '+' : ''}{value}
                    </p>
                  </div>
                )
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Values range from -1 (negative correlation) to +1 (positive correlation)
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
