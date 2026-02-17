import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import AITaskBreakdown from '../components/tasks/AITaskBreakdown';
import { taskService } from '../services/services';
import { PlusIcon, SparklesIcon, FunnelIcon } from '@heroicons/react/24/outline';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  const fetchTasks = useCallback(async () => {
    try {
      const response = await taskService.getTasks();
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      // Use demo data
      setTasks(getDemoTasks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getDemoTasks = () => [
    {
      _id: '1',
      title: 'Complete project report',
      description: 'Finish the quarterly analysis report',
      priority: 'high',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      estimatedDuration: 120,
      tags: ['work', 'important'],
    },
    {
      _id: '2',
      title: 'Morning meditation',
      description: '15 minutes mindfulness session',
      priority: 'medium',
      status: 'completed',
      dueDate: new Date().toISOString(),
      estimatedDuration: 15,
      tags: ['wellness', 'daily'],
    },
    {
      _id: '3',
      title: 'Review study materials',
      description: 'Go through chapter 5 and 6',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      estimatedDuration: 90,
      tags: ['study'],
    },
  ];

  const handleCreateTask = async (taskData) => {
    try {
      const response = await taskService.createTask(taskData);
      setTasks([response.data.data, ...tasks]);
      toast.success('Task created successfully!');
      setShowTaskForm(false);
    } catch (error) {
      toast.error('Failed to create task');
      // Add to local state anyway for demo
      const newTask = { ...taskData, _id: Date.now().toString(), status: 'pending' };
      setTasks([newTask, ...tasks]);
      setShowTaskForm(false);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await taskService.updateTask(taskId, updates);
      setTasks(tasks.map(t => t._id === taskId ? { ...t, ...updates } : t));
      toast.success('Task updated!');
      setEditingTask(null);
    } catch (error) {
      toast.error('Failed to update task');
      // Update locally anyway
      setTasks(tasks.map(t => t._id === taskId ? { ...t, ...updates } : t));
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
      setTasks(tasks.filter(t => t._id !== taskId));
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await handleUpdateTask(task._id, { status: newStatus });
  };

  const handleAIBreakdown = (subtasks) => {
    // Add subtasks as new tasks
    const newTasks = subtasks.map((st, index) => ({
      _id: `ai-${Date.now()}-${index}`,
      title: st.title,
      description: st.tips || '',
      priority: 'medium',
      status: 'pending',
      estimatedDuration: st.estimatedMinutes,
      tags: ['ai-generated'],
    }));
    setTasks([...newTasks, ...tasks]);
    toast.success(`Added ${subtasks.length} subtasks!`);
    setShowAIBreakdown(false);
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'all') return true;
      if (filter === 'active') return task.status !== 'completed';
      if (filter === 'completed') return task.status === 'completed';
      return task.priority === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      }
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      return 0;
    });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Smart Task Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Organize and optimize your productivity
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAIBreakdown(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <SparklesIcon className="w-5 h-5" />
            AI Breakdown
          </button>
          <button
            onClick={() => setShowTaskForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Tasks</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          <p className="text-sm text-gray-500">In Progress</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'completed', 'high', 'medium', 'low'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${
                  filter === f
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border rounded-lg px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No tasks found. Create your first task to get started!
              </p>
            </Card>
          ) : (
            filteredTasks.map(task => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <TaskCard
                  task={task}
                  onToggleComplete={() => handleToggleComplete(task)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDeleteTask(task._id)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask 
            ? (data) => handleUpdateTask(editingTask._id, data)
            : handleCreateTask
          }
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* AI Breakdown Modal */}
      {showAIBreakdown && (
        <AITaskBreakdown
          onBreakdown={handleAIBreakdown}
          onClose={() => setShowAIBreakdown(false)}
        />
      )}
    </div>
  );
};

export default Tasks;
