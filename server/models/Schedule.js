const mongoose = require('mongoose');

const timeBlockSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  title: {
    type: String,
    required: true
  },
  isBreak: {
    type: Boolean,
    default: false
  },
  breakType: {
    // 'short', 'lunch', 'exercise', 'custom'
    type: String,
    enum: ['short', 'lunch', 'exercise', 'custom'],
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'rescheduled', 'skipped'],
    default: 'scheduled'
  },
  notes: String,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const conflictSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  type: {
    type: String,
    enum: ['overlap', 'workload-exceeded', 'high-priority-clustering', 'deadline-conflict'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  affectedTimeBlocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  }],
  affectedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  description: String,
  suggestion: String,
  isResolved: {
    type: Boolean,
    default: false
  },
  resolutionApplied: String,
  detectedAt: {
    type: Date,
    default: Date.now
  }
});

const preferencesSchema = new mongoose.Schema({
  workdayStart: {
    type: String,
    default: '08:00' // 8 AM
  },
  workdayEnd: {
    type: String,
    default: '22:00' // 10 PM
  },
  breakDuration: {
    type: Number,
    default: 15 // minutes
  },
  breakInterval: {
    type: Number,
    default: 90 // minutes between breaks
  },
  maxDailyHours: {
    type: Number,
    default: 8 // maximum study/work hours per day
  },
  minDailyHours: {
    type: Number,
    default: 2 // minimum study/work hours per day
  },
  preferredLunch: {
    start: {
      type: String,
      default: '12:00'
    },
    end: {
      type: String,
      default: '13:00'
    }
  },
  excludeDays: [{
    type: Number, // 0-6 (Sunday-Saturday)
    enum: [0, 1, 2, 3, 4, 5, 6]
  }],
  focusHours: [{
    dayOfWeek: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5, 6]
    },
    start: String,
    end: String
  }]
});

const scheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  scheduleType: {
    type: String,
    enum: ['auto-generated', 'custom', 'hybrid'],
    default: 'auto-generated'
  },
  sourceTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimetableTemplate',
    default: null
  },
  timeBlocks: [timeBlockSchema],
  conflicts: [conflictSchema],
  preferences: preferencesSchema,
  stats: {
    totalScheduledHours: {
      type: Number,
      default: 0
    },
    totalBreakHours: {
      type: Number,
      default: 0
    },
    tasksScheduled: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    workloadPercentage: {
      type: Number,
      default: 0 // percentage of available time used
    }
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
scheduleSchema.index({ user: 1, weekStartDate: -1 });
scheduleSchema.index({ user: 1, scheduleType: 1 });
scheduleSchema.index({ user: 1, isArchived: 1 });
scheduleSchema.index({ 'timeBlocks.task': 1 });
scheduleSchema.index({ 'timeBlocks.date': 1 });

// Virtual for calculating total scheduled hours
scheduleSchema.virtual('totalHoursScheduled').get(function() {
  if (!this.timeBlocks) return 0;

  return this.timeBlocks.reduce((total, block) => {
    if (block.isBreak) return total;

    const start = new Date(`2000-01-01 ${block.startTime}`);
    const end = new Date(`2000-01-01 ${block.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);

    return total + hours;
  }, 0);
});

// Virtual for calculating free time
scheduleSchema.virtual('totalFreeTime').get(function() {
  if (!this.timeBlocks) return 0;

  const workdayStart = this.preferences.workdayStart;
  const workdayEnd = this.preferences.workdayEnd;

  const start = new Date(`2000-01-01 ${workdayStart}`);
  const end = new Date(`2000-01-01 ${workdayEnd}`);
  const totalAvailable = (end - start) / (1000 * 60 * 60);

  return totalAvailable - this.totalHoursScheduled - (this.stats.totalBreakHours || 0);
});

// Method to add a time block
scheduleSchema.methods.addTimeBlock = function(blockData) {
  const newBlock = {
    _id: new mongoose.Types.ObjectId(),
    ...blockData
  };
  this.timeBlocks.push(newBlock);
  return newBlock;
};

// Method to remove a time block
scheduleSchema.methods.removeTimeBlock = function(blockId) {
  this.timeBlocks = this.timeBlocks.filter(b => b._id.toString() !== blockId.toString());
};

// Method to add a conflict
scheduleSchema.methods.addConflict = function(conflictData) {
  const newConflict = {
    _id: new mongoose.Types.ObjectId(),
    ...conflictData
  };
  this.conflicts.push(newConflict);
  return newConflict;
};

// Method to resolve a conflict
scheduleSchema.methods.resolveConflict = function(conflictId, resolutionApplied) {
  const conflict = this.conflicts.find(c => c._id.toString() === conflictId.toString());
  if (conflict) {
    conflict.isResolved = true;
    conflict.resolutionApplied = resolutionApplied;
  }
  return conflict;
};

// Method to get tasks for day
scheduleSchema.methods.getTasksForDay = function(date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return this.timeBlocks.filter(block => {
    const blockDate = new Date(block.date);
    return blockDate >= dayStart && blockDate <= dayEnd && !block.isBreak;
  });
};

// Static method to get active schedule for user
scheduleSchema.statics.getActiveSchedule = function(userId, date = new Date()) {
  const dayOfWeek = date.getDay();
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  return this.findOne({
    user: userId,
    weekStartDate: weekStart,
    isArchived: false
  }).populate('timeBlocks.task sourceTemplate');
};

// Static method to get schedules for date range
scheduleSchema.statics.getSchedulesInRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    weekStartDate: { $gte: startDate, $lte: endDate },
    isArchived: false
  }).sort({ weekStartDate: -1 }).populate('timeBlocks.task');
};

// Enable virtuals in JSON output
scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
