import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../../../components/common/Card';
import TimeBlockCard from '../Shared/TimeBlockCard';
import ScheduleStats from '../Shared/ScheduleStats';
import { ClockIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { scheduleService } from '../../../services/services';

const toMinutes = (timeValue) => {
  const [hours, minutes] = String(timeValue || '00:00').split(':').map(Number);
  return (hours * 60) + minutes;
};

const DailyTaskView = ({ schedule, currentDate, onScheduleUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    priority: 'medium',
    status: 'scheduled',
    notes: ''
  });

  // Get tasks for current day
  const dayTasks = useMemo(() => {
    if (!schedule || !schedule.timeBlocks) return [];

    const targetDate = new Date(currentDate);
    targetDate.setHours(0, 0, 0, 0);

    return schedule.timeBlocks
      .filter(block => {
        const blockDate = new Date(block.date);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === targetDate.getTime();
      })
      .sort((a, b) => {
        const aTime = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
        const bTime = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
        return aTime - bTime;
      });
  }, [schedule, currentDate]);

  // Calculate progress
  const progress = useMemo(() => {
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    return dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0;
  }, [dayTasks]);

  const handleMarkComplete = async (blockId) => {
    try {
      setUpdating(true);
      await scheduleService.updateTimeBlock(schedule._id, blockId, { status: 'completed' });
      onScheduleUpdate();
      toast.success('Task marked as complete!');
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      priority: 'medium',
      status: 'scheduled',
      notes: ''
    });
  };

  const handleGenerateDailyPlan = async () => {
    try {
      setGenerating(true);
      await scheduleService.generateDailyOptimized({
        targetDate: currentDate.toISOString()
      });
      toast.success('Daily optimized schedule generated');
      onScheduleUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate daily optimized schedule');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTimeBlock = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (toMinutes(formData.endTime) <= toMinutes(formData.startTime)) {
      toast.error('End time must be later than start time');
      return;
    }

    try {
      setUpdating(true);
      await scheduleService.addTimeBlock(schedule._id, {
        ...formData,
        date: currentDate.toISOString(),
        isBreak: false
      });
      toast.success('Time block added');
      resetForm();
      setShowCreateForm(false);
      onScheduleUpdate();
    } catch (error) {
      toast.error('Failed to add time block');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      setUpdating(true);
      await scheduleService.deleteTimeBlock(schedule._id, blockId);
      toast.success('Time block deleted');
      onScheduleUpdate();
    } catch (error) {
      toast.error('Failed to delete time block');
    } finally {
      setUpdating(false);
    }
  };

  const openEditBlock = (block) => {
    setEditingBlock(block);
    setFormData({
      title: block.title || '',
      startTime: block.startTime || '09:00',
      endTime: block.endTime || '10:00',
      priority: block.priority || 'medium',
      status: block.status || 'scheduled',
      notes: block.notes || ''
    });
  };

  const handleUpdateBlock = async () => {
    if (!editingBlock) return;

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (toMinutes(formData.endTime) <= toMinutes(formData.startTime)) {
      toast.error('End time must be later than start time');
      return;
    }

    try {
      setUpdating(true);
      await scheduleService.updateTimeBlock(schedule._id, editingBlock._id, {
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes
      });
      toast.success('Time block updated');
      setEditingBlock(null);
      resetForm();
      onScheduleUpdate();
    } catch (error) {
      toast.error('Failed to update time block');
    } finally {
      setUpdating(false);
    }
  };

  if (dayTasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No tasks scheduled for today
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Enjoy your free day or generate a schedule to add tasks!
        </p>
        <button
          onClick={handleGenerateDailyPlan}
          disabled={generating}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-blue-600 text-white disabled:opacity-50"
        >
          <SparklesIcon className="w-4 h-4" />
          {generating ? 'Optimizing...' : 'Generate Daily Optimized Plan'}
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 border border-indigo-100 dark:border-indigo-800/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Daily Optimized Planner</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Uses exam proximity, assignment complexity, your past performance and available free slots.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowCreateForm((prev) => !prev);
                setEditingBlock(null);
                resetForm();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
            >
              <PlusIcon className="w-4 h-4" /> Add Block
            </button>
            <button
              onClick={handleGenerateDailyPlan}
              disabled={generating}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-blue-600 text-white text-sm disabled:opacity-50"
            >
              <SparklesIcon className="w-4 h-4" />
              {generating ? 'Optimizing...' : 'Re-optimize Day'}
            </button>
          </div>
        </div>
      </Card>

      {(showCreateForm || editingBlock) && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{editingBlock ? 'Edit Time Block' : 'Create Time Block'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <select
              value={formData.priority}
              onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes (optional)"
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingBlock(null);
                resetForm();
              }}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={editingBlock ? handleUpdateBlock : handleCreateTimeBlock}
              disabled={updating}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
            >
              {editingBlock ? 'Save Changes' : 'Create Block'}
            </button>
          </div>
        </Card>
      )}

      {/* Progress Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Today's Progress
          </h2>
          <span className="text-2xl font-bold text-primary-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-blue-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{dayTasks.length}</p>
            <p className="text-sm text-gray-500">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {dayTasks.filter(t => t.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {dayTasks.filter(t => t.status !== 'completed').length}
            </p>
            <p className="text-sm text-gray-500">Remaining</p>
          </div>
        </div>
      </Card>

      {/* Schedule Stats */}
      {schedule.stats && (
        <ScheduleStats stats={schedule.stats} />
      )}

      {/* Time Blocks */}
      <div className="space-y-3">
        {dayTasks.map((block, index) => (
          <motion.div
            key={block._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TimeBlockCard
              block={block}
              onComplete={() => handleMarkComplete(block._id)}
              onEdit={() => openEditBlock(block)}
              onDelete={() => handleDeleteBlock(block._id)}
              isLoading={updating}
            />
          </motion.div>
        ))}
      </div>

    </div>
  );
};

export default DailyTaskView;
