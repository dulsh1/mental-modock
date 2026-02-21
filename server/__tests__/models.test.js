const mongoose = require('mongoose');
const MentalHealthLog = require('../models/MentalHealthLog');
const Journal = require('../models/Journal');
const Prediction = require('../models/Prediction');

describe('Mental Health Models', () => {
  // Mock user ID
  const userId = new mongoose.Types.ObjectId();

  describe('MentalHealthLog Model', () => {
    it('should create a valid mood entry', async () => {
      const moodEntry = new MentalHealthLog({
        user: userId,
        mood: {
          score: 7,
          label: 'Good'
        },
        stress: {
          score: 4,
          triggers: ['work']
        },
        energy: {
          score: 6,
          label: 'Moderate'
        },
        sleep: {
          hours: 7,
          quality: 'Good'
        },
        activities: ['Exercise', 'Meditation'],
        notes: 'Good day overall'
      });

      const saved = await moodEntry.save();
      
      expect(saved._id).toBeDefined();
      expect(saved.mood.score).toBe(7);
      expect(saved.stress.score).toBe(4);
      expect(saved.energy.score).toBe(6);
      expect(saved.user.toString()).toBe(userId.toString());
    });

    it('should enforce mood score range 1-10', async () => {
      const moodEntry = new MentalHealthLog({
        user: userId,
        mood: { score: 15 }, // Invalid: above 10
        stress: { score: 5 },
        energy: { score: 5 }
      });

      await expect(moodEntry.save()).rejects.toThrow();
    });

    it('should enforce stress score range 1-10', async () => {
      const moodEntry = new MentalHealthLog({
        user: userId,
        mood: { score: 5 },
        stress: { score: 0 }, // Invalid: below 1
        energy: { score: 5 }
      });

      await expect(moodEntry.save()).rejects.toThrow();
    });

    it('should create entry with default date', async () => {
      const moodEntry = new MentalHealthLog({
        user: userId,
        mood: { score: 5 },
        stress: { score: 5 },
        energy: { score: 5 }
      });

      const saved = await moodEntry.save();
      expect(saved.date).toBeDefined();
      expect(saved.date instanceof Date).toBe(true);
    });

    it('should query by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await MentalHealthLog.create([
        { user: userId, mood: { score: 5 }, stress: { score: 5 }, energy: { score: 5 }, date: today },
        { user: userId, mood: { score: 6 }, stress: { score: 4 }, energy: { score: 6 }, date: yesterday }
      ]);

      const logs = await MentalHealthLog.find({
        user: userId,
        date: { $gte: yesterday, $lte: today }
      });

      expect(logs).toHaveLength(2);
    });
  });

  describe('Journal Model', () => {
    it('should create a valid journal entry', async () => {
      const journal = new Journal({
        user: userId,
        content: 'Today was a productive day. I completed all my tasks.',
        sentiment: {
          score: 0.7,
          label: 'positive',
          emotions: [{ emotion: 'joy', score: 0.8 }]
        },
        topics: ['productivity', 'work'],
        moodLog: new mongoose.Types.ObjectId()
      });

      const saved = await journal.save();
      
      expect(saved._id).toBeDefined();
      expect(saved.content).toBe('Today was a productive day. I completed all my tasks.');
      expect(saved.sentiment.score).toBe(0.7);
      expect(saved.sentiment.label).toBe('positive');
      expect(saved.topics).toContain('productivity');
    });

    it('should enforce content max length', async () => {
      const longContent = 'a'.repeat(5001); // Over 5000 char limit
      
      const journal = new Journal({
        user: userId,
        content: longContent
      });

      await expect(journal.save()).rejects.toThrow();
    });

    it('should flag concerning entries', async () => {
      const journal = new Journal({
        user: userId,
        content: 'Feeling very down today',
        sentiment: {
          score: -0.8,
          label: 'negative'
        },
        flagged: true,
        flagReason: 'High negativity detected'
      });

      const saved = await journal.save();
      
      expect(saved.flagged).toBe(true);
      expect(saved.flagReason).toBe('High negativity detected');
    });

    it('should query journals by date', async () => {
      const today = new Date();
      
      await Journal.create({
        user: userId,
        content: 'Test entry',
        date: today
      });

      const journals = await Journal.find({
        user: userId,
        date: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      });

      expect(journals.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Prediction Model', () => {
    it('should create a valid prediction', async () => {
      const prediction = new Prediction({
        user: userId,
        predictionType: 'stress',
        predictedValue: 7,
        confidence: 0.85,
        predictionHorizon: 24,
        factors: [
          { factor: 'Sleep quality', impact: -0.3, description: 'Poor sleep increases stress' },
          { factor: 'Workload', impact: 0.5, description: 'Heavy workload expected' }
        ],
        recommendations: [
          'Take regular breaks',
          'Practice deep breathing'
        ],
        riskLevel: 'moderate'
      });

      const saved = await prediction.save();
      
      expect(saved._id).toBeDefined();
      expect(saved.predictionType).toBe('stress');
      expect(saved.predictedValue).toBe(7);
      expect(saved.confidence).toBe(0.85);
      expect(saved.factors).toHaveLength(2);
      expect(saved.recommendations).toHaveLength(2);
    });

    it('should enforce prediction type enum', async () => {
      const prediction = new Prediction({
        user: userId,
        predictionType: 'invalid_type', // Not in enum
        predictedValue: 5,
        confidence: 0.7
      });

      await expect(prediction.save()).rejects.toThrow();
    });

    it('should enforce confidence range 0-1', async () => {
      const prediction = new Prediction({
        user: userId,
        predictionType: 'stress',
        predictedValue: 5,
        confidence: 1.5 // Invalid: above 1
      });

      await expect(prediction.save()).rejects.toThrow();
    });

    it('should track prediction accuracy', async () => {
      const prediction = new Prediction({
        user: userId,
        predictionType: 'mood',
        predictedValue: 7,
        confidence: 0.8,
        status: 'validated',
        actualValue: 6,
        accuracy: 0.86 // 1 - |7-6|/10
      });

      const saved = await prediction.save();
      
      expect(saved.status).toBe('validated');
      expect(saved.actualValue).toBe(6);
      expect(saved.accuracy).toBe(0.86);
    });

    it('should query pending predictions', async () => {
      await Prediction.create([
        { user: userId, predictionType: 'stress', predictedValue: 5, confidence: 0.7, status: 'pending' },
        { user: userId, predictionType: 'mood', predictedValue: 6, confidence: 0.8, status: 'acknowledged' }
      ]);

      const pending = await Prediction.find({ user: userId, status: 'pending' });
      
      expect(pending).toHaveLength(1);
      expect(pending[0].predictionType).toBe('stress');
    });
  });
});
