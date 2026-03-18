const mongoose = require('mongoose');

/**
 * Core scheduling algorithm that generates optimized schedules
 * Uses a priority-based approach with deadline constraints
 */
class ScheduleOptimizer {
  /**
   * Generate an optimized schedule for given tasks
   * @param {Array} tasks - Array of tasks with title, estimatedDuration, priority, dueDate, etc.
   * @param {Object} preferences - User's scheduling preferences
   * @param {Date} weekStartDate - Start of the week to schedule
   * @param {Date} weekEndDate - End of the week to schedule
   * @returns {Object} - Schedule with timeBlocks and conflicts
   */
  async generateOptimizedSchedule(tasks, preferences, weekStartDate, weekEndDate) {
    if (!tasks || tasks.length === 0) {
      return {
        timeBlocks: [],
        conflicts: [],
        stats: {
          totalScheduledHours: 0,
          totalBreakHours: 0,
          tasksScheduled: 0,
          tasksCompleted: 0,
          workloadPercentage: 0
        }
      };
    }

    const timeBlocks = [];
    const conflicts = [];
    let totalScheduledHours = 0;
    let totalBreakHours = 0;

    // Sort tasks by priority and due date
    const sortedTasks = this.sortTasks(tasks);

    // Generate initial time blocks
    for (const task of sortedTasks) {
      const slot = this.findBestTimeSlot(
        task,
        timeBlocks,
        preferences,
        weekStartDate,
        weekEndDate
      );

      if (slot) {
        const timeBlock = {
          _id: new mongoose.Types.ObjectId(),
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          task: task._id,
          title: task.title,
          isBreak: false,
          priority: task.priority,
          status: 'scheduled'
        };

        timeBlocks.push(timeBlock);

        // Calculate hours
        const hours = this.calculateHoursBetween(slot.startTime, slot.endTime);
        totalScheduledHours += hours;
      }
    }

    // Add breaks
    const { breakBlocks, breakHours } = this.addBreaks(
      timeBlocks,
      preferences,
      weekStartDate,
      weekEndDate
    );
    timeBlocks.push(...breakBlocks);
    totalBreakHours = breakHours;

    // Detect conflicts
    const detectedConflicts = this.detectConflicts(timeBlocks, preferences);
    conflicts.push(...detectedConflicts);

    // Calculate workload percentage
    const availableHours = this.calculateAvailableHours(
      preferences,
      weekStartDate,
      weekEndDate
    );
    const workloadPercentage = availableHours > 0
      ? Math.round((totalScheduledHours / availableHours) * 100)
      : 0;

    return {
      timeBlocks: timeBlocks.sort((a, b) => new Date(a.date) - new Date(b.date)),
      conflicts,
      stats: {
        totalScheduledHours: Math.round(totalScheduledHours * 100) / 100,
        totalBreakHours: Math.round(totalBreakHours * 100) / 100,
        tasksScheduled: sortedTasks.filter(t =>
          timeBlocks.some(tb => tb.task && tb.task.toString() === t._id.toString())
        ).length,
        tasksCompleted: 0,
        workloadPercentage
      }
    };
  }

  /**
   * Sort tasks by: priority (DESC) > dueDate (ASC) > duration (DESC)
   */
  sortTasks(tasks) {
    const priorityMap = { urgent: 0, high: 1, medium: 2, low: 3 };

    return [...tasks].sort((a, b) => {
      // By priority
      const priorityDiff = priorityMap[a.priority] - priorityMap[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // By due date
      const dueDateA = a.dueDate ? new Date(a.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const dueDateB = b.dueDate ? new Date(b.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const dueDateDiff = dueDateA - dueDateB;
      if (dueDateDiff !== 0) return dueDateDiff;

      // By duration (longer tasks first)
      return (b.estimatedDuration || 60) - (a.estimatedDuration || 60);
    });
  }

  /**
   * Find the best time slot for a task
   */
  findBestTimeSlot(task, occupiedBlocks, preferences, weekStart, weekEnd) {
    const duration = task.estimatedDuration || 60; // minutes
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isFlexible = task.isFlexible !== false;
    const minDaysBeforeDue = task.minDaysBeforeDue || 1;
    const excludeDates = task.excludeDates || [];

    // Calculate latest day to schedule
    let latestScheduleDate = new Date(weekEnd);
    if (dueDate) {
      const deadlineDate = new Date(dueDate);
      deadlineDate.setDate(deadlineDate.getDate() - minDaysBeforeDue);
      latestScheduleDate = deadlineDate.getTime() < latestScheduleDate.getTime()
        ? deadlineDate
        : latestScheduleDate;
    }

    // Iterate through days in the week
    for (let current = new Date(weekStart); current <= latestScheduleDate; current.setDate(current.getDate() + 1)) {
      const dayOfWeek = current.getDay();

      // Skip excluded days
      if (preferences.excludeDays && preferences.excludeDays.includes(dayOfWeek)) {
        continue;
      }

      // Skip excluded dates
      const dateStr = current.toISOString().split('T')[0];
      if (excludeDates.some(d => d.toString().split('T')[0] === dateStr)) {
        continue;
      }

      // Find available slots in this day
      const availableSlots = this.getAvailableSlotsForDay(
        current,
        duration,
        occupiedBlocks,
        preferences
      );

      if (availableSlots.length > 0) {
        // Prefer earlier slots (morning)
        return {
          date: new Date(current),
          startTime: availableSlots[0].start,
          endTime: availableSlots[0].end
        };
      }
    }

    // If no slot found in preferred days, return null
    // Task cannot be scheduled this week
    return null;
  }

  /**
   * Get available time slots for a specific day
   */
  getAvailableSlotsForDay(date, durationMinutes, occupiedBlocks, preferences) {
    const dayBlocks = occupiedBlocks.filter(b => {
      const blockDate = new Date(b.date);
      return blockDate.toDateString() === date.toDateString();
    });

    const dayOfWeek = date.getDay();
    let workdayStart = '08:00';
    let workdayEnd = '22:00';

    if (preferences.workdayStart) workdayStart = preferences.workdayStart;
    if (preferences.workdayEnd) workdayEnd = preferences.workdayEnd;

    // Focus hours override
    if (preferences.focusHours) {
      const focusHour = preferences.focusHours.find(h => h.dayOfWeek === dayOfWeek);
      if (focusHour) {
        workdayStart = focusHour.start;
        workdayEnd = focusHour.end;
      }
    }

    const startHour = this.timeStringToMinutes(workdayStart);
    const endHour = this.timeStringToMinutes(workdayEnd);
    const availableSlots = [];

    let currentTime = startHour;
    const lunchStart = preferences.preferredLunch?.start
      ? this.timeStringToMinutes(preferences.preferredLunch.start)
      : 12 * 60;
    const lunchEnd = preferences.preferredLunch?.end
      ? this.timeStringToMinutes(preferences.preferredLunch.end)
      : 13 * 60;

    while (currentTime + durationMinutes <= endHour) {
      // Skip lunch time
      if (this.timeRangesOverlap(
        currentTime,
        currentTime + durationMinutes,
        lunchStart,
        lunchEnd
      )) {
        currentTime = lunchEnd;
        continue;
      }

      // Check if slot conflicts with occupied blocks
      const slotStart = currentTime;
      const slotEnd = currentTime + durationMinutes;
      const hasConflict = dayBlocks.some(block => {
        const blockStart = this.timeStringToMinutes(block.startTime);
        const blockEnd = this.timeStringToMinutes(block.endTime);
        return this.timeRangesOverlap(slotStart, slotEnd, blockStart, blockEnd);
      });

      if (!hasConflict) {
        availableSlots.push({
          start: this.minutesToTimeString(slotStart),
          end: this.minutesToTimeString(slotEnd)
        });
      }

      // Move to next 30-minute interval
      currentTime += 30;
    }

    return availableSlots;
  }

  /**
   * Add break blocks to schedule
   */
  addBreaks(timeBlocks, preferences, weekStart, weekEnd) {
    const breakBlocks = [];
    let totalBreakHours = 0;

    const breakDuration = preferences.breakDuration || 15;
    const breakInterval = preferences.breakInterval || 90;
    const lunchDuration = 60; // 1 hour

    // Group blocks by day
    const blocksByDay = {};
    timeBlocks.forEach(block => {
      const dateStr = block.date.toISOString().split('T')[0];
      if (!blocksByDay[dateStr]) {
        blocksByDay[dateStr] = [];
      }
      blocksByDay[dateStr].push(block);
    });

    // Add breaks for each day
    for (const dateStr in blocksByDay) {
      const dayBlocks = blocksByDay[dateStr].sort((a, b) => {
        const aStart = this.timeStringToMinutes(a.startTime);
        const bStart = this.timeStringToMinutes(b.startTime);
        return aStart - bStart;
      });

      let minutesWorked = 0;

      for (let i = 0; i < dayBlocks.length - 1; i++) {
        const currentBlock = dayBlocks[i];
        const nextBlock = dayBlocks[i + 1];

        const blockDuration = this.timeStringToMinutes(currentBlock.endTime) -
                             this.timeStringToMinutes(currentBlock.startTime);
        minutesWorked += blockDuration;

        // Add break if threshold met
        if (minutesWorked >= breakInterval) {
          const breakStart = currentBlock.endTime;
          const breakEnd = this.addMinutestoTime(breakStart, breakDuration);

          breakBlocks.push({
            _id: new mongoose.Types.ObjectId(),
            date: currentBlock.date,
            startTime: breakStart,
            endTime: breakEnd,
            title: 'Break',
            isBreak: true,
            breakType: 'short',
            status: 'scheduled'
          });

          totalBreakHours += breakDuration / 60;
          minutesWorked = 0;
        }
      }

      // Add lunch break if no lunch exists
      const lunchExists = dayBlocks.some(b =>
        this.timeStringToMinutes(b.startTime) >= this.timeStringToMinutes(preferences.preferredLunch?.start || '12:00') &&
        this.timeStringToMinutes(b.startTime) < this.timeStringToMinutes(preferences.preferredLunch?.end || '13:00')
      );

      if (!lunchExists && dayBlocks.length > 0) {
        breakBlocks.push({
          _id: new mongoose.Types.ObjectId(),
          date: dayBlocks[0].date,
          startTime: preferences.preferredLunch?.start || '12:00',
          endTime: preferences.preferredLunch?.end || '13:00',
          title: 'Lunch Break',
          isBreak: true,
          breakType: 'lunch',
          status: 'scheduled'
        });
        totalBreakHours += lunchDuration / 60;
      }
    }

    return {
      breakBlocks,
      breakHours: Math.round(totalBreakHours * 100) / 100
    };
  }

  /**
   * Detect conflicts in the schedule
   */
  detectConflicts(timeBlocks, preferences) {
    const conflicts = [];

    // Check for overlaps
    for (let i = 0; i < timeBlocks.length; i++) {
      for (let j = i + 1; j < timeBlocks.length; j++) {
        const block1 = timeBlocks[i];
        const block2 = timeBlocks[j];

        // Only check blocks on same day
        if (block1.date.toDateString() !== block2.date.toDateString()) {
          continue;
        }

        const time1Start = this.timeStringToMinutes(block1.startTime);
        const time1End = this.timeStringToMinutes(block1.endTime);
        const time2Start = this.timeStringToMinutes(block2.startTime);
        const time2End = this.timeStringToMinutes(block2.endTime);

        if (this.timeRangesOverlap(time1Start, time1End, time2Start, time2End)) {
          conflicts.push({
            _id: new mongoose.Types.ObjectId(),
            type: 'overlap',
            severity: 'high',
            affectedTimeBlocks: [block1._id, block2._id],
            description: `${block1.title} overlaps with ${block2.title}`,
            suggestion: 'Adjust one of the tasks to a different time slot',
            isResolved: false
          });
        }
      }
    }

    // Check for high-priority clustering
    const highPriorityTasks = timeBlocks.filter(b =>
      b.priority === 'high' || b.priority === 'urgent'
    );

    for (let i = 0; i < highPriorityTasks.length; i++) {
      for (let j = i + 1; j < highPriorityTasks.length; j++) {
        const task1 = highPriorityTasks[i];
        const task2 = highPriorityTasks[j];

        const dayDiff = Math.abs(
          task1.date - task2.date
        ) / (1000 * 60 * 60 * 24);

        if (dayDiff < 2) {
          conflicts.push({
            _id: new mongoose.Types.ObjectId(),
            type: 'high-priority-clustering',
            severity: 'medium',
            affectedTimeBlocks: [task1._id, task2._id],
            description: `Multiple high-priority tasks scheduled close together: ${task1.title}, ${task2.title}`,
            suggestion: 'Consider spreading out high-priority tasks to avoid burnout',
            isResolved: false
          });
        }
      }
    }

    // Check for workload exceeded
    const maxDailyHours = preferences.maxDailyHours || 8;
    const dailyWorkload = {};

    timeBlocks.forEach(block => {
      const dateStr = block.date.toDateString();
      if (!dailyWorkload[dateStr]) {
        dailyWorkload[dateStr] = 0;
      }

      if (!block.isBreak) {
        const hours = this.calculateHoursBetween(block.startTime, block.endTime);
        dailyWorkload[dateStr] += hours;
      }
    });

    for (const date in dailyWorkload) {
      if (dailyWorkload[date] > maxDailyHours) {
        const affectedBlocks = timeBlocks
          .filter(b => b.date.toDateString() === date && !b.isBreak)
          .map(b => b._id);

        conflicts.push({
          _id: new mongoose.Types.ObjectId(),
          type: 'workload-exceeded',
          severity: 'high',
          affectedTimeBlocks: affectedBlocks,
          description: `Daily workload (${dailyWorkload[date]}h) exceeds maximum (${maxDailyHours}h) on ${date}`,
          suggestion: `Reduce daily workload by moving tasks to other days or extend scheduling to more days`,
          isResolved: false
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculate available hours in the week
   */
  calculateAvailableHours(preferences, weekStart, weekEnd) {
    const workdayStart = this.timeStringToMinutes(preferences.workdayStart || '08:00');
    const workdayEnd = this.timeStringToMinutes(preferences.workdayEnd || '22:00');
    const dailyHours = (workdayEnd - workdayStart) / 60;

    let totalAvailable = 0;
    const excludeDays = preferences.excludeDays || [];

    for (let current = new Date(weekStart); current <= weekEnd; current.setDate(current.getDate() + 1)) {
      const dayOfWeek = current.getDay();
      if (!excludeDays.includes(dayOfWeek)) {
        totalAvailable += dailyHours;
      }
    }

    return totalAvailable;
  }

  // Helper methods
  timeStringToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  addMinutestoTime(timeStr, minutes) {
    let totalMinutes = this.timeStringToMinutes(timeStr) + minutes;
    return this.minutesToTimeString(totalMinutes);
  }

  calculateHoursBetween(startTime, endTime) {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);
    return (end - start) / 60;
  }

  timeRangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }
}

module.exports = {
  scheduleOptimizer: new ScheduleOptimizer()
};
