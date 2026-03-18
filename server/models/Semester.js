const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semesterName: {
    type: String,
    required: [true, 'Please provide semester name'],
    trim: true,
    maxlength: [100, 'Semester name cannot exceed 100 characters'],
    example: 'Fall 2023'
  },
  semesterNumber: {
    type: Number,
    required: [true, 'Please provide semester number'],
    min: 1
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide semester start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide semester end date']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'planned'],
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

// Virtual for total credits
semesterSchema.virtual('totalCredits').get(function() {
  // This will be populated after courses are created
  return 0;
});

// Virtual for course count
semesterSchema.virtual('courseCount').get(function() {
  // This will be populated after courses are created
  return 0;
});

// Virtual for semester GPA
semesterSchema.virtual('semesterGPA').get(function() {
  // This will be calculated from courses
  return 0;
});

// Index for user's semesters
semesterSchema.index({ user: 1, semesterNumber: 1 });

module.exports = mongoose.model('Semester', semesterSchema);
