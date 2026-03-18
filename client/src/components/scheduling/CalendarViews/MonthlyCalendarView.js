import React, { useEffect, useState } from 'react';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { taskService } from '../../../services/services';
import toast from 'react-hot-toast';

const MonthlyCalendarView = ({ currentDate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', priority: 'medium', dueDate: '' });

  useEffect(() => {
    fetchMonthTasks();
  }, [currentDate]);

  const fetchMonthTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks();
      const allTasks = response.data.data || [];

      const monthTasks = allTasks.filter(task => {
        const dateValue = task.dueDate || task.createdAt;
        if (!dateValue) return false;
        const taskDate = new Date(dateValue);
        return (
          taskDate.getMonth() === currentDate.getMonth() &&
          taskDate.getFullYear() === currentDate.getFullYear()
        );
      });

      setTasks(monthTasks);
    } catch (error) {
      console.error('Error fetching month tasks:', error);
      setTasks([]);
      toast.error('Failed to load monthly tasks');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate || task.createdAt);
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === currentDate.getMonth() &&
        taskDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getTaskDateISO = (task) => {
    const raw = task.dueDate || task.createdAt;
    if (!raw) return '';
    return new Date(raw).toISOString().split('T')[0];
  };

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay.getDate()) : [];

  const openEditTask = (task) => {
    setEditingTaskId(task._id);
    setEditForm({
      title: task.title || '',
      priority: task.priority || 'medium',
      dueDate: getTaskDateISO(task)
    });
  };

  const handleSaveTask = async (taskId) => {
    try {
      setSavingTaskId(taskId);
      const updatePayload = {
        title: editForm.title,
        priority: editForm.priority,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null
      };

      const response = await taskService.updateTask(taskId, updatePayload);
      const updatedTask = response?.data?.data || { _id: taskId, ...updatePayload };

      setTasks(prev => prev.map(task => (task._id === taskId ? { ...task, ...updatedTask } : task)));
      setEditingTaskId(null);
      toast.success('Task updated');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleMarkComplete = async (taskId) => {
    try {
      setSavingTaskId(taskId);
      await taskService.updateTask(taskId, { status: 'completed' });
      setTasks(prev => prev.map(task => (
        task._id === taskId ? { ...task, status: 'completed', completedAt: new Date().toISOString() } : task
      )));
      toast.success('Task marked complete');
    } catch (error) {
      console.error('Failed to mark task complete:', error);
      toast.error(error.response?.data?.message || 'Failed to mark task complete');
    } finally {
      setSavingTaskId(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading month view..." />;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Priority Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
          <span className="font-semibold">Priority:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Urgent</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />Medium</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Low</span>
        </div>

        {/* Calendar Grid */}
        <div>
          <table className="w-full">
            <thead>
              <tr>
                {daysOfWeek.map(day => (
                  <th key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-3">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIdx) => (
                <tr key={weekIdx}>
                  {days.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, dayIdx) => {
                    const dayTasks = day ? getTasksForDay(day) : [];
                    const isCurrentDay = day && isToday(day);

                    return (
                      <td
                        key={`${weekIdx}-${dayIdx}`}
                        className={`border p-3 h-28 align-top ${
                          day
                            ? isCurrentDay
                              ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                            : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                        onClick={() => {
                          if (!day) return;
                          setSelectedDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                          setEditingTaskId(null);
                        }}
                      >
                        {day && (
                          <div className="space-y-2">
                            <div
                              className={`text-sm font-semibold ${
                                isCurrentDay
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayTasks.slice(0, 2).map(task => (
                                <div
                                  key={task._id}
                                  className={`text-xs px-2 py-1 rounded text-white truncate ${getPriorityColor(
                                    task.priority
                                  )}`}
                                  title={`${task.title} (${task.priority || 'low'})`}
                                >
                                  {task.title}
                                </div>
                              ))}
                              {dayTasks.length > 2 && (
                                <div className="text-xs text-gray-500 px-2">
                                  +{dayTasks.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming Deadlines */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Tasks This Month</h3>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks
                .slice()
                .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt))
                .slice(0, 5)
                .map(task => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}
                      />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{task.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(task.dueDate || task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded capitalize">
                      {task.priority}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines</p>
          )}
        </div>
      </div>

      {/* Selected Day Task Panel */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedDay(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
            </div>

            {selectedDayTasks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No tasks for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map((task) => (
                  <div key={task._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {editingTaskId === task._id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editForm.priority}
                            onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveTask(task._id)}
                            disabled={savingTaskId === task._id || !editForm.title.trim()}
                            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">{task.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                              {task.priority || 'low'} priority
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                            {task.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => openEditTask(task)}
                            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleMarkComplete(task._id)}
                            disabled={task.status === 'completed' || savingTaskId === task._id}
                            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded disabled:opacity-50"
                          >
                            Mark Complete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonthlyCalendarView;
