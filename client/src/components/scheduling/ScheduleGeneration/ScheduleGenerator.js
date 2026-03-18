import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { scheduleService, taskService } from '../../../services/services';
import toast from 'react-hot-toast';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

const ScheduleGenerator = ({ currentDate, onScheduleGenerated, onCancel }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preferences, setPreferences] = useState({
    workdayStart: '08:00',
    workdayEnd: '22:00',
    breakDuration: 15,
    breakInterval: 90,
    maxDailyHours: 8,
    minDailyHours: 2
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks();
      const unscheduledTasks = (response.data.data || []).filter(
        t => t.status !== 'completed' && !t.scheduledDate
      );
      setTasks(unscheduledTasks);
      // Select all tasks by default
      setSelectedTasks(new Set(unscheduledTasks.map(t => t._id)));
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleGenerateSchedule = async () => {
    if (selectedTasks.size === 0) {
      toast.error('Please select at least one task');
      return;
    }

    try {
      setGenerating(true);
      const weekStart = new Date(currentDate || new Date());
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const response = await scheduleService.generateSchedule({
        taskIds: Array.from(selectedTasks),
        weekStartDate: weekStart.toISOString(),
        preferences
      });

      if (response.data.success) {
        onScheduleGenerated();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl p-6">
          <LoadingSpinner size="lg" text="Loading tasks..." />
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-primary-600" />
                Generate Schedule
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                AI will optimize your tasks based on priorities and deadlines
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Tasks Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
              Select Tasks to Schedule ({selectedTasks.size})
            </h3>

            {tasks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {tasks.map(task => (
                  <label
                    key={task._id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task._id)}
                      onChange={() => handleTaskToggle(task._id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {task.estimatedDuration || 60} min • {task.priority}
                      </p>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No unscheduled tasks found</p>
            )}
          </div>

          {/* Preferences */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
              Scheduling Preferences
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Work Day Start
                </label>
                <input
                  type="time"
                  value={preferences.workdayStart}
                  onChange={e => handlePreferenceChange('workdayStart', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Work Day End
                </label>
                <input
                  type="time"
                  value={preferences.workdayEnd}
                  onChange={e => handlePreferenceChange('workdayEnd', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Max Daily Hours
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={preferences.maxDailyHours}
                  onChange={e => handlePreferenceChange('maxDailyHours', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Min Daily Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={preferences.minDailyHours}
                  onChange={e => handlePreferenceChange('minDailyHours', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Break Duration (min)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={preferences.breakDuration}
                  onChange={e => handlePreferenceChange('breakDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Break Interval (min)
                </label>
                <input
                  type="number"
                  min="30"
                  max="240"
                  value={preferences.breakInterval}
                  onChange={e => handlePreferenceChange('breakInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateSchedule}
              disabled={generating || selectedTasks.size === 0}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Schedule
                </>
              )}
            </button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ScheduleGenerator;
