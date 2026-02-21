const mongoose = require('mongoose');

const stressPredictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Prediction target date
  targetDate: {
    type: Date,
    required: true
  },
  // When prediction was made
  predictionMadeAt: {
    type: Date,
    default: Date.now
  },
  // Prediction horizon (hours ahead)
  horizon: {
    type: Number,
    required: true,
    enum: [24, 48, 72]
  },
  // Predicted values
  predictions: {
    stress: {
      predicted: {
        type: Number,
        min: 1,
        max: 10
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      lowerBound: Number,
      upperBound: Number
    },
    mood: {
      predicted: {
        type: Number,
        min: 1,
        max: 10
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      lowerBound: Number,
      upperBound: Number
    },
    energy: {
      predicted: {
        type: Number,
        min: 1,
        max: 10
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      lowerBound: Number,
      upperBound: Number
    }
  },
  // Risk level assessment
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'low'
  },
  // Contributing factors identified
  contributingFactors: [{
    factor: {
      type: String,
      enum: [
        'day_of_week', 'workload', 'sleep_pattern', 'weather',
        'social_isolation', 'exercise_deficit', 'deadline_approaching',
        'recurring_pattern', 'journal_sentiment', 'activity_level'
      ]
    },
    impact: {
      type: Number,
      min: -1,
      max: 1
    },
    description: String
  }],
  // Pattern-based insights
  patterns: [{
    pattern: String,
    frequency: Number,
    lastOccurred: Date,
    correlation: Number
  }],
  // Model metadata
  modelInfo: {
    algorithm: {
      type: String,
      enum: ['arima', 'prophet', 'lstm', 'ensemble', 'rule_based'],
      default: 'ensemble'
    },
    version: String,
    trainingDataPoints: Number,
    modelAccuracy: Number
  },
  // Actual values (filled in after target date passes)
  actuals: {
    stress: Number,
    mood: Number,
    energy: Number,
    recordedAt: Date
  },
  // Prediction accuracy metrics
  accuracy: {
    stressError: Number,
    moodError: Number,
    energyError: Number,
    overallAccuracy: Number
  },
  // Recommendations based on prediction
  recommendations: [{
    type: {
      type: String,
      enum: ['activity', 'rest', 'social', 'exercise', 'mindfulness', 'professional_help']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    description: String,
    actionable: Boolean
  }],
  // Alert status
  alertSent: {
    type: Boolean,
    default: false
  },
  alertSentAt: Date,
  // User acknowledgment
  userAcknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: Date
}, {
  timestamps: true
});

// Indexes
stressPredictionSchema.index({ user: 1, targetDate: -1 });
stressPredictionSchema.index({ user: 1, riskLevel: 1 });
stressPredictionSchema.index({ targetDate: 1, alertSent: 1 });

// Static methods
stressPredictionSchema.statics.getPredictionsForUser = function(userId, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return this.find({
    user: userId,
    targetDate: { $gte: startDate, $lte: endDate }
  }).sort({ targetDate: 1 });
};

stressPredictionSchema.statics.getHighRiskPredictions = function(userId) {
  return this.find({
    user: userId,
    riskLevel: { $in: ['high', 'critical'] },
    targetDate: { $gte: new Date() }
  }).sort({ targetDate: 1 });
};

stressPredictionSchema.statics.calculateModelAccuracy = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        targetDate: { $gte: startDate, $lte: new Date() },
        'actuals.stress': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgStressError: { $avg: '$accuracy.stressError' },
        avgMoodError: { $avg: '$accuracy.moodError' },
        avgEnergyError: { $avg: '$accuracy.energyError' },
        avgOverallAccuracy: { $avg: '$accuracy.overallAccuracy' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { avgOverallAccuracy: 0, count: 0 };
};

module.exports = mongoose.model('Prediction', stressPredictionSchema);
