const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  preferences: {
    productiveHours: {
      morning: { start: { type: Number, default: 9 }, end: { type: Number, default: 12 } },
      afternoon: { start: { type: Number, default: 14 }, end: { type: Number, default: 17 } },
      evening: { start: { type: Number, default: 19 }, end: { type: Number, default: 21 } }
    },
    notificationsEnabled: { type: Boolean, default: true },
    dailyReminderTime: { type: String, default: '09:00' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    pomodoroSettings: {
      workDuration: { type: Number, default: 25 },
      shortBreak: { type: Number, default: 5 },
      longBreak: { type: Number, default: 15 },
      sessionsBeforeLongBreak: { type: Number, default: 4 }
    }
  },
  stats: {
    totalLogs: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLogDate: { type: Date }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update streak method
userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (this.stats.lastLogDate) {
    const lastLog = new Date(this.stats.lastLogDate);
    lastLog.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastLog) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      this.stats.currentStreak += 1;
    } else if (diffDays > 1) {
      this.stats.currentStreak = 1;
    }
  } else {
    this.stats.currentStreak = 1;
  }
  
  if (this.stats.currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = this.stats.currentStreak;
  }
  
  this.stats.lastLogDate = today;
};

module.exports = mongoose.model('User', userSchema);
