const mongoose = require('mongoose');

const wellnessInterventionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['breathing', 'meditation', 'exercise', 'break', 'pomodoro', 'journaling', 'social', 'hydration', 'stretching']
  },
  trigger: {
    condition: {
      type: String,
      enum: ['high_stress', 'low_energy', 'long_work_session', 'scheduled', 'manual', 'low_mood']
    },
    thresholdValue: Number,
    detectedAt: Date
  },
  exercise: {
    name: String,
    description: String,
    duration: Number, // in seconds
    instructions: [String],
    mediaUrl: String,
    mediaType: { type: String, enum: ['audio', 'video', 'image'] }
  },
  status: {
    type: String,
    enum: ['suggested', 'in_progress', 'completed', 'skipped', 'dismissed'],
    default: 'suggested'
  },
  suggestedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  duration: Number, // actual duration in seconds
  feedback: {
    helpful: Boolean,
    rating: { type: Number, min: 1, max: 5 },
    notes: String
  },
  moodBefore: {
    type: Number,
    min: 1,
    max: 10
  },
  moodAfter: {
    type: Number,
    min: 1,
    max: 10
  }
}, {
  timestamps: true
});

// Indexes
wellnessInterventionSchema.index({ user: 1, status: 1 });
wellnessInterventionSchema.index({ user: 1, suggestedAt: -1 });
wellnessInterventionSchema.index({ user: 1, type: 1 });

// Static method to get intervention effectiveness
wellnessInterventionSchema.statics.getEffectiveness = async function(userId, type = null) {
  const match = {
    user: new mongoose.Types.ObjectId(userId),
    status: 'completed',
    moodBefore: { $ne: null },
    moodAfter: { $ne: null }
  };

  if (type) {
    match.type = type;
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgMoodImprovement: { $avg: { $subtract: ['$moodAfter', '$moodBefore'] } },
        avgRating: { $avg: '$feedback.rating' }
      }
    },
    { $sort: { avgMoodImprovement: -1 } }
  ]);

  return result;
};

// Static method to get suggested intervention based on user state
wellnessInterventionSchema.statics.getSuggestion = async function(userId, currentState) {
  // Get most effective interventions for this user
  const effectiveness = await this.getEffectiveness(userId);
  
  // Default suggestions based on state
  const suggestions = {
    high_stress: ['breathing', 'meditation', 'stretching'],
    low_energy: ['exercise', 'stretching', 'hydration'],
    low_mood: ['journaling', 'social', 'meditation'],
    long_work_session: ['break', 'pomodoro', 'stretching']
  };

  return {
    condition: currentState,
    suggested: suggestions[currentState] || ['break'],
    effectiveness
  };
};

module.exports = mongoose.model('WellnessIntervention', wellnessInterventionSchema);
