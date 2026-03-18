const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  dayOfWeek: {
    type: Number, // 0=Monday, 1=Tuesday, ..., 6=Sunday
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6]
  },
  startTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  activity: {
    type: String, // e.g., 'Mathematics', 'Physics', 'Reading', 'Exercise'
    required: true
  },
  activityType: {
    type: String,
    enum: ['study', 'break', 'meal', 'exercise', 'other'],
    default: 'study'
  },
  subject: String, // for academic activities
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  flexibilityLevel: {
    type: String,
    enum: ['fixed', 'flexible', 'optional'],
    default: 'flexible'
  },
  notes: String,
  color: {
    type: String,
    default: '#3B82F6' // Default blue
  }
});

const preferredHoursSchema = new mongoose.Schema({
  subjectName: String,
  totalHours: {
    type: Number,
    default: 0
  },
  hoursPerSession: {
    type: Number,
    default: 1
  },
  frequency: {
    type: String,
    enum: ['daily', 'alternate-days', 'weekly'],
    default: 'daily'
  }
});

const timetableTemplateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  templateType: {
    type: String,
    enum: ['study-focused', 'balanced', 'flexible', 'exam-prep', 'custom'],
    default: 'custom'
  },
  schedulePattern: {
    timeSlots: [timeSlotSchema],
    breakSchedule: {
      shortBreakDuration: {
        type: Number,
        default: 15 // minutes
      },
      longBreakDuration: {
        type: Number,
        default: 30 // minutes
      },
      longBreakAfter: {
        type: Number,
        default: 120 // after 120 minutes of work
      }
    },
    workdayStart: {
      type: String,
      default: '08:00'
    },
    workdayEnd: {
      type: String,
      default: '22:00'
    }
  },
  preferredHours: [preferredHoursSchema],
  weeklyWorkload: {
    totalHours: Number,
    studyHours: Number,
    breakHours: Number
  },
  semester: String, // e.g., 'Spring 2024', 'Fall 2024'
  startDate: Date,
  endDate: Date,
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  appliedToWeeks: [{
    weekStartDate: Date,
    appliedAt: Date
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    score: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    feedbackCount: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  customSettings: {
    includeWeekends: {
      type: Boolean,
      default: false
    },
    autoAdjustBased: {
      type: String,
      enum: ['completion-rate', 'energy-levels', 'deadline-proximity'],
      default: null
    },
    minTimeBetweenSubjects: {
      // minutes before switching to different subject
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
timetableTemplateSchema.index({ user: 1, isDefault: 1 });
timetableTemplateSchema.index({ user: 1, name: 1 });
timetableTemplateSchema.index({ user: 1, createdAt: -1 });
timetableTemplateSchema.index({ user: 1, templateType: 1 });
timetableTemplateSchema.index({ isPublic: 1, rating: -1 });

// Virtual for calculating total template hours
timetableTemplateSchema.virtual('totalHours').get(function() {
  if (!this.schedulePattern || !this.schedulePattern.timeSlots) return 0;

  return this.schedulePattern.timeSlots.reduce((total, slot) => {
    const start = new Date(`2000-01-01 ${slot.startTime}`);
    const end = new Date(`2000-01-01 ${slot.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);

    if (slot.activityType !== 'break') {
      return total + hours;
    }
    return total;
  }, 0);
});

// Virtual for getting subject list
timetableTemplateSchema.virtual('subjects').get(function() {
  if (!this.schedulePattern || !this.schedulePattern.timeSlots) return [];
  const subjects = new Set();

  this.schedulePattern.timeSlots.forEach(slot => {
    if (slot.subject) subjects.add(slot.subject);
  });

  return Array.from(subjects);
});

// Method to get time slots for a specific day
timetableTemplateSchema.methods.getSlotsForDay = function(dayOfWeek) {
  if (!this.schedulePattern || !this.schedulePattern.timeSlots) return [];

  return this.schedulePattern.timeSlots
    .filter(slot => slot.dayOfWeek === dayOfWeek)
    .sort((a, b) => {
      const startA = a.startTime.split(':');
      const startB = b.startTime.split(':');
      return parseInt(startA[0]) * 60 + parseInt(startA[1]) -
             (parseInt(startB[0]) * 60 + parseInt(startB[1]));
    });
};

// Method to add a time slot
timetableTemplateSchema.methods.addTimeSlot = function(slotData) {
  if (!this.schedulePattern) {
    this.schedulePattern = { timeSlots: [] };
  }

  const newSlot = {
    _id: new mongoose.Types.ObjectId(),
    ...slotData
  };

  this.schedulePattern.timeSlots.push(newSlot);
  return newSlot;
};

// Method to remove a time slot
timetableTemplateSchema.methods.removeTimeSlot = function(slotId) {
  if (this.schedulePattern && this.schedulePattern.timeSlots) {
    this.schedulePattern.timeSlots = this.schedulePattern.timeSlots
      .filter(s => s._id.toString() !== slotId.toString());
  }
};

// Method to set as default
timetableTemplateSchema.methods.setAsDefault = function() {
  this.isDefault = true;
  this.markModified('isDefault');
  return this.save();
};

// Method to record usage
timetableTemplateSchema.methods.recordUsage = function(weekStartDate) {
  this.appliedToWeeks.push({
    weekStartDate: weekStartDate,
    appliedAt: new Date()
  });
  this.usageCount = (this.usageCount || 0) + 1;
  this.markModified('appliedToWeeks');
  return this.save();
};

// Method to add rating/feedback
timetableTemplateSchema.methods.addRating = function(score) {
  const totalScore = this.rating.score * this.rating.feedbackCount + score;
  this.rating.feedbackCount += 1;
  this.rating.score = totalScore / this.rating.feedbackCount;
  this.markModified('rating');
  return this.save();
};

// Static method to get user's templates
timetableTemplateSchema.statics.getUserTemplates = function(userId, includeDefaults = true) {
  const query = { user: userId };
  return this.find(query)
    .sort({ isDefault: -1, updatedAt: -1 })
    .limit(50);
};

// Static method to get default template
timetableTemplateSchema.statics.getDefaultTemplate = function(userId) {
  return this.findOne({
    user: userId,
    isDefault: true
  });
};

// Static method to get public templates (for sharing/inspiration)
timetableTemplateSchema.statics.getPublicTemplates = function(options = {}) {
  const {
    templateType = null,
    sortBy = 'rating',
    limit = 20
  } = options;

  const query = { isPublic: true };
  if (templateType) query.templateType = templateType;

  let sortObj = { 'rating.score': -1 };
  if (sortBy === 'recent') sortObj = { createdAt: -1 };
  if (sortBy === 'popular') sortObj = { usageCount: -1 };

  return this.find(query)
    .sort(sortObj)
    .limit(limit)
    .populate('user', 'name email');
};

// Enable virtuals in JSON output
timetableTemplateSchema.set('toJSON', { virtuals: true });
timetableTemplateSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TimetableTemplate', timetableTemplateSchema);
