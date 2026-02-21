/**
 * Voice Check-in Routes
 * API endpoints for voice-based mental health check-ins
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const voiceCheckinController = require('../controllers/voiceCheckin.controller');
const { protect } = require('../middleware/auth');

// Rate limiter for voice endpoint (more restrictive)
const voiceRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many voice requests. Please wait a moment before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for general endpoints
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});

// Apply authentication to all routes
router.use(protect);

/**
 * @route   POST /api/checkin/voice
 * @desc    Process voice check-in transcript
 * @access  Private
 * @body    { transcript: string, sessionId?: string, inputMode?: 'voice' | 'text' }
 */
router.post('/voice', voiceRateLimiter, voiceCheckinController.processVoiceCheckIn);

/**
 * @route   POST /api/checkin/save
 * @desc    Save conversation and optionally create mood entry
 * @access  Private
 * @body    { conversationId: string, createMoodEntry?: boolean }
 */
router.post('/save', generalRateLimiter, voiceCheckinController.saveConversation);

/**
 * @route   GET /api/checkin/history
 * @desc    Get user's conversation history
 * @access  Private
 * @query   { limit?: number, page?: number }
 */
router.get('/history', generalRateLimiter, voiceCheckinController.getHistory);

/**
 * @route   GET /api/checkin/trends
 * @desc    Get emotional trends from conversations
 * @access  Private
 * @query   { days?: number }
 */
router.get('/trends', generalRateLimiter, voiceCheckinController.getTrends);

/**
 * @route   GET /api/checkin/prompts
 * @desc    Get check-in prompts
 * @access  Private
 */
router.get('/prompts', generalRateLimiter, voiceCheckinController.getPrompts);

/**
 * @route   GET /api/checkin/:id
 * @desc    Get single conversation with full messages
 * @access  Private
 */
router.get('/:id', generalRateLimiter, voiceCheckinController.getConversation);

/**
 * @route   DELETE /api/checkin/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/:id', generalRateLimiter, voiceCheckinController.deleteConversation);

module.exports = router;
