import React from 'react';
import Card from '../common/Card';

const RecentActivity = ({ activities = [] }) => {
  // Default demo activities
  const defaultActivities = [
    {
      id: 1,
      type: 'mood',
      title: 'Mood logged',
      description: 'Feeling great today! 😊',
      time: '10 minutes ago',
      icon: '😊',
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    },
    {
      id: 2,
      type: 'task',
      title: 'Task completed',
      description: 'Finished "Review quarterly report"',
      time: '1 hour ago',
      icon: '✅',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      id: 3,
      type: 'wellness',
      title: 'Breathing exercise',
      description: 'Completed 5 cycles of Box Breathing',
      time: '2 hours ago',
      icon: '🌬️',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      id: 4,
      type: 'pomodoro',
      title: 'Focus session',
      description: '25 min focus session completed',
      time: '3 hours ago',
      icon: '🍅',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      id: 5,
      type: 'meditation',
      title: 'Meditation',
      description: '10 min stress relief session',
      time: '5 hours ago',
      icon: '🧘',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Recent Activity
        </h3>
        <button className="text-sm text-primary-500 hover:text-primary-600">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {displayActivities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 pb-4 ${
              index !== displayActivities.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <div className={`p-2 rounded-lg ${activity.iconBg}`}>
              <span className="text-xl">{activity.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 dark:text-white text-sm">
                {activity.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {displayActivities.length === 0 && (
        <div className="text-center py-8">
          <span className="text-4xl">📝</span>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            No recent activity yet. Start by logging your mood!
          </p>
        </div>
      )}
    </Card>
  );
};

export default RecentActivity;
