/**
 * Voice Check-in API Integration Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: new mongoose.Types.ObjectId() };
    next();
  }
}));

const express = require('express');
const voiceCheckinRoutes = require('../routes/voiceCheckin.routes');
const VoiceConversation = require('../models/VoiceConversation');

describe('Voice Check-in API', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api/checkin', voiceCheckinRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await VoiceConversation.deleteMany({});
  });

  describe('POST /api/checkin/voice', () => {
    it('should process a voice check-in successfully', async () => {
      const response = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'I had a great day today, feeling really happy and energetic!',
          inputMode: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('conversationId');
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('emotionalSummary');
      expect(response.body.data).toHaveProperty('detectedEmotions');
    });

    it('should return error for empty transcript', async () => {
      const response = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: '',
          inputMode: 'text'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should detect negative emotions correctly', async () => {
      const response = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'I feel really sad and lonely today. Everything seems hopeless.',
          inputMode: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.emotionalSummary).toBeDefined();
      expect(response.body.data.sentiment.label).toMatch(/negative/i);
    });

    it('should return crisis resources for high-risk messages', async () => {
      const response = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'I want to end it all, I cannot take this anymore',
          inputMode: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.riskLevel).toBe('crisis');
      expect(response.body.data.response).toContain('988');
    });

    it('should maintain session continuity', async () => {
      // First message
      const firstResponse = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'Hello, I want to talk about my day',
          inputMode: 'text'
        });

      expect(firstResponse.status).toBe(200);
      const sessionId = firstResponse.body.data.sessionId;

      // Second message with same session
      const secondResponse = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'It was a stressful day at work',
          sessionId: sessionId,
          inputMode: 'text'
        });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.data.sessionId).toBe(sessionId);
    });
  });

  describe('POST /api/checkin/save', () => {
    it('should save conversation and create mood entry', async () => {
      // First create a conversation
      const voiceResponse = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'I feel moderately happy today',
          inputMode: 'text'
        });

      const conversationId = voiceResponse.body.data.conversationId;

      // Then save it
      const saveResponse = await request(app)
        .post('/api/checkin/save')
        .send({
          conversationId,
          createMoodEntry: true
        });

      expect(saveResponse.status).toBe(200);
      expect(saveResponse.body.success).toBe(true);
      expect(saveResponse.body.data.saved).toBe(true);
    });

    it('should return error for non-existent conversation', async () => {
      const response = await request(app)
        .post('/api/checkin/save')
        .send({
          conversationId: new mongoose.Types.ObjectId(),
          createMoodEntry: true
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/checkin/history', () => {
    it('should return empty history for new user', async () => {
      const response = await request(app)
        .get('/api/checkin/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toHaveLength(0);
    });

    it('should return conversations with pagination', async () => {
      // Create some conversations
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/checkin/voice')
          .send({
            transcript: `Test message ${i}`,
            inputMode: 'text'
          });
      }

      const response = await request(app)
        .get('/api/checkin/history')
        .query({ limit: 2, page: 1 });

      expect(response.status).toBe(200);
      expect(response.body.data.conversations).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/checkin/prompts', () => {
    it('should return check-in prompts', async () => {
      const response = await request(app)
        .get('/api/checkin/prompts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prompt).toBeDefined();
      expect(response.body.data.allPrompts).toBeDefined();
      expect(Array.isArray(response.body.data.allPrompts)).toBe(true);
    });
  });

  describe('GET /api/checkin/trends', () => {
    it('should return emotional trends', async () => {
      // Create some conversations first
      await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'Feeling happy today',
          inputMode: 'text'
        });

      const response = await request(app)
        .get('/api/checkin/trends')
        .query({ days: 7 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dailyTrends');
      expect(response.body.data).toHaveProperty('emotionDistribution');
    });
  });

  describe('DELETE /api/checkin/:id', () => {
    it('should delete a conversation', async () => {
      // Create a conversation
      const createResponse = await request(app)
        .post('/api/checkin/voice')
        .send({
          transcript: 'Test message to delete',
          inputMode: 'text'
        });

      const conversationId = createResponse.body.data.conversationId;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/checkin/${conversationId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/checkin/${conversationId}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
