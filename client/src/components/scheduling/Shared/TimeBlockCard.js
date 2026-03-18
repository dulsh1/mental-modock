import React from 'react';
import { motion } from 'framer-motion';
import Card from '../../../components/common/Card';
import { CheckCircleIcon, ClockIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

const TimeBlockCard = ({ block, onComplete, onEdit, onDelete, isLoading }) => {
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'rescheduled':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const duration = block.endTime
    ? (
        (parseInt(block.endTime.split(':')[0]) * 60 + parseInt(block.endTime.split(':')[1])) -
        (parseInt(block.startTime.split(':')[0]) * 60 + parseInt(block.startTime.split(':')[1]))
      ) / 60
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <Card
        className={`p-4 transition-all ${getPriorityStyles(
          block.priority
        )} hover:shadow-md`}
        hover
      >
        <div
          className="flex items-start justify-between gap-4 cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                {block.title}
              </h3>
              {block.isBreak && (
                <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                  Break
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {block.startTime} - {block.endTime}
                </span>
              </div>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                {duration.toFixed(1)}h
              </span>
              {!block.isBreak && (
                <span className="text-xs px-2 py-0.5 rounded capitalize font-medium">
                  {block.priority}
                </span>
              )}
            </div>

            {block.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-1">
                {block.description}
              </p>
            )}

            {block.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                {block.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {block.status === 'completed' && (
              <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
            )}

            {!isLoading && (
              <motion.div
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                {block.status !== 'completed' && !block.isBreak && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof onComplete === 'function') onComplete();
                    }}
                    className="p-1.5 hover:bg-green-200 dark:hover:bg-green-900 rounded transition-colors"
                    title="Mark complete"
                  >
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </button>
                )}

                {!block.isBreak && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof onEdit === 'function') onEdit();
                    }}
                    className="p-1.5 hover:bg-purple-200 dark:hover:bg-purple-900 rounded transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5 text-purple-600" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof onDelete === 'function') onDelete();
                  }}
                  className="p-1.5 hover:bg-red-200 dark:hover:bg-red-900 rounded transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {block.status && block.status !== 'scheduled' && (
          <div className={`text-xs font-medium mt-2 ${getStatusColor(block.status)}`}>
            Status: {block.status}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default TimeBlockCard;
