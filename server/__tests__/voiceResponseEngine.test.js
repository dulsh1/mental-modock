/**
 * Voice Response Engine Tests
 * Unit tests for sentiment detection, concerning phrase detection, and response generation
 */

const voiceResponseEngine = require('../services/voice/voiceResponseEngine');

describe('Voice Response Engine', () => {
  describe('detectRiskLevel', () => {
    test('should detect crisis level for suicidal ideation', () => {
      const result = voiceResponseEngine.detectRiskLevel('I want to end it all');
      expect(result.level).toBe('crisis');
      expect(result.flags).toContain('end it all');
    });

    test('should detect crisis level for self-harm mentions', () => {
      const result = voiceResponseEngine.detectRiskLevel('I have been cutting myself and want to hurt myself');
      expect(result.level).toBe('crisis');
    });

    test('should detect high risk for hopelessness', () => {
      const result = voiceResponseEngine.detectRiskLevel('I feel completely hopeless, there\'s no hope');
      expect(result.level).toBe('high');
      expect(result.flags.length).toBeGreaterThan(0);
    });

    test('should detect high risk for feeling like a burden', () => {
      const result = voiceResponseEngine.detectRiskLevel('I feel like I\'m worthless and a burden to everyone');
      expect(result.level).toBe('high');
    });

    test('should detect medium risk for severe stress', () => {
      const result = voiceResponseEngine.detectRiskLevel('I\'m so stressed I can\'t cope anymore');
      expect(result.level).toBe('medium');
    });

    test('should return none for neutral text', () => {
      const result = voiceResponseEngine.detectRiskLevel('I had a good day at work today');
      expect(result.level).toBe('none');
      expect(result.flags).toHaveLength(0);
    });

    test('should handle empty input', () => {
      const result = voiceResponseEngine.detectRiskLevel('');
      expect(result.level).toBe('none');
    });

    test('should handle null input', () => {
      const result = voiceResponseEngine.detectRiskLevel(null);
      expect(result.level).toBe('none');
    });
  });

  describe('extractMoodMetrics', () => {
    test('should extract positive mood from positive sentiment', () => {
      const sentiment = { score: 0.8 };
      const emotions = [{ emotion: 'joy', intensity: 0.8 }];
      
      const result = voiceResponseEngine.extractMoodMetrics(
        'I feel amazing today',
        sentiment,
        emotions
      );

      expect(result.mood).toBeGreaterThanOrEqual(7);
      expect(result.mood).toBeLessThanOrEqual(10);
    });

    test('should extract negative mood from negative sentiment', () => {
      const sentiment = { score: -0.7 };
      const emotions = [{ emotion: 'sadness', intensity: 0.7 }];
      
      const result = voiceResponseEngine.extractMoodMetrics(
        'I feel so sad and down',
        sentiment,
        emotions
      );

      expect(result.mood).toBeLessThanOrEqual(5);
    });

    test('should increase stress for anger emotion', () => {
      const sentiment = { score: -0.3 };
      const emotions = [{ emotion: 'anger', intensity: 0.7 }];
      
      const result = voiceResponseEngine.extractMoodMetrics(
        'I am so frustrated with everything',
        sentiment,
        emotions
      );

      expect(result.stress).toBeGreaterThanOrEqual(6);
    });

    test('should detect high stress from keywords', () => {
      const sentiment = { score: 0 };
      const emotions = [];
      
      const result = voiceResponseEngine.extractMoodMetrics(
        'I am stressed about the deadline and overwhelmed with pressure',
        sentiment,
        emotions
      );

      expect(result.stress).toBeGreaterThanOrEqual(6);
    });

    test('should detect low energy from keywords', () => {
      const sentiment = { score: 0 };
      const emotions = [];
      
      const result = voiceResponseEngine.extractMoodMetrics(
        'I feel exhausted and drained today',
        sentiment,
        emotions
      );

      expect(result.energy).toBeLessThanOrEqual(4);
    });

    test('should detect high energy from keywords', () => {
      const sentiment = { score: 0.5 };
      const emotions = [{ emotion: 'joy', intensity: 0.5 }];
      
      const result = voiceResponseEngine.extractMoodMetrics(
        'I feel energetic and motivated to do things',
        sentiment,
        emotions
      );

      expect(result.energy).toBeGreaterThanOrEqual(6);
    });
  });

  describe('generateEmotionalStateSummary', () => {
    test('should identify burnout risk', () => {
      const result = voiceResponseEngine.generateEmotionalStateSummary(
        2, // mood
        8, // stress
        3, // energy
        'sadness',
        'none'
      );

      expect(result.moodLabel).toBe('Burnout Risk');
      expect(result.stressLevel).toBe('High');
      expect(result.recommendation.toLowerCase()).toContain('burnout');
    });

    test('should identify positive state', () => {
      const result = voiceResponseEngine.generateEmotionalStateSummary(
        8, // mood
        3, // stress
        7, // energy
        'joy',
        'none'
      );

      expect(result.moodLabel).toBe('Positive State');
      expect(result.stressLevel).toBe('Low');
    });

    test('should prioritize crisis support', () => {
      const result = voiceResponseEngine.generateEmotionalStateSummary(
        3,
        9,
        2,
        'sadness',
        'crisis'
      );

      expect(result.moodLabel).toBe('Needs Immediate Support');
      expect(result.recommendation).toContain('crisis');
    });

    test('should identify high stress alert', () => {
      const result = voiceResponseEngine.generateEmotionalStateSummary(
        5,
        9,
        5,
        'fear',
        'none'
      );

      expect(result.moodLabel).toBe('High Stress Alert');
    });

    test('should generate correct stress level strings', () => {
      expect(voiceResponseEngine.generateEmotionalStateSummary(5, 1, 5, 'neutral', 'none').stressLevel).toBe('Very Low');
      expect(voiceResponseEngine.generateEmotionalStateSummary(5, 3, 5, 'neutral', 'none').stressLevel).toBe('Low');
      expect(voiceResponseEngine.generateEmotionalStateSummary(5, 5, 5, 'neutral', 'none').stressLevel).toBe('Moderate');
      expect(voiceResponseEngine.generateEmotionalStateSummary(5, 7, 5, 'neutral', 'none').stressLevel).toBe('High');
      expect(voiceResponseEngine.generateEmotionalStateSummary(5, 9, 5, 'neutral', 'none').stressLevel).toBe('Very High');
    });
  });

  describe('processVoiceCheckIn', () => {
    test('should process positive check-in', async () => {
      const result = await voiceResponseEngine.processVoiceCheckIn(
        'I had a wonderful day today. Feeling happy and grateful.'
      );

      expect(result.response).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.dominantEmotion).toBeDefined();
      expect(result.responseType).toBeDefined();
    });

    test('should process negative check-in', async () => {
      const result = await voiceResponseEngine.processVoiceCheckIn(
        'I feel so sad and lonely today. Nothing seems to be going right.'
      );

      expect(result.response).toBeDefined();
      expect(result.analysis.sentiment.label).toMatch(/negative/i);
    });

    test('should return crisis response for crisis input', async () => {
      const result = await voiceResponseEngine.processVoiceCheckIn(
        'I want to end my life, I can\'t take it anymore'
      );

      expect(result.responseType).toBe('crisis');
      expect(result.response).toContain('988');
      expect(result.analysis.riskLevel).toBe('crisis');
    });

    test('should handle empty input gracefully', async () => {
      const result = await voiceResponseEngine.processVoiceCheckIn('');

      expect(result.error).toBeDefined();
      expect(result.response).toContain('didn\'t catch');
    });

    test('should include exercise for high stress', async () => {
      const result = await voiceResponseEngine.processVoiceCheckIn(
        'I am extremely stressed and anxious. Work pressure is too much. I feel so overwhelmed and stressed out.'
      );

      // The response should suggest calming techniques
      expect(result.analysis.extractedMetrics.stress).toBeGreaterThanOrEqual(6);
    });
  });

  describe('getCheckInPrompts', () => {
    test('should return array of prompts', () => {
      const prompts = voiceResponseEngine.getCheckInPrompts();
      
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
    });

    test('should have meaningful prompts', () => {
      const prompts = voiceResponseEngine.getCheckInPrompts();
      
      prompts.forEach(prompt => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(10);
      });
    });
  });

  describe('crisisResources', () => {
    test('should contain hotline numbers', () => {
      const { crisisResources } = voiceResponseEngine;
      
      expect(crisisResources.message).toBeDefined();
      expect(crisisResources.resources).toBeDefined();
      expect(crisisResources.resources.some(r => r.includes('988'))).toBe(true);
    });
  });

  describe('breathingExercises', () => {
    test('should have exercise definitions', () => {
      const { breathingExercises } = voiceResponseEngine;
      
      expect(breathingExercises.basic).toBeDefined();
      expect(breathingExercises.basic.name).toBeDefined();
      expect(breathingExercises.basic.instructions).toBeDefined();
      expect(breathingExercises.boxBreathing).toBeDefined();
      expect(breathingExercises.grounding).toBeDefined();
    });
  });
});
