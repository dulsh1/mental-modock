const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');
const { scheduleOptimizer } = require('../services/scheduling/scheduleOptimizer');

const toMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number);
  return (h * 60) + m;
};

const toTime = (mins) => {
  const clamped = Math.max(0, Math.min(1439, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getWeekBounds = (dateLike) => {
  const base = new Date(dateLike);
  base.setHours(0, 0, 0, 0);
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - base.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
};

const sameDay = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

const recalculateScheduleStats = (schedule) => {
  const timeBlocks = schedule.timeBlocks || [];
  const scheduledBlocks = timeBlocks.filter((b) => !b.isBreak);
  const breakBlocks = timeBlocks.filter((b) => b.isBreak);

  const totalScheduledHours = scheduledBlocks.reduce((sum, b) => sum + ((toMinutes(b.endTime) - toMinutes(b.startTime)) / 60), 0);
  const totalBreakHours = breakBlocks.reduce((sum, b) => sum + ((toMinutes(b.endTime) - toMinutes(b.startTime)) / 60), 0);
  const tasksCompleted = scheduledBlocks.filter((b) => b.status === 'completed').length;
  const tasksScheduled = scheduledBlocks.length;

  const daySpan = Math.max(1, Math.round((schedule.weekEndDate - schedule.weekStartDate) / (1000 * 60 * 60 * 24)) + 1);
  const workStart = toMinutes(schedule.preferences?.workdayStart || '08:00');
  const workEnd = toMinutes(schedule.preferences?.workdayEnd || '22:00');
  const totalAvailableHours = ((workEnd - workStart) / 60) * daySpan;
  const workloadPercentage = totalAvailableHours > 0 ? Math.min(100, Math.round((totalScheduledHours / totalAvailableHours) * 100)) : 0;

  schedule.stats = {
    ...schedule.stats,
    totalScheduledHours: Math.round(totalScheduledHours * 100) / 100,
    totalBreakHours: Math.round(totalBreakHours * 100) / 100,
    tasksScheduled,
    tasksCompleted,
    workloadPercentage
  };
};

/**
 * Generate an optimized schedule for user's tasks
 * POST /api/schedules/generate
 */
exports.generateOptimizedSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskIds, weekStartDate, preferences, autoFill = true } = req.body;

    // Validate inputs
    if (!weekStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Week start date is required'
      });
    }

    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch tasks to schedule
    const query = { user: userId, status: { $in: ['pending', 'in_progress'] } };
    if (taskIds && taskIds.length > 0) {
      query._id = { $in: taskIds };
    }

    const tasksToSchedule = await Task.find(query)
      .select('title estimatedDuration priority dueDate isFlexible minDaysBeforeDue excludeDates')
      .sort({ priority: -1, dueDate: 1 });

    if (tasksToSchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No unscheduled tasks found',
        data: { timeBlocks: [] }
      });
    }

    // Get user preferences or use defaults
    const defaultPreferences = {
      workdayStart: preferences?.workdayStart || '08:00',
      workdayEnd: preferences?.workdayEnd || '22:00',
      breakDuration: preferences?.breakDuration || 15,
      breakInterval: preferences?.breakInterval || 90,
      maxDailyHours: preferences?.maxDailyHours || 8,
      minDailyHours: preferences?.minDailyHours || 2,
      preferredLunch: preferences?.preferredLunch || { start: '12:00', end: '13:00' },
      excludeDays: preferences?.excludeDays || []
    };

    // Generate optimized schedule using algorithm
    const schedulingResult = await scheduleOptimizer.generateOptimizedSchedule(
      tasksToSchedule,
      defaultPreferences,
      weekStart,
      weekEnd
    );

    // Create Schedule document
    const schedule = new Schedule({
      user: userId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      scheduleType: 'auto-generated',
      timeBlocks: schedulingResult.timeBlocks,
      conflicts: [],
      preferences: defaultPreferences,
      stats: schedulingResult.stats
    });

    await schedule.save();

    // Update tasks with scheduling info
    for (const timeBlock of schedulingResult.timeBlocks) {
      if (timeBlock.task) {
        await Task.findByIdAndUpdate(timeBlock.task, {
          scheduledDate: timeBlock.date,
          scheduledTime: {
            start: timeBlock.startTime,
            end: timeBlock.endTime
          },
          timeBlockId: schedule._id
        });
      }
    }

    res.json({
      success: true,
      message: 'Schedule generated successfully',
      data: {
        scheduleId: schedule._id,
        timeBlocks: schedule.timeBlocks,
        stats: schedule.stats
      }
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate an optimized schedule for a single day based on urgency, complexity,
 * past performance and currently free slots in that day.
 * POST /api/schedules/daily/generate
 */
exports.generateDailyOptimizedSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetDate, taskIds = [], preferences = {} } = req.body;

    const dayDate = targetDate ? new Date(targetDate) : new Date();
    if (Number.isNaN(dayDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid targetDate' });
    }
    dayDate.setHours(0, 0, 0, 0);

    const { weekStart, weekEnd } = getWeekBounds(dayDate);

    let schedule = await Schedule.findOne({ user: userId, weekStartDate: weekStart, isArchived: false });
    if (!schedule) {
      schedule = new Schedule({
        user: userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        scheduleType: 'hybrid',
        preferences: {
          workdayStart: preferences.workdayStart || '08:00',
          workdayEnd: preferences.workdayEnd || '22:00',
          breakDuration: preferences.breakDuration || 15,
          breakInterval: preferences.breakInterval || 90,
          maxDailyHours: preferences.maxDailyHours || 8,
          minDailyHours: preferences.minDailyHours || 2
        },
        timeBlocks: [],
        conflicts: []
      });
    }

    schedule.preferences = {
      ...schedule.preferences,
      ...preferences
    };

    const taskQuery = {
      user: userId,
      status: { $in: ['pending', 'in_progress'] }
    };
    if (taskIds?.length) {
      taskQuery._id = { $in: taskIds };
    }

    const tasks = await Task.find(taskQuery)
      .select('title description priority dueDate estimatedDuration actualDuration tags subtasks category')
      .sort({ dueDate: 1, priority: -1 });

    if (!tasks.length) {
      return res.status(400).json({ success: false, message: 'No active tasks available for optimization' });
    }

    const performanceRows = await Task.find({
      user: userId,
      status: 'completed',
      actualDuration: { $gt: 0 },
      estimatedDuration: { $gt: 0 }
    }).select('actualDuration estimatedDuration').limit(120);

    const avgPerformanceFactor = performanceRows.length
      ? performanceRows.reduce((sum, row) => sum + (row.actualDuration / row.estimatedDuration), 0) / performanceRows.length
      : 1;

    const dayBlocks = (schedule.timeBlocks || []).filter((b) => sameDay(b.date, dayDate));

    const occupied = dayBlocks
      .map((b) => ({
        start: toMinutes(b.startTime),
        end: toMinutes(b.endTime)
      }))
      .sort((a, b) => a.start - b.start);

    const startOfDay = toMinutes(schedule.preferences.workdayStart || '08:00');
    const endOfDay = toMinutes(schedule.preferences.workdayEnd || '22:00');
    const minBlockMins = 30;

    const freeSlots = [];
    let cursor = startOfDay;
    occupied.forEach((slot) => {
      if (slot.start - cursor >= minBlockMins) {
        freeSlots.push({ start: cursor, end: slot.start });
      }
      cursor = Math.max(cursor, slot.end);
    });
    if (endOfDay - cursor >= minBlockMins) {
      freeSlots.push({ start: cursor, end: endOfDay });
    }

    if (!freeSlots.length) {
      return res.status(400).json({ success: false, message: 'No available free slots in this day' });
    }

    const priorityWeight = { urgent: 1.5, high: 1.2, medium: 1.0, low: 0.8 };

    const scored = tasks.map((task) => {
      const title = String(task.title || '').toLowerCase();
      const tags = (task.tags || []).map((t) => String(t).toLowerCase());
      const isExamRelated = /exam|test|quiz|midterm|final/.test(title) || tags.some((t) => /exam|test|quiz/.test(t));
      const isAssignment = /assignment|project|homework|lab|report/.test(title) || tags.some((t) => /assignment|project|homework|lab|report/.test(t));

      const due = task.dueDate ? new Date(task.dueDate) : null;
      const daysToDue = due ? Math.max(0, Math.ceil((due - dayDate) / (1000 * 60 * 60 * 24))) : 21;
      const dueUrgency = due ? (daysToDue <= 1 ? 2.2 : daysToDue <= 3 ? 1.6 : daysToDue <= 7 ? 1.25 : 1.0) : 0.9;

      const complexity = ((task.estimatedDuration || 60) / 60)
        + ((task.subtasks?.length || 0) * 0.15)
        + (isAssignment ? 0.35 : 0)
        + (isExamRelated ? 0.45 : 0);

      const score = (priorityWeight[task.priority] || 1)
        * dueUrgency
        * (1 + complexity * 0.25)
        * (isExamRelated ? 1.2 : 1);

      const adjustedMinutes = Math.max(
        minBlockMins,
        Math.round((task.estimatedDuration || 60) * Math.max(0.8, Math.min(1.5, avgPerformanceFactor)))
      );

      return {
        task,
        score,
        adjustedMinutes,
        reason: `${isExamRelated ? 'Exam proximity' : isAssignment ? 'Assignment complexity' : 'Task priority'} + past performance + free slots`
      };
    }).sort((a, b) => b.score - a.score);

    const generatedBlocks = [];

    for (const item of scored) {
      let remaining = item.adjustedMinutes;
      for (const slot of freeSlots) {
        const available = slot.end - slot.start;
        if (remaining <= 0) break;
        if (available < minBlockMins) continue;

        const chunk = Math.min(available, Math.max(minBlockMins, Math.min(remaining, 120)));
        if (chunk < minBlockMins) continue;

        const blockStart = slot.start;
        const blockEnd = blockStart + chunk;

        generatedBlocks.push({
          _id: new mongoose.Types.ObjectId(),
          date: new Date(dayDate),
          startTime: toTime(blockStart),
          endTime: toTime(blockEnd),
          task: item.task._id,
          title: item.task.title,
          isBreak: false,
          priority: item.task.priority || 'medium',
          status: 'scheduled',
          notes: `[AutoDaily] ${item.reason}`
        });

        slot.start = blockEnd;
        remaining -= chunk;
      }
    }

    // Replace only non-completed auto-generated blocks for the selected day.
    schedule.timeBlocks = (schedule.timeBlocks || []).filter((block) => {
      if (!sameDay(block.date, dayDate)) return true;
      if (block.status === 'completed') return true;
      return !(String(block.notes || '').startsWith('[AutoDaily]'));
    });

    schedule.timeBlocks.push(...generatedBlocks);

    for (const block of generatedBlocks) {
      if (block.task) {
        await Task.findByIdAndUpdate(block.task, {
          scheduledDate: block.date,
          scheduledTime: { start: block.startTime, end: block.endTime },
          timeBlockId: schedule._id
        });
      }
    }

    recalculateScheduleStats(schedule);
    schedule.lastModified = new Date();
    await schedule.save();

    const populated = await Schedule.findById(schedule._id)
      .populate('timeBlocks.task', 'title description priority estimatedDuration')
      .populate('sourceTemplate', 'name');

    return res.json({
      success: true,
      message: 'Daily optimized schedule generated',
      data: populated
    });
  } catch (error) {
    console.error('Error generating daily optimized schedule:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a time block to a schedule (CRUD create)
 * POST /api/schedules/:scheduleId/timeblock
 */
exports.addTimeBlock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId } = req.params;
    const blockData = req.body;

    const schedule = await Schedule.findOne({ _id: scheduleId, user: userId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const newBlock = schedule.addTimeBlock({
      date: blockData.date,
      startTime: blockData.startTime,
      endTime: blockData.endTime,
      title: blockData.title,
      task: blockData.task || null,
      isBreak: !!blockData.isBreak,
      breakType: blockData.breakType || null,
      priority: blockData.priority || 'medium',
      status: blockData.status || 'scheduled',
      notes: blockData.notes || ''
    });

    if (newBlock.task) {
      await Task.findByIdAndUpdate(newBlock.task, {
        scheduledDate: newBlock.date,
        scheduledTime: { start: newBlock.startTime, end: newBlock.endTime },
        timeBlockId: schedule._id
      });
    }

    recalculateScheduleStats(schedule);
    schedule.lastModified = new Date();
    await schedule.save();

    res.status(201).json({ success: true, message: 'Time block added', data: newBlock });
  } catch (error) {
    console.error('Error adding time block:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a time block (CRUD delete)
 * DELETE /api/schedules/:scheduleId/timeblock/:blockId
 */
exports.deleteTimeBlock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId, blockId } = req.params;

    const schedule = await Schedule.findOne({ _id: scheduleId, user: userId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const block = schedule.timeBlocks.id(blockId);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Time block not found' });
    }

    const linkedTaskId = block.task;
    schedule.removeTimeBlock(blockId);

    if (linkedTaskId) {
      await Task.findByIdAndUpdate(linkedTaskId, {
        scheduledDate: null,
        scheduledTime: { start: null, end: null },
        timeBlockId: null
      });
    }

    recalculateScheduleStats(schedule);
    schedule.lastModified = new Date();
    await schedule.save();

    res.json({ success: true, message: 'Time block deleted' });
  } catch (error) {
    console.error('Error deleting time block:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get schedule for a specific week
 * GET /api/schedules/week/:weekStartDate
 */
exports.getScheduleForWeek = async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekStartDate } = req.params;

    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);

    const schedule = await Schedule.findOne({
      user: userId,
      weekStartDate: weekStart,
      isArchived: false
    })
      .populate('timeBlocks.task', 'title description priority estimatedDuration')
      .populate('sourceTemplate', 'name');

    if (!schedule) {
      return res.json({
        success: true,
        message: 'No schedule found for this week',
        data: null
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get schedules for a month
 * GET /api/schedules/month/:yearMonth
 */
exports.getScheduleForMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const { yearMonth } = req.params; // Format: "2024-03"

    const [year, month] = yearMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const schedules = await Schedule.find({
      user: userId,
      weekStartDate: { $gte: monthStart, $lte: monthEnd },
      isArchived: false
    })
      .sort({ weekStartDate: 1 })
      .populate('timeBlocks.task', 'title dueDate priority');

    // Also get upcoming deadlines for the month
    const tasks = await Task.find({
      user: userId,
      dueDate: { $gte: monthStart, $lte: monthEnd },
      status: { $ne: 'completed' }
    })
      .select('title dueDate priority category')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: {
        schedules,
        deadlines: tasks,
        monthStart,
        monthEnd
      }
    });
  } catch (error) {
    console.error('Error fetching monthly schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update a specific time block
 * PUT /api/schedules/:scheduleId/timeblock/:blockId
 */
exports.updateTimeBlock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId, blockId } = req.params;
    const updates = req.body;

    const schedule = await Schedule.findOne({
      _id: scheduleId,
      user: userId
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const timeBlock = schedule.timeBlocks.id(blockId);
    if (!timeBlock) {
      return res.status(404).json({
        success: false,
        message: 'Time block not found'
      });
    }

    // Update time block fields
    Object.assign(timeBlock, updates);

    // If block moved or status changed, update task
    if (timeBlock.task) {
      await Task.findByIdAndUpdate(timeBlock.task, {
        scheduledDate: timeBlock.date,
        scheduledTime: {
          start: timeBlock.startTime,
          end: timeBlock.endTime
        },
        status: updates.status && updates.status === 'completed' ? 'completed' : undefined
      });
    }

    recalculateScheduleStats(schedule);
    schedule.lastModified = new Date();

    await schedule.save();

    res.json({
      success: true,
      message: 'Time block updated',
      data: {
        timeBlock
      }
    });
  } catch (error) {
    console.error('Error updating time block:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get alternative schedule suggestions
 * GET /api/schedules/:scheduleId/suggestions
 */
exports.getSuggestedSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId } = req.params;

    const schedule = await Schedule.findOne({
      _id: scheduleId,
      user: userId
    }).populate('timeBlocks.task');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Generate alternative schedules
    const alternatives = [];

    // Alternative 1: Extend work hours
    const alt1 = JSON.parse(JSON.stringify(schedule));
    alt1.preferences.maxDailyHours = (alt1.preferences.maxDailyHours || 8) + 2;
    alt1.description = 'Extended study hours (2 additional hours per day)';
    alternatives.push(alt1);

    // Alternative 2: Reduce break times
    const alt2 = JSON.parse(JSON.stringify(schedule));
    alt2.preferences.breakDuration = Math.max(5, (alt2.preferences.breakDuration || 15) - 5);
    alt2.description = 'Shorter break durations';
    alternatives.push(alt2);

    // Alternative 3: Compress schedule
    const alt3 = JSON.parse(JSON.stringify(schedule));
    alt3.preferences.minDailyHours = (alt3.preferences.minDailyHours || 2) - 1;
    alt3.description = 'More flexible daily hour requirements';
    alternatives.push(alt3);

    res.json({
      success: true,
      data: {
        current: schedule,
        alternatives: alternatives.slice(0, 2) // Return top 2 alternatives
      }
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all schedules for user (archived and current)
 * GET /api/schedules
 */
exports.getSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const { archived = false, limit = 20, offset = 0 } = req.query;

    const query = {
      user: userId,
      isArchived: archived === 'true'
    };

    const schedules = await Schedule.find(query)
      .sort({ weekStartDate: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('timeBlocks.task', 'title priority');

    const total = await Schedule.countDocuments(query);

    res.json({
      success: true,
      data: schedules,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Archive a schedule
 * PUT /api/schedules/:scheduleId/archive
 */
exports.archiveSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId } = req.params;

    const schedule = await Schedule.findOneAndUpdate(
      { _id: scheduleId, user: userId },
      { isArchived: true, lastModified: new Date() },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule archived',
      data: schedule
    });
  } catch (error) {
    console.error('Error archiving schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete a schedule
 * DELETE /api/schedules/:scheduleId
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId } = req.params;

    const schedule = await Schedule.findOneAndDelete({
      _id: scheduleId,
      user: userId
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Clear schedule references from tasks
    await Task.updateMany(
      { timeBlockId: scheduleId },
      {
        timeBlockId: null,
        scheduledDate: null,
        scheduledTime: { start: null, end: null }
      }
    );

    res.json({
      success: true,
      message: 'Schedule deleted'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
