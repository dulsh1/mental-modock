const mongoose = require('mongoose');

/**
 * Service for detecting, analyzing, and resolving scheduling conflicts
 */
class ConflictResolver {
  /**
   * Detect all conflicts in a schedule
   */
  async detectConflicts(schedule) {
    if (!schedule || !schedule.timeBlocks || schedule.timeBlocks.length === 0) {
      return [];
    }

    const conflicts = [];

    // Check for overlaps
    const overlapConflicts = this.detectOverlaps(schedule.timeBlocks);
    conflicts.push(...overlapConflicts);

    // Check for high-priority clustering
    const clusteringConflicts = this.detectHighPriorityClustering(schedule.timeBlocks);
    conflicts.push(...clusteringConflicts);

    // Check for workload exceeded
    const workloadConflicts = this.detectWorkloadExceeded(
      schedule.timeBlocks,
      schedule.preferences
    );
    conflicts.push(...workloadConflicts);

    // Check for deadline conflicts
    const deadlineConflicts = await this.detectDeadlineConflicts(schedule);
    conflicts.push(...deadlineConflicts);

    return conflicts;
  }

  /**
   * Detect overlapping time blocks
   */
  detectOverlaps(timeBlocks) {
    const conflicts = [];

    for (let i = 0; i < timeBlocks.length; i++) {
      for (let j = i + 1; j < timeBlocks.length; j++) {
        const block1 = timeBlocks[i];
        const block2 = timeBlocks[j];

        // Only check blocks on same day
        if (block1.date.toDateString() !== block2.date.toDateString()) {
          continue;
        }

        if (this.blocksOverlap(block1, block2)) {
          conflicts.push({
            _id: new mongoose.Types.ObjectId(),
            type: 'overlap',
            severity: 'high',
            affectedTimeBlocks: [block1._id, block2._id],
            affectedTasks: block1.task && block2.task ? [block1.task, block2.task] : [],
            description: `"${block1.title}" (${block1.startTime}-${block1.endTime}) overlaps with "${block2.title}" (${block2.startTime}-${block2.endTime})`,
            suggestion: `Move "${block2.title}" to a different time slot on the same day or reschedule to ${this.getNextAvailableDay()}`,
            isResolved: false
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect high-priority tasks scheduled too close together
   */
  detectHighPriorityClustering(timeBlocks) {
    const conflicts = [];
    const highPriorityBlocks = timeBlocks.filter(b =>
      (b.priority === 'high' || b.priority === 'urgent') && !b.isBreak
    );

    for (let i = 0; i < highPriorityBlocks.length; i++) {
      for (let j = i + 1; j < highPriorityBlocks.length; j++) {
        const block1 = highPriorityBlocks[i];
        const block2 = highPriorityBlocks[j];

        const daysDiff = Math.abs(
          new Date(block1.date).getTime() - new Date(block2.date).getTime()
        ) / (1000 * 60 * 60 * 24);

        // Flag if high-priority tasks within 2 days
        if (daysDiff < 2 && daysDiff > 0) {
          conflicts.push({
            _id: new mongoose.Types.ObjectId(),
            type: 'high-priority-clustering',
            severity: 'medium',
            affectedTimeBlocks: [block1._id, block2._id],
            affectedTasks: block1.task && block2.task ? [block1.task, block2.task] : [],
            description: `Multiple high-priority tasks scheduled too close together: "${block1.title}" and "${block2.title}"`,
            suggestion: `Consider spreading these tasks across more days to maintain focus. Reschedule "${block2.title}" to at least 2 days later if possible.`,
            isResolved: false
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect when daily workload exceeds preferences
   */
  detectWorkloadExceeded(timeBlocks, preferences) {
    const conflicts = [];
    const maxDailyHours = preferences.maxDailyHours || 8;
    const minDailyHours = preferences.minDailyHours || 2;

    const workloadByDay = this.calculateDailyWorkload(timeBlocks);

    for (const date in workloadByDay) {
      const workload = workloadByDay[date];

      if (workload.work > maxDailyHours) {
        conflicts.push({
          _id: new mongoose.Types.ObjectId(),
          type: 'workload-exceeded',
          severity: 'high',
          affectedTimeBlocks: workload.blocks,
          description: `On ${date}: ${Math.round(workload.work * 100) / 100}h of work exceeds limit of ${maxDailyHours}h`,
          suggestion: `Reduce workload by moving lowest-priority tasks to other days. Consider: (1) Extend schedule into more days, (2) Increase max daily hours to ${Math.ceil(workload.work + 1)}h, or (3) Reschedule tasks with flexible deadlines.`,
          isResolved: false
        });
      }

      if (workload.work < minDailyHours && workload.work > 0) {
        // Low workload is less critical but can be mentioned
        // Skip for now as it's not a critical conflict
      }
    }

    return conflicts;
  }

  /**
   * Detect deadline conflicts or near misses
   */
  async detectDeadlineConflicts(schedule) {
    const conflicts = [];

    // This would require accessing Task model
    // For now, return empty array as Task access should be via controller
    return conflicts;
  }

  /**
   * Get resolution suggestions for a specific conflict
   */
  async getResolutionSuggestions(conflict, schedule) {
    const suggestions = [];

    switch (conflict.type) {
      case 'overlap':
        suggestions.push(
          {
            name: 'Reschedule later block',
            description: `Move the second task to the next available time slot`,
            action: 'reschedule',
            difficulty: 'easy'
          },
          {
            name: 'Reschedule earlier block',
            description: `Move the first task to an earlier available slot`,
            action: 'reschedule',
            difficulty: 'easy'
          },
          {
            name: 'Split into two blocks',
            description: `Split one task across multiple days`,
            action: 'split',
            difficulty: 'medium'
          },
          {
            name: 'Compress durations',
            description: `Reduce estimated duration for one of the tasks`,
            action: 'compress',
            difficulty: 'hard'
          }
        );
        break;

      case 'high-priority-clustering':
        suggestions.push(
          {
            name: 'Spread across more days',
            description: `Move the second high-priority task to at least 2 days later`,
            action: 'reschedule',
            difficulty: 'easy'
          },
          {
            name: 'Extend overall schedule',
            description: `Extend scheduling period into 2-3 weeks to space out tasks`,
            action: 'extend',
            difficulty: 'medium'
          }
        );
        break;

      case 'workload-exceeded':
        suggestions.push(
          {
            name: 'Reduce break times',
            description: `Shorten break durations to accommodate more work hours`,
            action: 'reduceBreaks',
            difficulty: 'easy'
          },
          {
            name: 'Increase daily limit',
            description: `Increase max daily hours preference`,
            action: 'adjustPreferences',
            difficulty: 'easy'
          },
          {
            name: 'Remove low-priority tasks',
            description: `Reschedule lowest-priority tasks to following weeks`,
            action: 'removeTasks',
            difficulty: 'medium'
          },
          {
            name: 'Extend scheduling period',
            description: `Spread tasks across more days/weeks`,
            action: 'extend',
            difficulty: 'medium'
          }
        );
        break;

      default:
        suggestions.push({
          name: 'Review and adjust manually',
          description: `Manually review this conflict and make adjustments`,
          action: 'manual',
          difficulty: 'hard'
        });
    }

    return suggestions;
  }

  /**
   * Apply a resolution to a schedule
   */
  async applyResolution(schedule, suggestion, resolutionData) {
    switch (suggestion.action) {
      case 'reschedule':
        // This would involve finding new slots and moving time blocks
        // Implementation depends on resolutionData.blockId and new time slot
        break;

      case 'split':
        // Split a task into multiple time blocks
        break;

      case 'reduceBreaks':
        // Reduce break times in schedule
        if (schedule.preferences) {
          schedule.preferences.breakDuration =
            Math.max(5, (schedule.preferences.breakDuration || 15) - 5);
        }
        break;

      case 'adjustPreferences':
        // Adjust scheduling preferences
        if (resolutionData.newMaxDailyHours) {
          schedule.preferences.maxDailyHours = resolutionData.newMaxDailyHours;
        }
        break;

      case 'extend':
        // Extend scheduling period (handled at controller level)
        break;
    }

    return schedule;
  }

  /**
   * Analyze root cause of a conflict
   */
  analyzeConflict(conflict, schedule) {
    const analysis = {
      type: conflict.type,
      severity: conflict.severity,
      rootCauses: [],
      impacts: [],
      timeToResolve: 'unknown'
    };

    switch (conflict.type) {
      case 'overlap':
        analysis.rootCauses.push('Insufficient available time slots');
        analysis.rootCauses.push('Tasks with flexible scheduling marked as fixed');
        analysis.impacts.push('Cannot complete both tasks as scheduled');
        analysis.timeToResolve = '5-15 minutes';
        break;

      case 'high-priority-clustering':
        analysis.rootCauses.push('Multiple high-priority tasks with similar deadlines');
        analysis.impacts.push('Risk of burnout due to sustained high intensity');
        analysis.impacts.push('Reduced focus and quality on individual tasks');
        analysis.timeToResolve = '10-30 minutes';
        break;

      case 'workload-exceeded':
        analysis.rootCauses.push('Too many tasks for available time');
        analysis.rootCauses.push('Unrealistic time estimates');
        analysis.rootCauses.push('Insufficient break time allocated');
        analysis.impacts.push('Cannot feasibly complete schedule');
        analysis.impacts.push('User burnout likely');
        analysis.timeToResolve = '30+ minutes';
        break;
    }

    return analysis;
  }

  // Helper methods
  blocksOverlap(block1, block2) {
    const start1 = this.timeStringToMinutes(block1.startTime);
    const end1 = this.timeStringToMinutes(block1.endTime);
    const start2 = this.timeStringToMinutes(block2.startTime);
    const end2 = this.timeStringToMinutes(block2.endTime);

    return start1 < end2 && start2 < end1;
  }

  calculateDailyWorkload(timeBlocks) {
    const workload = {};

    timeBlocks.forEach(block => {
      const dateStr = block.date.toDateString();
      if (!workload[dateStr]) {
        workload[dateStr] = {
          work: 0,
          breaks: 0,
          blocks: []
        };
      }

      const hours = this.calculateHours(block.startTime, block.endTime);

      if (block.isBreak) {
        workload[dateStr].breaks += hours;
      } else {
        workload[dateStr].work += hours;
        workload[dateStr].blocks.push(block._id);
      }
    });

    return workload;
  }

  calculateHours(startTime, endTime) {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);
    return (end - start) / 60;
  }

  timeStringToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getNextAvailableDay() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString();
  }
}

module.exports = {
  conflictResolver: new ConflictResolver()
};
