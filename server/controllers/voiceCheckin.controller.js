/**
 * Voice Check-in Controller
 * Handles voice-based mental health check-ins
 */

const VoiceConversation = require('../models/VoiceConversation');
const MentalHealthLog = require('../models/MentalHealthLog');
const voiceResponseEngine = require('../services/voice/voiceResponseEngine');

/**
 * Process voice check-in
 * POST /api/checkin/voice
 */
exports.processVoiceCheckIn = async (req, res) => {
  try {
    const { transcript, sessionId, inputMode = 'voice' } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Transcript text is required'
      });
    }

    // Sanitize input
    const sanitizedTranscript = transcript
      .trim()
      .slice(0, 5000) // Limit length
      .replace(/<[^>]*>/g, ''); // Remove HTML tags

    if (sanitizedTranscript.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Transcript is too short'
      });
    }

    // Get existing session for context if provided
    let conversationHistory = [];
    if (sessionId) {
      const existingSession = await VoiceConversation.findOne({
        user: userId,
        sessionId
      }).sort({ createdAt: -1 });
      
      if (existingSession) {
        conversationHistory = existingSession.messages || [];
      }
    }

    // Process through voice response engine
    const result = await voiceResponseEngine.processVoiceCheckIn(
      sanitizedTranscript,
      conversationHistory
    );

    // Prepare messages array
    const messages = [
      ...conversationHistory,
      { role: 'user', content: sanitizedTranscript, timestamp: new Date() },
      { role: 'assistant', content: result.response, timestamp: new Date() }
    ];

    // Create conversation record
    const conversation = new VoiceConversation({
      user: userId,
      sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transcript: sanitizedTranscript,
      aiResponse: result.response,
      messages,
      detectedEmotions: result.analysis?.emotions || [],
      dominantEmotion: result.analysis?.dominantEmotion || 'neutral',
      sentiment: result.analysis?.sentiment || { score: 0, label: 'neutral' },
      riskLevel: result.analysis?.riskLevel || 'none',
      riskFlags: result.analysis?.riskFlags || [],
      extractedMood: result.analysis?.extractedMetrics?.mood,
      extractedStress: result.analysis?.extractedMetrics?.stress,
      extractedEnergy: result.analysis?.extractedMetrics?.energy,
      topics: result.analysis?.topics || [],
      emotionalStateSummary: result.analysis?.emotionalStateSummary,
      responseType: result.responseType || 'general',
      inputMode
    });

    await conversation.save();

    // Return response
    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        sessionId: conversation.sessionId,
        response: result.response,
        responseType: result.responseType,
        emotionalSummary: result.analysis?.emotionalStateSummary,
        detectedEmotions: result.analysis?.emotions?.map(e => ({
          emotion: e.emotion,
          intensity: Math.round(e.intensity * 100)
        })),
        dominantEmotion: result.analysis?.dominantEmotion,
        sentiment: {
          label: result.analysis?.sentiment?.label,
          score: Math.round((result.analysis?.sentiment?.score || 0) * 100)
        },
        riskLevel: result.analysis?.riskLevel,
        extractedMetrics: result.analysis?.extractedMetrics,
        exercise: result.exercise,
        topics: result.analysis?.topics?.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Voice check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing voice check-in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Save conversation and create mood entry
 * POST /api/checkin/save
 */
exports.saveConversation = async (req, res) => {
  try {
    const { conversationId, createMoodEntry = true } = req.body;
    const userId = req.user._id;

    // Find conversation
    const conversation = await VoiceConversation.findOne({
      _id: conversationId,
      user: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    let moodEntry = null;

    // Create mood entry if requested
    if (createMoodEntry && conversation.extractedMood) {
      // Determine mood label
      const getMoodLabel = (score) => {
        if (score <= 2) return 'very_low';
        if (score <= 4) return 'low';
        if (score <= 6) return 'neutral';
        if (score <= 8) return 'good';
        return 'excellent';
      };

      // Determine energy label
      const getEnergyLabel = (score) => {
        if (score <= 2) return 'exhausted';
        if (score <= 4) return 'tired';
        if (score <= 6) return 'moderate';
        if (score <= 8) return 'energetic';
        return 'very_energetic';
      };

      // Determine stress label
      const getStressLabel = (score) => {
        if (score <= 2) return 'very_low';
        if (score <= 4) return 'low';
        if (score <= 6) return 'moderate';
        if (score <= 8) return 'high';
        return 'very_high';
      };

      // Extract triggers from topics
      const validTriggers = ['work', 'relationships', 'health', 'finances', 'academic', 'family', 'other'];
      const triggers = conversation.topics
        .map(t => t.topic)
        .filter(t => validTriggers.includes(t));

      moodEntry = new MentalHealthLog({
        user: userId,
        date: conversation.createdAt,
        mood: {
          score: conversation.extractedMood,
          label: getMoodLabel(conversation.extractedMood)
        },
        energy: {
          score: conversation.extractedEnergy || 5,
          label: getEnergyLabel(conversation.extractedEnergy || 5)
        },
        stress: {
          score: conversation.extractedStress || 5,
          label: getStressLabel(conversation.extractedStress || 5),
          triggers: triggers.length > 0 ? triggers : undefined
        },
        journal: {
          content: conversation.transcript
        }
      });

      await moodEntry.save();

      // Link mood entry to conversation
      conversation.linkedMoodEntry = moodEntry._id;
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        moodEntryId: moodEntry?._id,
        emotionalStateSummary: conversation.emotionalStateSummary,
        saved: true
      }
    });

  } catch (error) {
    console.error('Save conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get conversation history
 * GET /api/checkin/history
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await VoiceConversation.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-messages');

    const total = await VoiceConversation.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation history'
    });
  }
};

/**
 * Get single conversation with full messages
 * GET /api/checkin/:id
 */
exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await VoiceConversation.findOne({
      _id: id,
      user: userId
    }).populate('linkedMoodEntry');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation'
    });
  }
};

/**
 * Get emotional trends from voice conversations
 * GET /api/checkin/trends
 */
exports.getTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7 } = req.query;

    const trends = await VoiceConversation.getEmotionalTrends(userId, parseInt(days));

    // Get emotion distribution
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const emotionDistribution = await VoiceConversation.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$dominantEmotion',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyTrends: trends,
        emotionDistribution,
        period: `Last ${days} days`
      }
    });

  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emotional trends'
    });
  }
};

/**
 * Get check-in prompts
 * GET /api/checkin/prompts
 */
exports.getPrompts = async (req, res) => {
  try {
    const prompts = voiceResponseEngine.getCheckInPrompts();
    
    // Get random prompt
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    res.status(200).json({
      success: true,
      data: {
        prompt: randomPrompt,
        allPrompts: prompts
      }
    });

  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prompts'
    });
  }
};

/**
 * Delete conversation
 * DELETE /api/checkin/:id
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await VoiceConversation.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation'
    });
  }
};
