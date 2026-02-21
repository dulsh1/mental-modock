const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const express = require('express');

// Import models
const User = require('../models/User');
const MentalHealthLog = require('../models/MentalHealthLog');
const Journal = require('../models/Journal');
const Prediction = require('../models/Prediction');

// Import routes
const mentalHealthAdvancedRoutes = require('../routes/mentalHealthAdvanced.routes');
const { protect } = require('../middleware/auth');

let mongoServer;
let app;
let authToken;
let testUser;

// Setup test app
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test user
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });

  // Generate auth token
  authToken = jwt.sign(
    { id: testUser._id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1d' }
  );

  // Setup Express app
  app = express();
  app.use(express.json());
  
  // Mock auth middleware for testing
  app.use((req, res, next) => {
    req.user = testUser;
    next();
  });
  
  app.use('/api/mental-health/v2', mentalHealthAdvancedRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await MentalHealthLog.deleteMany({});
  await Journal.deleteMany({});
  await Prediction.deleteMany({});
});

describe('Mental Health API Endpoints', () => {
  describe('POST /api/mental-health/v2/mood', () => {
    it('should create a new mood entry', async () => {
      const moodData = {
        mood: 7,
        stress: 4,
        energy: 6,
        stressTriggers: ['work'],
        sleep: { hours: 7 }
      };

      const response = await request(app)
        .post('/api/mental-health/v2/mood')
        .send(moodData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mood.score).toBe(7);
      expect(response.body.data.stress.score).toBe(4);
      expect(response.body.data.energy.score).toBe(6);
    });

    it('should reject invalid mood score', async () => {
      const moodData = {
        mood: 15, // Invalid
        stress: 5,
        energy: 5
      };

      const response = await request(app)
        .post('/api/mental-health/v2/mood')
        .send(moodData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/mental-health/v2/mood/today', () => {
    it('should return today\'s mood entry if exists', async () => {
      // Create today's entry
      await MentalHealthLog.create({
        user: testUser._id,
        mood: { score: 7 },
        stress: { score: 4 },
        energy: { score: 6 },
        date: new Date()
      });

      const response = await request(app)
        .get('/api/mental-health/v2/mood/today')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasEntry).toBe(true);
      expect(response.body.data.mood.score).toBe(7);
    });

    it('should return hasEntry false if no entry today', async () => {
      const response = await request(app)
        .get('/api/mental-health/v2/mood/today')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasEntry).toBe(false);
    });
  });

  describe('GET /api/mental-health/v2/mood/history', () => {
    it('should return mood history', async () => {
      // Create some historical entries
      const entries = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        entries.push({
          user: testUser._id,
          mood: { score: 5 + (i % 3) },
          stress: { score: 4 + (i % 3) },
          energy: { score: 5 + (i % 3) },
          date
        });
      }
      await MentalHealthLog.create(entries);

      const response = await request(app)
        .get('/api/mental-health/v2/mood/history')
        .query({ days: 7 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(7);
    });
  });

  describe('POST /api/mental-health/v2/journal', () => {
    it('should create a journal entry with sentiment analysis', async () => {
      const journalData = {
        quickNote: 'Had a great day at work!',
        reflectionQuestion: 'What made you happy today?',
        reflectionResponse: 'Completed a big project successfully.'
      };

      const response = await request(app)
        .post('/api/mental-health/v2/journal')
        .send(journalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sentiment).toBeDefined();
      expect(response.body.data.sentiment.label).toBe('positive');
    });

    it('should flag concerning entries', async () => {
      const journalData = {
        quickNote: 'I feel hopeless and want to give up on everything.'
      };

      const response = await request(app)
        .post('/api/mental-health/v2/journal')
        .send(journalData)
        .expect(201);

      expect(response.body.data.flagged).toBe(true);
    });
  });

  describe('GET /api/mental-health/v2/journal/prompt', () => {
    it('should return a reflection prompt', async () => {
      const response = await request(app)
        .get('/api/mental-health/v2/journal/prompt')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prompt).toBeDefined();
      expect(typeof response.body.data.prompt).toBe('string');
    });
  });

  describe('GET /api/mental-health/v2/predictions', () => {
    it('should return predictions', async () => {
      // Create a prediction
      await Prediction.create({
        user: testUser._id,
        predictionType: 'stress',
        predictedValue: 7,
        confidence: 0.8,
        predictionHorizon: 24,
        riskLevel: 'moderate'
      });

      const response = await request(app)
        .get('/api/mental-health/v2/predictions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].predictedValue).toBe(7);
    });
  });

  describe('GET /api/mental-health/v2/predictions/alerts', () => {
    it('should return high-risk alerts', async () => {
      // Create predictions with different risk levels
      await Prediction.create([
        {
          user: testUser._id,
          predictionType: 'stress',
          predictedValue: 8,
          confidence: 0.85,
          riskLevel: 'high',
          status: 'pending'
        },
        {
          user: testUser._id,
          predictionType: 'stress',
          predictedValue: 3,
          confidence: 0.8,
          riskLevel: 'low',
          status: 'pending'
        }
      ]);

      const response = await request(app)
        .get('/api/mental-health/v2/predictions/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].riskLevel).toBe('high');
    });
  });

  describe('GET /api/mental-health/v2/calendar', () => {
    it('should return calendar data for a month', async () => {
      const now = new Date();
      
      // Create entries for current month
      for (let i = 1; i <= 5; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        await MentalHealthLog.create({
          user: testUser._id,
          mood: { score: 5 + i },
          stress: { score: 3 + i },
          energy: { score: 5 },
          date
        });
      }

      const response = await request(app)
        .get('/api/mental-health/v2/calendar')
        .query({ month: now.getMonth() + 1, year: now.getFullYear() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Object.keys(response.body.data).length).toBe(5);
    });
  });

  describe('GET /api/mental-health/v2/analytics', () => {
    it('should return analytics summary', async () => {
      // Create some data
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        await MentalHealthLog.create({
          user: testUser._id,
          mood: { score: 5 + (i % 3) },
          stress: { score: 4 + (i % 3) },
          energy: { score: 5 + (i % 3) },
          date
        });
      }

      const response = await request(app)
        .get('/api/mental-health/v2/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averages).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
    });
  });
});
