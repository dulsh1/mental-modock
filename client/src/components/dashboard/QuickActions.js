import React from 'react';
import Card from '../common/Card';

const QuickActions = ({ onAction }) => {
  const actions = [
    {
      id: 'log-mood',
      title: 'Log Mood',
      description: 'Record how you feel',
      icon: '😊',
      color: 'from-pink-500 to-rose-500',
      path: '/mental-health',
    },
    {
      id: 'add-task',
      title: 'New Task',
      description: 'Add a task',
      icon: '✏️',
      color: 'from-blue-500 to-cyan-500',
      path: '/tasks',
    },
    {
      id: 'pomodoro',
      title: 'Focus Timer',
      description: 'Start Pomodoro',
      icon: '🍅',
      color: 'from-orange-500 to-red-500',
      path: '/wellness',
    },
    {
      id: 'breathe',
      title: 'Breathe',
      description: 'Quick exercise',
      icon: '🌬️',
      color: 'from-teal-500 to-green-500',
      path: '/wellness',
    },
    {
      id: 'meditate',
      title: 'Meditate',
      description: 'Guided session',
      icon: '🧘',
      color: 'from-purple-500 to-indigo-500',
      path: '/wellness',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View insights',
      icon: '📊',
      color: 'from-amber-500 to-yellow-500',
      path: '/analytics',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction && onAction(action)}
            className="flex flex-col items-center p-3 rounded-xl 
                       bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700
                       transition-all hover:scale-105 group"
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2
              bg-gradient-to-br ${action.color} shadow-lg
              group-hover:shadow-xl transition-shadow
            `}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {action.title}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
