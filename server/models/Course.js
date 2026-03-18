const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Please provide semester reference']
  },
  courseCode: {
    type: String,
    required: [true, 'Please provide course code'],
    trim: true,
    maxlength: [20, 'Course code cannot exceed 20 characters'],
    example: 'CS101'
  },
  courseName: {
    type: String,
    required: [true, 'Please provide course name'],
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Please provide course credits'],
    min: [0.5, 'Credits must be at least 0.5'],
    max: [5, 'Credits cannot exceed 5']
  },
  letterGrade: {
    type: String,
    required: [true, 'Please provide letter grade'],
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
    uppercase: true
  },
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'planned'],
    default: 'completed'
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

// Static method to convert letter grades to numeric points
courseSchema.statics.gradeToNumeric = function(letterGrade) {
  const gradeMap = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'D-': 0.7,
    'F': 0.0
  };
  return gradeMap[letterGrade] || 0;
};

// Virtual for grade point
courseSchema.virtual('gradePoint').get(function() {
  return this.constructor.gradeToNumeric(this.letterGrade);
});

// Indexes
courseSchema.index({ user: 1, semester: 1 });
courseSchema.index({ semester: 1 });

module.exports = mongoose.model('Course', courseSchema);
