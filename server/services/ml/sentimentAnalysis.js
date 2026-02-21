/**
 * Sentiment Analysis Service
 * Analyzes journal entries for emotional content, topics, and concerning patterns
 */

// Sentiment word lists (simplified - in production, use a proper NLP library)
const positiveWords = new Set([
  'happy', 'joy', 'love', 'wonderful', 'amazing', 'great', 'excellent', 'fantastic',
  'beautiful', 'grateful', 'thankful', 'blessed', 'excited', 'peaceful', 'calm',
  'hopeful', 'optimistic', 'confident', 'proud', 'accomplished', 'satisfied',
  'content', 'relaxed', 'energetic', 'motivated', 'inspired', 'creative',
  'successful', 'healthy', 'strong', 'positive', 'good', 'better', 'best',
  'smile', 'laugh', 'fun', 'enjoy', 'appreciate', 'cherish', 'delight'
]);

const negativeWords = new Set([
  'sad', 'angry', 'frustrated', 'anxious', 'worried', 'stressed', 'depressed',
  'hopeless', 'worthless', 'tired', 'exhausted', 'overwhelmed', 'lonely',
  'isolated', 'scared', 'afraid', 'nervous', 'upset', 'hurt', 'pain',
  'failure', 'failed', 'terrible', 'horrible', 'awful', 'worst', 'bad',
  'hate', 'disgusted', 'disappointed', 'regret', 'guilty', 'ashamed',
  'helpless', 'useless', 'empty', 'numb', 'broken', 'lost', 'confused'
]);

const concerningPatterns = [
  { pattern: /\b(want to die|kill myself|end it all|no point|give up)\b/gi, severity: 'high' },
  { pattern: /\b(self.?harm|hurt myself|cut myself)\b/gi, severity: 'high' },
  { pattern: /\b(nobody cares|all alone|no one understands)\b/gi, severity: 'medium' },
  { pattern: /\b(can't go on|can't take it|too much)\b/gi, severity: 'medium' },
  { pattern: /\b(worthless|useless|burden)\b/gi, severity: 'medium' },
  { pattern: /\b(hopeless|no hope|never get better)\b/gi, severity: 'medium' }
];

const emotionKeywords = {
  joy: ['happy', 'joy', 'excited', 'delighted', 'thrilled', 'elated', 'cheerful'],
  sadness: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'heartbroken', 'grief'],
  anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'frustrated', 'rage'],
  fear: ['afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous', 'panic'],
  surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'unexpected'],
  disgust: ['disgusted', 'revolted', 'sick', 'repulsed', 'appalled'],
  trust: ['trust', 'believe', 'faith', 'confident', 'secure', 'reliable'],
  anticipation: ['excited', 'eager', 'looking forward', 'hopeful', 'expecting']
};

const topicCategories = {
  work: ['work', 'job', 'boss', 'colleague', 'office', 'meeting', 'project', 'deadline', 'career'],
  relationships: ['friend', 'family', 'partner', 'relationship', 'love', 'dating', 'marriage', 'breakup'],
  health: ['health', 'sick', 'doctor', 'exercise', 'sleep', 'tired', 'pain', 'anxiety', 'depression'],
  finances: ['money', 'bills', 'debt', 'salary', 'expenses', 'budget', 'financial', 'pay'],
  education: ['school', 'study', 'exam', 'class', 'teacher', 'homework', 'grade', 'university'],
  personal_growth: ['goal', 'improve', 'learn', 'grow', 'achieve', 'progress', 'success', 'challenge'],
  leisure: ['hobby', 'fun', 'relax', 'vacation', 'travel', 'movie', 'game', 'music', 'read']
};

/**
 * Analyze sentiment of text
 */
function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
      emotions: []
    };
  }

  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
      emotions: []
    };
  }

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.has(word)) positiveCount++;
    if (negativeWords.has(word)) negativeCount++;
  });

  // Calculate sentiment score (-1 to 1)
  const sentimentScore = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
  
  // Calculate confidence based on sentiment word density
  const sentimentWordDensity = (positiveCount + negativeCount) / totalWords;
  const confidence = Math.min(sentimentWordDensity * 5, 1); // Scale up, cap at 1

  // Determine label
  let label;
  if (sentimentScore <= -0.5) label = 'very_negative';
  else if (sentimentScore <= -0.1) label = 'negative';
  else if (sentimentScore >= 0.5) label = 'very_positive';
  else if (sentimentScore >= 0.1) label = 'positive';
  else label = 'neutral';

  // Detect emotions
  const emotions = detectEmotions(text);

  return {
    score: Math.round(sentimentScore * 100) / 100,
    label,
    confidence: Math.round(confidence * 100) / 100,
    emotions
  };
}

/**
 * Detect emotions in text
 */
function detectEmotions(text) {
  const lowerText = text.toLowerCase();
  const emotions = [];

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    let matchCount = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) matchCount += matches.length;
    });

    if (matchCount > 0) {
      const intensity = Math.min(matchCount / 5, 1); // Scale intensity
      emotions.push({
        emotion,
        intensity: Math.round(intensity * 100) / 100
      });
    }
  }

  // Sort by intensity
  return emotions.sort((a, b) => b.intensity - a.intensity).slice(0, 5);
}

/**
 * Extract topics from text
 */
function extractTopics(text) {
  const lowerText = text.toLowerCase();
  const topics = [];

  for (const [topic, keywords] of Object.entries(topicCategories)) {
    let relevance = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) relevance += matches.length;
    });

    if (relevance > 0) {
      topics.push({
        topic,
        relevance: Math.min(relevance / 10, 1) // Normalize
      });
    }
  }

  return topics.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  if (!text) return [];

  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const stopWords = new Set([
    'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they',
    'their', 'what', 'when', 'where', 'which', 'while', 'about',
    'would', 'could', 'should', 'there', 'these', 'those', 'being',
    'just', 'also', 'very', 'much', 'some', 'more', 'than', 'then'
  ]);

  // Count word frequencies
  const wordFreq = {};
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Convert to array and sort
  const keywords = Object.entries(wordFreq)
    .map(([word, frequency]) => {
      let sentiment = 'neutral';
      if (positiveWords.has(word)) sentiment = 'positive';
      else if (negativeWords.has(word)) sentiment = 'negative';
      return { word, frequency, sentiment };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 15);

  return keywords;
}

/**
 * Check for concerning patterns
 */
function checkConcerningPatterns(text) {
  if (!text) return { highNegativity: false, concerningPatterns: [], needsReview: false };

  const detected = [];
  let needsReview = false;

  concerningPatterns.forEach(({ pattern, severity }) => {
    const matches = text.match(pattern);
    if (matches) {
      detected.push({
        pattern: matches[0],
        severity,
        detected: new Date()
      });
      if (severity === 'high') needsReview = true;
    }
  });

  // Check overall negativity
  const sentiment = analyzeSentiment(text);
  const highNegativity = sentiment.score < -0.3 || sentiment.label === 'very_negative';

  if (highNegativity && detected.length > 0) {
    needsReview = true;
  }

  return {
    highNegativity,
    concerningPatterns: detected,
    needsReview
  };
}

/**
 * Full journal analysis
 */
function analyzeJournal(content) {
  const sentiment = analyzeSentiment(content);
  const topics = extractTopics(content);
  const keywords = extractKeywords(content);
  const flags = checkConcerningPatterns(content);

  return {
    sentiment,
    topics,
    keywords,
    flags
  };
}

/**
 * Get daily reflection prompts
 */
function getReflectionPrompt() {
  const prompts = [
    "What made you smile today?",
    "What's one thing you're grateful for right now?",
    "What challenged you today and how did you handle it?",
    "What would make tomorrow a great day?",
    "What's something you learned about yourself today?",
    "Who made a positive impact on your day?",
    "What's one small win you had today?",
    "How did you take care of yourself today?",
    "What's weighing on your mind right now?",
    "What are you looking forward to?",
    "What would you tell your past self about today?",
    "What emotion was most present for you today?",
    "What's one thing you could have done differently today?",
    "What are you proud of accomplishing recently?",
    "How are your relationships feeling right now?"
  ];

  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Generate insights from journal analysis
 */
function generateInsights(analysisHistory) {
  if (!analysisHistory || analysisHistory.length === 0) {
    return [];
  }

  const insights = [];

  // Calculate averages
  const avgSentiment = analysisHistory.reduce((sum, a) => sum + (a.sentiment?.score || 0), 0) / analysisHistory.length;
  
  // Sentiment trend insight
  if (avgSentiment > 0.3) {
    insights.push({
      type: 'positive_trend',
      message: 'Your journal entries have been predominantly positive lately. Keep nurturing this positive mindset!',
      priority: 'low'
    });
  } else if (avgSentiment < -0.3) {
    insights.push({
      type: 'negative_trend',
      message: 'Your recent entries show some challenging emotions. Consider talking to someone or trying our wellness exercises.',
      priority: 'high'
    });
  }

  // Topic frequency insight
  const topicCounts = {};
  analysisHistory.forEach(a => {
    (a.topics || []).forEach(t => {
      topicCounts[t.topic] = (topicCounts[t.topic] || 0) + 1;
    });
  });

  const dominantTopic = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (dominantTopic) {
    insights.push({
      type: 'dominant_topic',
      message: `"${dominantTopic[0]}" appears frequently in your journals. This seems to be an important area of focus for you.`,
      priority: 'medium'
    });
  }

  // Emotion pattern insight
  const emotionCounts = {};
  analysisHistory.forEach(a => {
    (a.sentiment?.emotions || []).forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + e.intensity;
    });
  });

  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (dominantEmotion) {
    insights.push({
      type: 'emotion_pattern',
      message: `You've been experiencing a lot of ${dominantEmotion[0]} recently. Take a moment to reflect on what might be driving this.`,
      priority: 'medium'
    });
  }

  return insights;
}

module.exports = {
  analyzeSentiment,
  detectEmotions,
  extractTopics,
  extractKeywords,
  checkConcerningPatterns,
  analyzeJournal,
  getReflectionPrompt,
  generateInsights
};
