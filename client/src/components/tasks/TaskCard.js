import React from 'react';
import Card from '../common/Card';

const priorityColors = {
  high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  low: 'border-green-500 bg-green-50 dark:bg-green-900/20',
};

const priorityBadges = {
  high: 'bg-red-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white',
};

const statusColors = {
  pending: 'bg-gray-200 dark:bg-gray-600',
  'in-progress': 'bg-blue-500',
  completed: 'bg-green-500',
};

const TaskCard = ({ 
  task, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  onBreakdown,
  isExpanded,
  onToggleExpand 
}) => {
  const {
    _id,
    title,
    description,
    priority = 'medium',
    status = 'pending',
    dueDate,
    estimatedTime,
    subtasks = [],
    tags = [],
    aiGenerated,
  } = task;

  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'completed';

  return (
    <Card className={`p-4 border-l-4 ${priorityColors[priority]} transition-all duration-200 hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Status checkbox */}
          <button
            onClick={() => onStatusChange(_id, status === 'completed' ? 'pending' : 'completed')}
            className={`
              mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              ${status === 'completed' 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 dark:border-gray-500 hover:border-green-500'
              }
            `}
          >
            {status === 'completed' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            {/* Title */}
            <h4 className={`font-medium ${status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
              {title}
              {aiGenerated && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  AI Generated
                </span>
              )}
            </h4>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 text-xs rounded-full ${priorityBadges[priority]}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>

              {dueDate && (
                <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(dueDate).toLocaleDateString()}
                  {isOverdue && ' (Overdue)'}
                </span>
              )}

              {estimatedTime && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {estimatedTime} min
                </span>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        <div className="flex items-center gap-1">
          {subtasks.length === 0 && (
            <button
              onClick={() => onBreakdown(task)}
              className="p-2 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              title="AI Breakdown"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(_id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtasks progress */}
      {subtasks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Subtasks: {completedSubtasks}/{subtasks.length}
            </span>
            <button
              onClick={() => onToggleExpand(_id)}
              className="text-xs text-primary-500 hover:text-primary-600"
            >
              {isExpanded ? 'Hide' : 'Show'} subtasks
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Expanded subtasks */}
          {isExpanded && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => {/* Handle subtask toggle */}}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default TaskCard;
