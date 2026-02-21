/**
 * Voice Response Engine
 * Generates intelligent, empathetic responses for mental health voice check-ins
 */

const sentimentAnalysis = require('../ml/sentimentAnalysis');

// Crisis keywords and patterns
const crisisPatterns = [
  { pattern: /\b(want to die|kill myself|end it all|end my life|suicide)\b/gi, severity: 'crisis' },
  { pattern: /\b(self.?harm|hurt myself|cut myself|cutting)\b/gi, severity: 'crisis' },
  { pattern: /\b(no reason to live|better off dead|life is pointless)\b/gi, severity: 'crisis' }
];

const highRiskPatterns = [
  { pattern: /\b(can't go on|can't take it anymore|given up|giving up)\b/gi, severity: 'high' },
  { pattern: /\b(nobody cares|all alone|no one understands|completely alone)\b/gi, severity: 'high' },
  { pattern: /\b(worthless|useless|burden to everyone|hate myself)\b/gi, severity: 'high' },
  { pattern: /\b(hopeless|no hope|never get better|always be this way)\b/gi, severity: 'high' }
];

const mediumRiskPatterns = [
  { pattern: /\b(so stressed|overwhelmed|can't cope|falling apart)\b/gi, severity: 'medium' },
  { pattern: /\b(exhausted|burned out|breaking down)\b/gi, severity: 'medium' },
  { pattern: /\b(panic attack|anxiety attack|can't breathe)\b/gi, severity: 'medium' }
];

// Emotion-specific responses
const emotionResponses = {
  sadness: {
    empathy: [
      "I hear that you're going through a difficult time, and your feelings are completely valid.",
      "It takes courage to share what you're feeling. I'm here to listen.",
      "Sadness can feel heavy, but you don't have to carry it alone.",
      "Thank you for trusting me with how you're feeling right now."
    ],
    questions: [
      "Would you like to tell me more about what's been weighing on you?",
      "What do you think has been contributing to these feelings lately?",
      "Is there something specific that triggered these feelings today?",
      "How long have you been feeling this way?"
    ],
    suggestions: [
      "Sometimes it helps to take things one moment at a time. Would you like me to guide you through a gentle breathing exercise?",
      "It might feel good to do something small and kind for yourself right now. What's one thing that usually brings you comfort?",
      "Talking about our feelings can be a form of release. I'm here whenever you need to express yourself."
    ]
  },
  anger: {
    empathy: [
      "It sounds like you're feeling frustrated, and that's a completely natural response.",
      "Anger often signals that something important to us has been threatened. Your feelings make sense.",
      "I can hear the intensity in what you're sharing. Those feelings are valid."
    ],
    questions: [
      "What do you think is at the root of these feelings?",
      "Has something happened recently that's been particularly frustrating?",
      "Sometimes anger masks other emotions. Is there anything else you might be feeling underneath?"
    ],
    suggestions: [
      "When we're feeling angry, it can help to release some of that physical tension. Would you like to try a quick grounding exercise?",
      "Sometimes writing down what's bothering us can help organize our thoughts. Would that be helpful?",
      "Taking a few deep breaths can help calm our nervous system. Want to try that together?"
    ]
  },
  fear: {
    empathy: [
      "Feeling anxious or scared can be really overwhelming. You're not alone in this.",
      "It's okay to feel afraid. Those feelings are your mind trying to protect you.",
      "Anxiety can feel all-consuming, but this feeling will pass."
    ],
    questions: [
      "Can you tell me more about what's worrying you right now?",
      "Is there a specific situation that's causing you to feel this way?",
      "How is this anxiety affecting your day-to-day life?"
    ],
    suggestions: [
      "Grounding techniques can help when anxiety feels overwhelming. Would you like me to guide you through one?",
      "Sometimes naming our fears helps reduce their power. What specifically feels most threatening right now?",
      "Focusing on what we can control often helps with anxiety. What's one small thing you can do right now?"
    ]
  },
  joy: {
    empathy: [
      "It's wonderful to hear that you're feeling positive! Your happiness matters.",
      "I'm so glad to hear things are going well for you.",
      "It's great that you're recognizing and celebrating the good moments!"
    ],
    questions: [
      "What's been contributing to your positive mood?",
      "Is there something specific you'd like to celebrate or reflect on?",
      "How can you hold onto this feeling and nurture it?"
    ],
    suggestions: [
      "This might be a great time to write down what's going well. Gratitude journaling can help sustain positive feelings.",
      "Consider sharing your happiness with someone you care about - joy often grows when shared!",
      "Take a moment to really savor this feeling. It's an important part of mental wellness."
    ]
  },
  neutral: {
    empathy: [
      "Thank you for checking in today. How you feel matters, no matter what.",
      "It's completely okay to feel neutral or uncertain about your emotions.",
      "I'm here to listen and support you in whatever you're experiencing."
    ],
    questions: [
      "How has your day been so far?",
      "Is there anything on your mind that you'd like to talk about?",
      "How have you been sleeping and taking care of yourself lately?"
    ],
    suggestions: [
      "Regular check-ins like this are great for your mental health. Would you like to set a daily reminder?",
      "Even when things feel 'okay', it can help to do something nurturing. What sounds appealing right now?",
      "Is there anything I can help you with or explore together today?"
    ]
  }
};

// Stress-related responses
const stressResponses = {
  veryHigh: [
    "I can sense that you're dealing with a lot of stress right now. That must be really challenging.",
    "High stress levels can be overwhelming. Let's work together to find some relief.",
    "Your body and mind are telling you they need some care. Let's see what might help."
  ],
  high: [
    "It sounds like stress has been building up. It's important to address that.",
    "I hear that things have been stressful. Let's explore some ways to ease that pressure.",
    "Stress is a signal that something needs attention. What do you think that might be?"
  ],
  moderate: [
    "Some stress is normal, but it's good to check in on it. How are you managing?",
    "It sounds like you're handling things, but let's make sure stress doesn't build up too much."
  ]
};

// Energy-related responses
const energyResponses = {
  veryLow: [
    "I notice your energy seems quite low. That can make everything feel harder.",
    "Low energy can affect so many parts of our lives. Let's be gentle with yourself.",
    "When energy is low, even small tasks can feel monumental. That's completely valid."
  ],
  low: [
    "It sounds like you might be running on empty. How has your rest been?",
    "Low energy often tells us we need more self-care. What might help recharge you?"
  ]
};

// Breathing exercises
const breathingExercises = {
  basic: {
    name: "4-7-8 Breathing",
    instructions: "Let's try a calming breathing exercise. Breathe in slowly for 4 counts, hold for 7 counts, and exhale for 8 counts. This activates your parasympathetic nervous system and helps reduce stress."
  },
  boxBreathing: {
    name: "Box Breathing",
    instructions: "Try box breathing: Inhale for 4 counts, hold for 4 counts, exhale for 4 counts, hold for 4 counts. Repeat this cycle 4 times. This technique is used by Navy SEALs to stay calm under pressure."
  },
  grounding: {
    name: "5-4-3-2-1 Grounding",
    instructions: "Let's ground you in the present. Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This brings you back to the present moment."
  }
};

// Crisis resources
const crisisResources = {
  message: "I'm really concerned about what you're sharing, and I want you to know that you matter. Please reach out to someone who can provide immediate support.",
  resources: [
    "National Suicide Prevention Lifeline: 988 (call or text)",
    "Crisis Text Line: Text HOME to 741741",
    "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
    "If you're in immediate danger, please call emergency services (911 in the US)"
  ],
  followUp: "You don't have to face this alone. Would you like me to help you think about reaching out to someone you trust?"
};

/**
 * Detect risk level from text
 */
function detectRiskLevel(text) {
  if (!text) return { level: 'none', flags: [] };
  
  const flags = [];
  let maxSeverity = 'none';
  const severityOrder = { none: 0, low: 1, medium: 2, high: 3, crisis: 4 };
  
  // Check crisis patterns first
  for (const { pattern, severity } of crisisPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      flags.push(...matches.map(m => m.toLowerCase()));
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }
  
  // Check high risk patterns
  for (const { pattern, severity } of highRiskPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      flags.push(...matches.map(m => m.toLowerCase()));
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }
  
  // Check medium risk patterns
  for (const { pattern, severity } of mediumRiskPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      flags.push(...matches.map(m => m.toLowerCase()));
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }
  
  return { 
    level: maxSeverity, 
    flags: [...new Set(flags)] // Remove duplicates
  };
}

/**
 * Extract mood metrics from text
 */
function extractMoodMetrics(text, sentiment, emotions) {
  let mood = 5;
  let stress = 5;
  let energy = 5;
  
  // Base on sentiment score (-1 to 1)
  if (sentiment.score !== undefined) {
    // Map -1 to 1 → 1 to 10
    mood = Math.round((sentiment.score + 1) * 4.5 + 1);
  }
  
  // Adjust based on dominant emotion
  const dominantEmotion = emotions[0]?.emotion;
  if (dominantEmotion === 'joy') {
    mood = Math.min(10, mood + 2);
    energy = Math.min(10, energy + 1);
  } else if (dominantEmotion === 'sadness') {
    mood = Math.max(1, mood - 1);
    energy = Math.max(1, energy - 2);
  } else if (dominantEmotion === 'anger') {
    stress = Math.min(10, stress + 2);
  } else if (dominantEmotion === 'fear') {
    stress = Math.min(10, stress + 2);
    mood = Math.max(1, mood - 1);
  }
  
  // Check for stress/energy keywords
  const lowerText = text.toLowerCase();
  
  // Stress indicators
  if (/stressed|overwhelming|pressure|deadline|anxious/i.test(lowerText)) {
    stress = Math.min(10, stress + 2);
  }
  if (/relaxed|calm|peaceful|serene/i.test(lowerText)) {
    stress = Math.max(1, stress - 2);
  }
  
  // Energy indicators
  if (/tired|exhausted|drained|fatigued|sleepy/i.test(lowerText)) {
    energy = Math.max(1, energy - 2);
  }
  if (/energetic|excited|motivated|pumped|active/i.test(lowerText)) {
    energy = Math.min(10, energy + 2);
  }
  
  return { mood, stress, energy };
}

/**
 * Generate emotional state summary
 */
function generateEmotionalStateSummary(mood, stress, energy, dominantEmotion, riskLevel) {
  let moodLabel = 'Stable';
  let stressLevel = 'Moderate';
  let recommendation = '';
  
  // Determine mood label
  if (riskLevel === 'crisis' || riskLevel === 'high') {
    moodLabel = 'Needs Immediate Support';
  } else if (mood <= 3 && stress >= 7) {
    moodLabel = 'Burnout Risk';
  } else if (mood <= 3) {
    moodLabel = 'Low Mood';
  } else if (stress >= 8) {
    moodLabel = 'High Stress Alert';
  } else if (energy <= 3) {
    moodLabel = 'Energy Depleted';
  } else if (mood >= 7 && stress <= 4) {
    moodLabel = 'Positive State';
  } else if (mood >= 5) {
    moodLabel = 'Balanced';
  }
  
  // Determine stress level string
  if (stress <= 2) stressLevel = 'Very Low';
  else if (stress <= 4) stressLevel = 'Low';
  else if (stress <= 6) stressLevel = 'Moderate';
  else if (stress <= 8) stressLevel = 'High';
  else stressLevel = 'Very High';
  
  // Generate recommendation
  if (riskLevel === 'crisis') {
    recommendation = 'Please reach out to a crisis helpline or mental health professional immediately. You are not alone.';
  } else if (riskLevel === 'high') {
    recommendation = 'Consider speaking with a mental health professional or trusted person. Your wellbeing is important.';
  } else if (moodLabel === 'Burnout Risk') {
    recommendation = 'Consider reducing workload and prioritizing rest. Burnout requires intentional recovery time.';
  } else if (stress >= 7 && energy <= 4) {
    recommendation = 'Your body is showing signs of strain. Try a breathing exercise and ensure you get proper rest tonight.';
  } else if (stress >= 7) {
    recommendation = 'High stress detected. Consider taking short breaks throughout the day and trying relaxation techniques.';
  } else if (energy <= 3) {
    recommendation = 'Low energy levels. Focus on getting quality sleep and consider light physical activity.';
  } else if (mood <= 4) {
    recommendation = 'Low mood detected. Try connecting with a friend or engaging in an activity you enjoy.';
  } else if (mood >= 7) {
    recommendation = 'Great state! Consider journaling about what is going well to reinforce positive patterns.';
  } else {
    recommendation = 'Maintain your current routine. Regular check-ins help track your mental wellness.';
  }
  
  return {
    moodLabel,
    dominantEmotion: dominantEmotion || 'neutral',
    stressLevel,
    recommendation
  };
}

/**
 * Select appropriate response based on analysis
 */
function selectResponse(emotion, sentiment, riskLevel, stress, energy) {
  const responses = [];
  
  // Crisis response takes priority
  if (riskLevel === 'crisis') {
    return {
      type: 'crisis',
      response: buildCrisisResponse()
    };
  }
  
  // High risk - supportive with resources
  if (riskLevel === 'high') {
    return {
      type: 'supportive',
      response: buildHighRiskResponse(emotion)
    };
  }
  
  // Get emotion-specific responses
  const emotionKey = emotion || 'neutral';
  const emotionData = emotionResponses[emotionKey] || emotionResponses.neutral;
  
  // Add empathy statement
  responses.push(randomChoice(emotionData.empathy));
  
  // Handle high stress
  if (stress >= 7) {
    if (stress >= 9) {
      responses.push(randomChoice(stressResponses.veryHigh));
    } else {
      responses.push(randomChoice(stressResponses.high));
    }
    // Suggest breathing exercise for high stress
    responses.push(breathingExercises.basic.instructions);
    return {
      type: 'exercise',
      response: responses.join(' '),
      exercise: breathingExercises.basic
    };
  }
  
  // Handle low energy
  if (energy <= 3) {
    responses.push(randomChoice(energyResponses.veryLow));
  } else if (energy <= 5) {
    responses.push(randomChoice(energyResponses.low));
  }
  
  // Add a question or suggestion
  if (sentiment.score < 0) {
    responses.push(randomChoice(emotionData.questions));
  } else {
    responses.push(randomChoice(emotionData.suggestions));
  }
  
  return {
    type: emotionKey === 'joy' ? 'general' : 'supportive',
    response: responses.join(' ')
  };
}

/**
 * Build crisis response
 */
function buildCrisisResponse() {
  return `${crisisResources.message}\n\n${crisisResources.resources.join('\n')}\n\n${crisisResources.followUp}`;
}

/**
 * Build high risk response
 */
function buildHighRiskResponse(emotion) {
  const emotionData = emotionResponses[emotion] || emotionResponses.sadness;
  
  return `${randomChoice(emotionData.empathy)} I want you to know that what you're feeling is important, and you deserve support. ${randomChoice(emotionData.suggestions)} If these feelings persist or intensify, please consider reaching out to a mental health professional or a trusted person in your life. You don't have to go through this alone.`;
}

/**
 * Generate contextual follow-up
 */
function generateFollowUp(emotion, mood, stress, topics) {
  const followUps = [];
  
  if (topics && topics.length > 0) {
    const topTopic = topics[0].topic;
    followUps.push(`I noticed you mentioned ${topTopic}. Would you like to explore that more?`);
  }
  
  if (mood <= 4 && stress >= 6) {
    followUps.push("Would you like me to guide you through a quick relaxation exercise?");
  }
  
  if (emotion === 'sadness' || emotion === 'fear') {
    followUps.push("Is there something specific that would help you feel better right now?");
  }
  
  return followUps.length > 0 ? randomChoice(followUps) : null;
}

/**
 * Utility: Random choice from array
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Main function: Process voice check-in
 */
async function processVoiceCheckIn(transcript, conversationHistory = []) {
  if (!transcript || typeof transcript !== 'string') {
    return {
      response: "I didn't catch that. Could you please try again?",
      analysis: null,
      error: 'Invalid transcript'
    };
  }
  
  // Analyze sentiment and emotions
  const sentimentResult = sentimentAnalysis.analyzeSentiment(transcript);
  const emotions = sentimentAnalysis.detectEmotions(transcript);
  const topics = sentimentAnalysis.extractTopics(transcript);
  
  // Detect risk level
  const riskAssessment = detectRiskLevel(transcript);
  
  // Extract mood metrics
  const metrics = extractMoodMetrics(transcript, sentimentResult, emotions);
  
  // Get dominant emotion
  const dominantEmotion = emotions.length > 0 ? emotions[0].emotion : 'neutral';
  
  // Generate emotional state summary
  const stateSummary = generateEmotionalStateSummary(
    metrics.mood,
    metrics.stress,
    metrics.energy,
    dominantEmotion,
    riskAssessment.level
  );
  
  // Select and build response
  const responseData = selectResponse(
    dominantEmotion,
    sentimentResult,
    riskAssessment.level,
    metrics.stress,
    metrics.energy
  );
  
  // Add follow-up if appropriate
  const followUp = generateFollowUp(dominantEmotion, metrics.mood, metrics.stress, topics);
  let fullResponse = responseData.response;
  if (followUp && riskAssessment.level !== 'crisis') {
    fullResponse += ` ${followUp}`;
  }
  
  return {
    response: fullResponse,
    responseType: responseData.type,
    analysis: {
      sentiment: sentimentResult,
      emotions,
      dominantEmotion,
      topics,
      riskLevel: riskAssessment.level,
      riskFlags: riskAssessment.flags,
      extractedMetrics: metrics,
      emotionalStateSummary: stateSummary
    },
    exercise: responseData.exercise || null
  };
}

/**
 * Generate check-in prompts
 */
function getCheckInPrompts() {
  return [
    "How are you feeling right now?",
    "What's on your mind today?",
    "How has your day been so far?",
    "Is there anything weighing on you that you'd like to talk about?",
    "What emotions have you been experiencing lately?",
    "How would you describe your energy level today?",
    "Have you been taking care of yourself?",
    "What's been the highlight of your day?",
    "Is there anything causing you stress right now?",
    "How did you sleep last night?"
  ];
}

module.exports = {
  processVoiceCheckIn,
  detectRiskLevel,
  extractMoodMetrics,
  generateEmotionalStateSummary,
  getCheckInPrompts,
  crisisResources,
  breathingExercises
};
