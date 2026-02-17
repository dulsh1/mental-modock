const MentalHealthLog = require('../../models/MentalHealthLog');

/**
 * Schedule tasks optimally based on user's productive hours and patterns
 */
async function scheduleTasksOptimally(tasks, productiveHours, userId, targetDate = null) {
  // Get user's historical productivity patterns
  const patterns = await analyzeProductivityPatterns(userId);
  
  // Define time slots based on productive hours
  const timeSlots = generateTimeSlots(productiveHours, patterns);
  
  // Sort tasks by priority and deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return a.dueDate ? -1 : 1;
  });

  const scheduledTasks = [];
  const date = targetDate ? new Date(targetDate) : new Date();
  date.setHours(0, 0, 0, 0);

  // Available slots for scheduling
  let availableSlots = [...timeSlots];

  for (const task of sortedTasks) {
    const duration = task.estimatedDuration || 60; // Default 60 minutes
    
    // Find best slot for this task
    const bestSlot = findBestSlot(availableSlots, duration, task.priority, patterns);
    
    if (bestSlot) {
      scheduledTasks.push({
        taskId: task._id,
        title: task.title,
        priority: task.priority,
        date: date,
        time: {
          start: bestSlot.start,
          end: calculateEndTime(bestSlot.start, duration)
        },
        duration
      });

      // Update available slots
      availableSlots = updateAvailableSlots(availableSlots, bestSlot, duration);
    } else {
      // No available slot, mark as unscheduled
      scheduledTasks.push({
        taskId: task._id,
        title: task.title,
        priority: task.priority,
        scheduled: false,
        reason: 'No available time slot'
      });
    }
  }

  return scheduledTasks;
}

/**
 * Analyze user's productivity patterns from historical data
 */
async function analyzeProductivityPatterns(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await MentalHealthLog.find({
    user: userId,
    date: { $gte: thirtyDaysAgo }
  });

  // Default patterns
  const patterns = {
    peakEnergyHour: 10, // 10 AM default
    lowEnergyHour: 14,  // 2 PM default (post-lunch dip)
    averageEnergy: 5,
    consistency: 0
  };

  if (logs.length < 7) {
    return patterns;
  }

  // Calculate average energy by hour (if we had hourly data)
  // For now, use daily averages
  const energyScores = logs.map(l => l.energy?.score || 5);
  patterns.averageEnergy = energyScores.reduce((a, b) => a + b, 0) / energyScores.length;

  // Calculate logging consistency
  patterns.consistency = logs.length / 30;

  return patterns;
}

/**
 * Generate time slots based on productive hours
 */
function generateTimeSlots(productiveHours, patterns) {
  const slots = [];

  // Morning slots
  if (productiveHours.morning) {
    for (let hour = productiveHours.morning.start; hour < productiveHours.morning.end; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        period: 'morning',
        energyLevel: patterns.averageEnergy >= 5 ? 'high' : 'medium'
      });
    }
  }

  // Afternoon slots
  if (productiveHours.afternoon) {
    for (let hour = productiveHours.afternoon.start; hour < productiveHours.afternoon.end; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        period: 'afternoon',
        energyLevel: hour === 14 ? 'low' : 'medium' // Post-lunch dip
      });
    }
  }

  // Evening slots
  if (productiveHours.evening) {
    for (let hour = productiveHours.evening.start; hour < productiveHours.evening.end; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        period: 'evening',
        energyLevel: 'medium'
      });
    }
  }

  return slots;
}

/**
 * Find the best slot for a task
 */
function findBestSlot(availableSlots, duration, priority, patterns) {
  if (availableSlots.length === 0) return null;

  // For urgent/high priority, prefer high energy slots
  if (priority === 'urgent' || priority === 'high') {
    const highEnergySlots = availableSlots.filter(s => s.energyLevel === 'high');
    if (highEnergySlots.length > 0) {
      return highEnergySlots[0];
    }
  }

  // For medium priority, any slot works
  // For low priority, prefer low energy slots
  if (priority === 'low') {
    const lowEnergySlots = availableSlots.filter(s => s.energyLevel === 'low');
    if (lowEnergySlots.length > 0) {
      return lowEnergySlots[0];
    }
  }

  // Return first available slot
  return availableSlots[0];
}

/**
 * Calculate end time given start time and duration
 */
function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Update available slots after scheduling a task
 */
function updateAvailableSlots(slots, usedSlot, duration) {
  // For simplicity, remove the used slot
  // In a more sophisticated version, we'd split slots
  return slots.filter(s => s.start !== usedSlot.start);
}

module.exports = {
  scheduleTasksOptimally,
  analyzeProductivityPatterns
};
