const mongoose = require('mongoose');

const stressPredictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  predictionDate: {
    type: Date,
    required: true
  },
  predictedStressLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  factors: {
    taskLoad: {
      count: Number,
      urgentCount: Number,
      score: Number
    },
    historicalPattern: {
      dayOfWeek: Number,
      averageForDay: Number,
      score: Number
    },
    recentTrend: {
      direction: { type: String, enum: ['increasing', 'decreasing', 'stable'] },
      slope: Number,
      score: Number
    },
    sleepPattern: {
      recentAverage: Number,
      score: Number
    },
    upcomingDeadlines: {
      count: Number,
      score: Number
    }
  },
  recommendation: {
    type: String,
    maxlength: 500
  },
  wasAccurate: {
    type: Boolean
  },
  actualStressLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  alertSentAt: Date
}, {
  timestamps: true
});

// Indexes
stressPredictionSchema.index({ user: 1, predictionDate: -1 });
stressPredictionSchema.index({ user: 1, alertSent: 1 });

// Static method to get recent predictions
stressPredictionSchema.statics.getRecentPredictions = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    user: userId,
    predictionDate: { $gte: startDate }
  }).sort({ predictionDate: -1 });
};

// Static method to calculate prediction accuracy
stressPredictionSchema.statics.calculateAccuracy = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        wasAccurate: { $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        accurate: { $sum: { $cond: ['$wasAccurate', 1, 0] } }
      }
    }
  ]);

  if (result.length === 0) return null;
  return {
    total: result[0].total,
    accurate: result[0].accurate,
    accuracy: (result[0].accurate / result[0].total) * 100
  };
};

module.exports = mongoose.model('StressPrediction', stressPredictionSchema);
