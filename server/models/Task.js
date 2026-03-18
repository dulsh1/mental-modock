const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 30
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  order: {
    type: Number,
    default: 0
  }
});

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide task title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'academic', 'health', 'finance', 'social', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  scheduledDate: {
    type: Date
  },
  scheduledTime: {
    start: String, // Format: "HH:MM"
    end: String
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 60
  },
  actualDuration: {
    type: Number // in minutes
  },
  timeBlockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    default: null
  },
  isFlexible: {
    type: Boolean,
    default: true // can be rescheduled if conflicts arise
  },
  minDaysBeforeDue: {
    type: Number,
    default: 1 // must schedule at least X days before due date
  },
  excludeDates: [{
    type: Date
  }],
  subtasks: [subtaskSchema],
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  aiBreakdownSuggestion: {
    originalPrompt: String,
    generatedAt: Date
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  recurrence: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    interval: Number,
    endDate: Date
  },
  completedAt: Date,
  notes: String,
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, scheduledDate: 1 });
taskSchema.index({ user: 1, priority: 1 });

// Virtual for progress percentage
taskSchema.virtual('progress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  const completed = this.subtasks.filter(st => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Method to check if task is overdue
taskSchema.methods.isOverdue = function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > new Date(this.dueDate);
};

// Static method to get tasks for scheduling
taskSchema.statics.getUnscheduledTasks = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['pending', 'in_progress'] },
    scheduledDate: null
  }).sort({ priority: -1, dueDate: 1 });
};

// Static method to get today's tasks
taskSchema.statics.getTodaysTasks = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    user: userId,
    $or: [
      { scheduledDate: { $gte: today, $lt: tomorrow } },
      { dueDate: { $gte: today, $lt: tomorrow } }
    ]
  }).sort({ 'scheduledTime.start': 1, priority: -1 });
};

// Ensure virtuals are included in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
