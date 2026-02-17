const mongoose = require('mongoose');

const mentalHealthLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    score: {
      type: Number,
      required: [true, 'Please provide mood score'],
      min: 1,
      max: 10
    },
    label: {
      type: String,
      enum: ['very_low', 'low', 'neutral', 'good', 'excellent'],
      required: true
    }
  },
  energy: {
    score: {
      type: Number,
      required: [true, 'Please provide energy score'],
      min: 1,
      max: 10
    },
    label: {
      type: String,
      enum: ['exhausted', 'tired', 'moderate', 'energetic', 'very_energetic']
    }
  },
  stress: {
    score: {
      type: Number,
      required: [true, 'Please provide stress score'],
      min: 1,
      max: 10
    },
    label: {
      type: String,
      enum: ['very_low', 'low', 'moderate', 'high', 'very_high']
    },
    triggers: [{
      type: String,
      enum: ['work', 'relationships', 'health', 'finances', 'academic', 'family', 'other']
    }]
  },
  sleep: {
    hours: {
      type: Number,
      min: 0,
      max: 24
    },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    }
  },
  journal: {
    content: {
      type: String,
      maxlength: [5000, 'Journal entry cannot exceed 5000 characters']
    },
    gratitude: [{
      type: String,
      maxlength: 200
    }],
    highlights: [{
      type: String,
      maxlength: 200
    }],
    challenges: [{
      type: String,
      maxlength: 200
    }]
  },
  activities: [{
    type: {
      type: String,
      enum: ['exercise', 'meditation', 'social', 'hobby', 'work', 'rest', 'other']
    },
    duration: Number, // in minutes
    notes: String
  }],
  weather: {
    condition: String,
    temperature: Number
  },
  tags: [{
    type: String,
    maxlength: 30
  }]
}, {
  timestamps: true
});

// Compound index for efficient queries
mentalHealthLogSchema.index({ user: 1, date: -1 });
mentalHealthLogSchema.index({ user: 1, 'stress.score': 1 });

// Static method to get logs for a date range
mentalHealthLogSchema.statics.getLogsInRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

// Static method to calculate averages
mentalHealthLogSchema.statics.calculateAverages = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        avgMood: { $avg: '$mood.score' },
        avgEnergy: { $avg: '$energy.score' },
        avgStress: { $avg: '$stress.score' },
        avgSleep: { $avg: '$sleep.hours' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { avgMood: 0, avgEnergy: 0, avgStress: 0, avgSleep: 0, count: 0 };
};

module.exports = mongoose.model('MentalHealthLog', mentalHealthLogSchema);
