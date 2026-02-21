const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: [true, 'Journal content is required'],
    maxlength: [5000, 'Journal entry cannot exceed 5000 characters']
  },
  quickNote: {
    type: String,
    maxlength: [200, 'Quick note cannot exceed 200 characters']
  },
  reflectionPrompt: {
    question: String,
    response: {
      type: String,
      maxlength: 1000
    }
  },
  // Sentiment Analysis Results
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1
    },
    label: {
      type: String,
      enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    emotions: [{
      emotion: {
        type: String,
        enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation']
      },
      intensity: {
        type: Number,
        min: 0,
        max: 1
      }
    }]
  },
  // Topic Extraction
  topics: [{
    topic: String,
    relevance: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  // Keywords extracted
  keywords: [{
    word: String,
    frequency: Number,
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    }
  }],
  // Flags for concerning content
  flags: {
    highNegativity: {
      type: Boolean,
      default: false
    },
    concerningPatterns: [{
      pattern: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      detected: Date
    }],
    needsReview: {
      type: Boolean,
      default: false
    }
  },
  // Linked mood entry
  linkedMoodEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentalHealthLog'
  },
  // Tags
  tags: [{
    type: String,
    maxlength: 30
  }],
  // Private/Encrypted flag
  isPrivate: {
    type: Boolean,
    default: true
  },
  // Word count for analytics
  wordCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
journalSchema.index({ user: 1, date: -1 });
journalSchema.index({ user: 1, 'sentiment.label': 1 });
journalSchema.index({ user: 1, 'flags.highNegativity': 1 });
journalSchema.index({ 'topics.topic': 'text', content: 'text' });

// Pre-save middleware to calculate word count
journalSchema.pre('save', function(next) {
  if (this.content) {
    this.wordCount = this.content.trim().split(/\s+/).length;
  }
  next();
});

// Static methods
journalSchema.statics.getJournalsInRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

journalSchema.statics.getFlaggedJournals = function(userId) {
  return this.find({
    user: userId,
    'flags.needsReview': true
  }).sort({ date: -1 });
};

journalSchema.statics.getSentimentTrend = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate },
        'sentiment.score': { $exists: true }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        avgSentiment: { $avg: '$sentiment.score' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

journalSchema.statics.getTopTopics = async function(userId, limit = 10) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$topics' },
    {
      $group: {
        _id: '$topics.topic',
        avgRelevance: { $avg: '$topics.relevance' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Journal', journalSchema);
