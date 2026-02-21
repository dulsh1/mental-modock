const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const voiceConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  transcript: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  // Emotional Analysis
  detectedEmotions: [{
    emotion: {
      type: String,
      enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation', 'neutral']
    },
    intensity: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  dominantEmotion: {
    type: String,
    enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation', 'neutral']
  },
  // Sentiment
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1
    },
    label: {
      type: String,
      enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']
    }
  },
  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'crisis'],
    default: 'none'
  },
  riskFlags: [{
    type: String
  }],
  // Extracted Metrics
  extractedMood: {
    type: Number,
    min: 1,
    max: 10
  },
  extractedStress: {
    type: Number,
    min: 1,
    max: 10
  },
  extractedEnergy: {
    type: Number,
    min: 1,
    max: 10
  },
  // Topics discussed
  topics: [{
    topic: String,
    relevance: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  // State Summary
  emotionalStateSummary: {
    moodLabel: String,
    dominantEmotion: String,
    stressLevel: {
      type: String,
      enum: ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
    },
    recommendation: String
  },
  // Response metadata
  responseType: {
    type: String,
    enum: ['general', 'supportive', 'crisis', 'reflective', 'exercise', 'resource'],
    default: 'general'
  },
  // Voice interaction metadata
  inputMode: {
    type: String,
    enum: ['voice', 'text'],
    default: 'voice'
  },
  audioMetadata: {
    duration: Number,
    sampleRate: Number,
    language: {
      type: String,
      default: 'en-US'
    }
  },
  // Linked mood entry if created
  linkedMoodEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentalHealthLog'
  }
}, {
  timestamps: true
});

// Indexes
voiceConversationSchema.index({ user: 1, createdAt: -1 });
voiceConversationSchema.index({ user: 1, sessionId: 1 });
voiceConversationSchema.index({ riskLevel: 1 });
voiceConversationSchema.index({ dominantEmotion: 1 });

// Virtual for conversation duration
voiceConversationSchema.virtual('messageDuration').get(function() {
  if (this.messages.length < 2) return 0;
  const first = this.messages[0].timestamp;
  const last = this.messages[this.messages.length - 1].timestamp;
  return Math.round((last - first) / 1000); // seconds
});

// Static method to get user's recent conversations
voiceConversationSchema.statics.getRecentByUser = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-messages');
};

// Static method to get emotional trends
voiceConversationSchema.statics.getEmotionalTrends = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        avgMood: { $avg: '$extractedMood' },
        avgStress: { $avg: '$extractedStress' },
        avgEnergy: { $avg: '$extractedEnergy' },
        dominantEmotions: { $push: '$dominantEmotion' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Pre-save hook to ensure session ID
voiceConversationSchema.pre('save', function(next) {
  if (!this.sessionId) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

const VoiceConversation = mongoose.model('VoiceConversation', voiceConversationSchema);

module.exports = VoiceConversation;
