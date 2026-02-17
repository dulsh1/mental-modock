import React from 'react';
import Card from '../common/Card';

const StatsOverview = ({ stats }) => {
  const {
    todayMood = null,
    weeklyAvgMood = 0,
    completedTasks = 0,
    totalTasks = 0,
    focusMinutes = 0,
    streakDays = 0,
    wellnessScore = 0,
  } = stats || {};

  const statCards = [
    {
      title: "Today's Mood",
      value: todayMood ? getMoodEmoji(todayMood) : '--',
      subtext: todayMood ? getMoodLabel(todayMood) : 'Not logged',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      icon: '😊',
    },
    {
      title: 'Weekly Avg Mood',
      value: weeklyAvgMood.toFixed(1),
      subtext: `${getTrendIcon(weeklyAvgMood)} ${getTrendText(weeklyAvgMood)}`,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      icon: '📊',
    },
    {
      title: 'Tasks Completed',
      value: `${completedTasks}/${totalTasks}`,
      subtext: `${getCompletionRate(completedTasks, totalTasks)}% completion`,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: '✅',
    },
    {
      title: 'Focus Time',
      value: `${focusMinutes}`,
      subtext: 'minutes today',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      icon: '⏱️',
    },
    {
      title: 'Streak',
      value: `${streakDays}`,
      subtext: 'days in a row',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: '🔥',
    },
    {
      title: 'Wellness Score',
      value: `${wellnessScore}`,
      subtext: getWellnessLevel(wellnessScore),
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      icon: '💚',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={`p-4 ${stat.bgColor}`}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent 
                          from-gray-800 to-gray-600 dark:from-white dark:to-gray-300">
              {stat.value}
            </p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {stat.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stat.subtext}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Helper functions
const getMoodEmoji = (mood) => {
  const emojis = { 1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '😊' };
  return emojis[mood] || '--';
};

const getMoodLabel = (mood) => {
  const labels = { 1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great' };
  return labels[mood] || '';
};

const getTrendIcon = (value) => {
  if (value >= 4) return '📈';
  if (value >= 3) return '➡️';
  return '📉';
};

const getTrendText = (value) => {
  if (value >= 4) return 'Positive';
  if (value >= 3) return 'Stable';
  return 'Needs attention';
};

const getCompletionRate = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const getWellnessLevel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs focus';
};

export default StatsOverview;
