const mongoose = require('mongoose');

/**
 * Service for applying timetable templates to generate schedules
 */
class TimetableApplier {
  /**
   * Apply a template to a specific week and generate schedule
   * @param {Object} template - TimetableTemplate document
   * @param {Date} weekStartDate - Start of week
   * @param {Date} weekEndDate - End of week
   * @param {Array} tasks - Tasks to fit into template
   * @param {Object} preferences - User preferences (optional overrides)
   * @returns {Object} - Generated schedule data
   */
  async applyTemplateToWeek(template, weekStartDate, weekEndDate, tasks, preferences = {}) {
    const timeBlocks = [];
    let stats = {
      totalScheduledHours: 0,
      totalBreakHours: 0,
      tasksScheduled: 0,
      tasksCompleted: 0,
      workloadPercentage: 0
    };

    if (!template || !template.schedulePattern || !template.schedulePattern.timeSlots) {
      return { timeBlocks, conflicts: [], stats };
    }

    const templateSlots = template.schedulePattern.timeSlots;
    const assignedTasks = new Set();
    let scheduledHours = 0;

    // Group template slots by day for easier processing
    const slotsByDay = this.groupSlotsByDay(templateSlots);

    // Sort tasks by priority and due date
    const sortedTasks = this.sortTasksByPriority(tasks);

    // Iterate through week
    for (let current = new Date(weekStartDate); current <= weekEndDate; current.setDate(current.getDate() + 1)) {
      const dayOfWeek = current.getDay();
      const daySlots = slotsByDay[dayOfWeek] || [];

      for (const slot of daySlots) {
        // Skip if this slot is already a break
        if (slot.activityType === 'break' || slot.activityType === 'meal') {
          timeBlocks.push({
            _id: new mongoose.Types.ObjectId(),
            date: new Date(current),
            startTime: slot.startTime,
            endTime: slot.endTime,
            title: slot.activity,
            isBreak: true,
            breakType: slot.activityType,
            status: 'scheduled'
          });

          const hours = this.calculateHours(slot.startTime, slot.endTime);
          stats.totalBreakHours += hours;
          continue;
        }

        // Try to find a matching task for this activity
        let assignedTask = null;

        // First, try to find a task matching the subject
        if (slot.subject) {
          assignedTask = sortedTasks.find(t =>
            !assignedTasks.has(t._id) &&
            (t.tags?.includes(slot.subject) ||
             t.category === slot.subject ||
             t.title.toLowerCase().includes(slot.subject.toLowerCase()))
          );
        }

        // If no subject match, find any unassigned task
        if (!assignedTask) {
          assignedTask = sortedTasks.find(t => !assignedTasks.has(t._id));
        }

        if (assignedTask) {
          // Check if task fits in this slot
          const slotDuration = this.calculateDuration(slot.startTime, slot.endTime);
          const taskDuration = assignedTask.estimatedDuration || 60;

          if (taskDuration <= slotDuration) {
            // Task fits perfectly or has extra time
            timeBlocks.push({
              _id: new mongoose.Types.ObjectId(),
              date: new Date(current),
              startTime: slot.startTime,
              endTime: slot.endTime,
              task: assignedTask._id,
              title: assignedTask.title,
              isBreak: false,
              priority: assignedTask.priority,
              status: 'scheduled'
            });

            assignedTasks.add(assignedTask._id);
            const hours = this.calculateHours(slot.startTime, slot.endTime);
            scheduledHours += hours;
            stats.tasksScheduled += 1;
          } else {
            // Task needs more time - split across next available slots
            // For now, just assign to this slot and let conflict detection handle it
            timeBlocks.push({
              _id: new mongoose.Types.ObjectId(),
              date: new Date(current),
              startTime: slot.startTime,
              endTime: slot.endTime,
              task: assignedTask._id,
              title: assignedTask.title,
              isBreak: false,
              priority: assignedTask.priority,
              status: 'scheduled',
              notes: 'Partial - may need additional time'
            });

            assignedTasks.add(assignedTask._id);
            const hours = this.calculateHours(slot.startTime, slot.endTime);
            scheduledHours += hours;
            stats.tasksScheduled += 1;
          }
        } else {
          // No task to assign - create a free/study block
          timeBlocks.push({
            _id: new mongoose.Types.ObjectId(),
            date: new Date(current),
            startTime: slot.startTime,
            endTime: slot.endTime,
            title: `${slot.activity} (Flexible)`,
            isBreak: false,
            priority: 'low',
            status: 'scheduled',
            notes: 'No assigned task - flexible time block'
          });
        }
      }
    }

    // Calculate stats
    stats.totalScheduledHours = Math.round(scheduledHours * 100) / 100;
    stats.workloadPercentage = this.calculateWorkloadPercentage(
      scheduledHours,
      template.schedulePattern.workdayStart,
      template.schedulePattern.workdayEnd,
      weekStartDate,
      weekEndDate
    );

    return {
      timeBlocks: timeBlocks.sort((a, b) => new Date(a.date) - new Date(b.date)),
      conflicts: [],
      stats
    };
  }

  /**
   * Validate if template application was successful
   */
  async validateTemplateApplication(result) {
    const validation = {
      isValid: true,
      conflicts: [],
      warnings: []
    };

    // Check if all tasks were scheduled
    if (result.scheduledTaskCount < result.taskCount) {
      const unscheduledCount = result.taskCount - result.scheduledTaskCount;
      validation.warnings.push(
        `${unscheduledCount} task(s) could not be scheduled with this template`
      );
    }

    // Check for overlaps in time blocks
    const overlaps = this.findOverlappingBlocks(result.timeBlocks);
    if (overlaps.length > 0) {
      validation.isValid = false;
      overlaps.forEach(overlap => {
        validation.conflicts.push({
          _id: new mongoose.Types.ObjectId(),
          type: 'overlap',
          severity: 'high',
          affectedTimeBlocks: overlap.blocks,
          description: `Overlapping schedule detected: ${overlap.blockNames.join(' & ')}`,
          suggestion: 'Review template structure or adjust time allocations',
          isResolved: false
        });
      });
    }

    return validation;
  }

  /**
   * Get template preview for a specific week
   */
  getTemplatePreview(template, weekStartDate, weekEndDate) {
    const preview = {
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      dailySchedules: {}
    };

    const slotsByDay = this.groupSlotsByDay(template.schedulePattern.timeSlots);

    for (let i = 0; i < 7; i++) {
      const current = new Date(weekStartDate);
      current.setDate(current.getDate() + i);
      const dayOfWeek = current.getDay();
      const dayName = this.getDayName(dayOfWeek);

      preview.dailySchedules[dayName] = {
        date: current.toISOString().split('T')[0],
        slots: slotsByDay[dayOfWeek] || [],
        totalHours: (slotsByDay[dayOfWeek] || [])
          .reduce((sum, slot) => sum + this.calculateHours(slot.startTime, slot.endTime), 0)
      };
    }

    return preview;
  }

  /**
   * Check conflicts when applying template to existing schedule
   */
  checkTemplateConflicts(template, existingTimeBlocks) {
    const conflicts = [];

    const templateSlots = template.schedulePattern.timeSlots;
    const occupiedSlots = existingTimeBlocks.filter(b => !b.isBreak);

    // Check if template slots overlap with existing ones
    templateSlots.forEach(templateSlot => {
      occupiedSlots.forEach(existingBlock => {
        if (this.slotsOverlap(templateSlot, existingBlock)) {
          conflicts.push({
            type: 'template-schedule-conflict',
            templateSlot: templateSlot.activity,
            existingBlock: existingBlock.title,
            suggestion: 'Adjust existing schedule or modify template'
          });
        }
      });
    });

    return conflicts;
  }

  // Helper methods
  groupSlotsByDay(slots) {
    const byDay = {};
    slots.forEach(slot => {
      const day = slot.dayOfWeek;
      if (!byDay[day]) {
        byDay[day] = [];
      }
      byDay[day].push(slot);
    });

    // Sort each day's slots by start time
    for (const day in byDay) {
      byDay[day].sort((a, b) => {
        const aStart = this.timeStringToMinutes(a.startTime);
        const bStart = this.timeStringToMinutes(b.startTime);
        return aStart - bStart;
      });
    }

    return byDay;
  }

  sortTasksByPriority(tasks) {
    const priorityMap = { urgent: 0, high: 1, medium: 2, low: 3 };

    return [...tasks].sort((a, b) => {
      const priorityDiff = priorityMap[a.priority] - priorityMap[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const dueDateA = a.dueDate ? new Date(a.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const dueDateB = b.dueDate ? new Date(b.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return dueDateA - dueDateB;
    });
  }

  calculateHours(startTime, endTime) {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);
    return (end - start) / 60;
  }

  calculateDuration(startTime, endTime) {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);
    return end - start;
  }

  timeStringToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  calculateWorkloadPercentage(scheduledHours, workdayStart, workdayEnd, weekStart, weekEnd) {
    const startMin = this.timeStringToMinutes(workdayStart);
    const endMin = this.timeStringToMinutes(workdayEnd);
    const dailyHours = (endMin - startMin) / 60;

    let totalDays = 0;
    for (let current = new Date(weekStart); current <= weekEnd; current.setDate(current.getDate() + 1)) {
      totalDays += 1;
    }

    const totalAvailable = dailyHours * totalDays;
    return totalAvailable > 0 ? Math.round((scheduledHours / totalAvailable) * 100) : 0;
  }

  findOverlappingBlocks(timeBlocks) {
    const overlaps = [];

    for (let i = 0; i < timeBlocks.length; i++) {
      for (let j = i + 1; j < timeBlocks.length; j++) {
        const block1 = timeBlocks[i];
        const block2 = timeBlocks[j];

        if (block1.date.toDateString() === block2.date.toDateString() &&
            this.blocksOverlap(block1, block2)) {
          overlaps.push({
            blocks: [block1._id, block2._id],
            blockNames: [block1.title, block2.title]
          });
        }
      }
    }

    return overlaps;
  }

  blocksOverlap(block1, block2) {
    const start1 = this.timeStringToMinutes(block1.startTime);
    const end1 = this.timeStringToMinutes(block1.endTime);
    const start2 = this.timeStringToMinutes(block2.startTime);
    const end2 = this.timeStringToMinutes(block2.endTime);

    return start1 < end2 && start2 < end1;
  }

  slotsOverlap(slot1, block2) {
    const start1 = this.timeStringToMinutes(slot1.startTime);
    const end1 = this.timeStringToMinutes(slot1.endTime);
    const start2 = this.timeStringToMinutes(block2.startTime);
    const end2 = this.timeStringToMinutes(block2.endTime);

    return start1 < end2 && start2 < end1;
  }

  getDayName(dayOfWeek) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek] || 'Unknown';
  }
}

module.exports = {
  timetableApplier: new TimetableApplier()
};
