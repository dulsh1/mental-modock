import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatsOverview from '../components/dashboard/StatsOverview';
import MoodChart from '../components/dashboard/MoodChart';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import StressAlert from '../components/dashboard/StressAlert';
import GPACard from '../components/dashboard/GPACard';
import { dashboardService } from '../services/services';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [stressPrediction, setStressPrediction] = useState(null);
  const [showStressAlert, setShowStressAlert] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardService.getDashboard();
      setDashboard(response.data.data);
      
      // Check for stress prediction
      if (response.data.data?.stressPrediction) {
        setStressPrediction(response.data.data.stressPrediction);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      // Use demo data if API fails
      setDashboard(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoData = () => ({
    stats: {
      todayMood: 4,
      weeklyAvgMood: 3.8,
      completedTasks: 5,
      totalTasks: 8,
      focusMinutes: 120,
      streakDays: 7,
      wellnessScore: 72,
    },
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      mood: [3, 4, 3, 5, 4, 4, 4],
      energy: [4, 3, 4, 4, 5, 3, 4],
      stress: [5, 4, 6, 3, 4, 3, 2],
    },
    recentActivities: [],
    todaysTasks: [
      { _id: 'd1', title: 'Review lecture notes', status: 'pending', dueDate: new Date().toISOString() },
      { _id: 'd2', title: 'Complete assignment draft', status: 'in_progress', dueDate: new Date().toISOString() }
    ],
  });

  const handleQuickAction = (action) => {
    navigate(action.path);
  };

  const handleStressAction = (action) => {
    if (action.type === 'breathing') {
      navigate('/wellness', { state: { openBreathing: true } });
    } else {
      navigate('/wellness');
    }
    setShowStressAlert(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  const stats = dashboard?.stats || getDemoData().stats;
  const chartData = dashboard?.chartData || getDemoData().chartData;
  const activities = dashboard?.recentActivities || [];
  const todaysTasks = dashboard?.todaysTasks || getDemoData().todaysTasks;
  const dailyCompleted = todaysTasks.filter((t) => t.status === 'completed').length;
  const dailyProgress = todaysTasks.length ? Math.round((dailyCompleted / todaysTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Here's your wellness overview for today
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stress Alert (if applicable) */}
      {showStressAlert && stressPrediction && stressPrediction.probability >= 0.6 && (
        <StressAlert
          prediction={stressPrediction}
          onDismiss={() => setShowStressAlert(false)}
          onTakeAction={handleStressAction}
        />
      )}

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Charts, Activity, and GPA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MoodChart data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* GPA Card */}
      <GPACard />

      {/* Daily Tasks Snapshot */}
      <Card className="p-6 bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:from-sky-900/20 dark:via-gray-900 dark:to-cyan-900/20 border border-sky-100 dark:border-sky-800/40">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">Today's Plan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track what matters for today</p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800 hover:bg-white"
          >
            Open Tasks
          </button>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Daily completion</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">{dailyCompleted}/{todaysTasks.length || 0}</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
        </div>

        {todaysTasks.length > 0 ? (
          <div className="space-y-2">
            {todaysTasks.slice(0, 5).map((task) => (
              <div key={task._id} className="flex items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700">
                <div className="pr-3 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)} priority
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                  {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">No tasks scheduled for today.</p>
          </div>
        )}
      </Card>

      {/* Daily Tip */}
      <Card className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <span className="text-3xl">💡</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
              Daily Wellness Tip
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {getDailyTip()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Get a daily tip based on the current day
const getDailyTip = () => {
  const tips = [
    "Start your day with a 5-minute mindfulness session to set a positive tone.",
    "Remember to take regular breaks. The Pomodoro technique can help maintain focus.",
    "Staying hydrated is essential for mental clarity. Aim for 8 glasses of water today.",
    "A short walk can boost your mood and creativity. Try stepping outside for 10 minutes.",
    "Practice gratitude by noting three things you're thankful for today.",
    "Quality sleep is crucial for mental health. Aim for 7-9 hours tonight.",
    "Deep breathing can instantly reduce stress. Try the 4-7-8 technique.",
  ];
  const dayIndex = new Date().getDay();
  return tips[dayIndex];
};

export default Dashboard;
