const mongoose = require('mongoose');

const semesterGPAGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Please provide semester reference'],
    unique: true
  },
  targetGPA: {
    type: Number,
    required: [true, 'Please provide target GPA'],
    min: [0, 'Target GPA cannot be less than 0'],
    max: [4.0, 'Target GPA cannot exceed 4.0']
  },
  status: {
    type: String,
    enum: ['active', 'achieved', 'abandoned'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for user's goals
semesterGPAGoalSchema.index({ user: 1, semester: 1 });

module.exports = mongoose.model('SemesterGPAGoal', semesterGPAGoalSchema);
