const sentimentService = require('../services/ml/sentimentAnalysis');
const { arimaPrediction, identifyPatterns } = require('../services/ml/stressPrediction');

describe('Sentiment Analysis Service', () => {
  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const text = 'I had a wonderful day! Everything went great and I feel amazing.';
      const result = sentimentService.analyzeSentiment(text);
      
      expect(result.score).toBeGreaterThan(0);
      expect(['positive', 'very_positive']).toContain(result.label);
    });

    it('should detect negative sentiment', () => {
      const text = 'Today was terrible. I feel awful and everything went wrong.';
      const result = sentimentService.analyzeSentiment(text);
      
      expect(result.score).toBeLessThan(0);
      expect(['negative', 'very_negative']).toContain(result.label);
    });

    it('should detect neutral sentiment', () => {
      const text = 'Went to the store. Came back home.';
      const result = sentimentService.analyzeSentiment(text);
      
      expect(result.label).toBe('neutral');
    });

    it('should return emotions array', () => {
      const text = 'I am so happy and grateful today!';
      const result = sentimentService.analyzeSentiment(text);
      
      expect(result.emotions).toBeDefined();
      expect(Array.isArray(result.emotions)).toBe(true);
    });
  });

  describe('extractTopics', () => {
    it('should extract work-related topics', () => {
      const text = 'Had a long meeting at the office today. Project deadline is approaching.';
      const topics = sentimentService.extractTopics(text);
      
      expect(topics.some(t => t.topic === 'work')).toBe(true);
    });

    it('should extract health-related topics', () => {
      const text = 'Went to the gym today. Did some cardio and exercise.';
      const topics = sentimentService.extractTopics(text);
      
      expect(topics.some(t => t.topic === 'health')).toBe(true);
    });

    it('should extract relationship topics', () => {
      const text = 'Had dinner with family. Spent quality time with friends.';
      const topics = sentimentService.extractTopics(text);
      
      expect(topics.some(t => ['relationships', 'leisure'].includes(t.topic))).toBe(true);
    });

    it('should return array for any text', () => {
      const text = 'The weather was cloudy.';
      const topics = sentimentService.extractTopics(text);
      
      expect(Array.isArray(topics)).toBe(true);
    });
  });

  describe('checkConcerningPatterns', () => {
    it('should detect concerning patterns', () => {
      const text = 'I feel hopeless and want to give up.';
      
      const result = sentimentService.checkConcerningPatterns(text);
      
      expect(result.hasConcerningPatterns).toBe(true);
      expect(result.patterns.length).toBeGreaterThan(0);
    });

    it('should not flag normal entries', () => {
      const text = 'Had a great day!';
      
      const result = sentimentService.checkConcerningPatterns(text);
      
      expect(result.hasConcerningPatterns).toBe(false);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from journal analysis history', () => {
      const analysisHistory = [
        { sentiment: { score: -0.5 }, topics: [{ topic: 'work' }] },
        { sentiment: { score: -0.4 }, topics: [{ topic: 'work' }] },
        { sentiment: { score: 0.7 }, topics: [{ topic: 'relationships' }] }
      ];
      
      const insights = sentimentService.generateInsights(analysisHistory);
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });
  });
});

describe('Stress Prediction Service', () => {
  describe('arimaPrediction', () => {
    it('should generate prediction from historical data', () => {
      const historicalData = [5, 6, 5, 7, 6, 5, 6, 5, 7, 6];
      
      const prediction = arimaPrediction(historicalData, 1);
      
      expect(prediction).toBeDefined();
      expect(prediction.predicted).toBeGreaterThanOrEqual(1);
      expect(prediction.predicted).toBeLessThanOrEqual(10);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should return lower confidence with insufficient data', () => {
      const historicalData = [5];
      
      const prediction = arimaPrediction(historicalData, 1);
      
      expect(prediction.confidence).toBeLessThan(0.5);
    });

    it('should handle empty data', () => {
      const prediction = arimaPrediction([], 1);
      
      expect(prediction.predicted).toBeDefined();
      expect(prediction.method).toBe('average');
    });
  });

  describe('identifyPatterns', () => {
    it('should return patterns array', async () => {
      const logs = [
        { date: new Date(Date.now() - 6*24*60*60*1000), stress: { score: 5 } },
        { date: new Date(Date.now() - 5*24*60*60*1000), stress: { score: 6 } },
        { date: new Date(Date.now() - 4*24*60*60*1000), stress: { score: 7 } },
        { date: new Date(Date.now() - 3*24*60*60*1000), stress: { score: 5 } },
        { date: new Date(Date.now() - 2*24*60*60*1000), stress: { score: 6 } },
        { date: new Date(Date.now() - 1*24*60*60*1000), stress: { score: 7 } },
        { date: new Date(), stress: { score: 5 } }
      ];
      
      const patterns = await identifyPatterns(logs);
      
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});
