import React, { useState } from 'react';
import Card from '../common/Card';

const meditationSessions = [
  {
    id: 'morning',
    title: 'Morning Mindfulness',
    duration: 5,
    description: 'Start your day with clarity and intention',
    icon: '🌅',
    category: 'focus',
    audioUrl: null, // Would be actual audio URL
  },
  {
    id: 'stress-relief',
    title: 'Stress Relief',
    duration: 10,
    description: 'Release tension and find calm',
    icon: '🧘',
    category: 'relaxation',
    audioUrl: null,
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    duration: 15,
    description: 'Full body relaxation and awareness',
    icon: '✨',
    category: 'relaxation',
    audioUrl: null,
  },
  {
    id: 'focus',
    title: 'Deep Focus',
    duration: 10,
    description: 'Enhance concentration before important tasks',
    icon: '🎯',
    category: 'focus',
    audioUrl: null,
  },
  {
    id: 'gratitude',
    title: 'Gratitude Practice',
    duration: 5,
    description: 'Cultivate appreciation and positivity',
    icon: '🙏',
    category: 'emotional',
    audioUrl: null,
  },
  {
    id: 'sleep',
    title: 'Sleep Preparation',
    duration: 20,
    description: 'Prepare your mind and body for rest',
    icon: '🌙',
    category: 'sleep',
    audioUrl: null,
  },
];

const categories = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
  { id: 'emotional', label: 'Emotional', icon: '❤️' },
  { id: 'sleep', label: 'Sleep', icon: '🌙' },
];

const GuidedMeditation = ({ onStart, onComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMeditation, setActiveMeditation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const filteredSessions = selectedCategory === 'all'
    ? meditationSessions
    : meditationSessions.filter(s => s.category === selectedCategory);

  const startMeditation = (meditation) => {
    setActiveMeditation(meditation);
    setIsPlaying(true);
    setProgress(0);
    if (onStart) onStart(meditation);

    // Simulate progress (in real app, this would sync with audio)
    const totalSeconds = meditation.duration * 60;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          if (onComplete) onComplete(meditation);
          return 100;
        }
        return prev + (100 / totalSeconds);
      });
    }, 1000);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const exitMeditation = () => {
    setActiveMeditation(null);
    setIsPlaying(false);
    setProgress(0);
  };

  // Active meditation view
  if (activeMeditation) {
    return (
      <Card className="p-6">
        <div className="text-center">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={exitMeditation}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Meditation icon with animation */}
          <div className={`text-8xl mb-6 ${isPlaying ? 'animate-pulse' : ''}`}>
            {activeMeditation.icon}
          </div>

          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {activeMeditation.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {activeMeditation.description}
          </p>

          {/* Progress ring */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="url(#meditationGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 72}
                strokeDashoffset={2 * Math.PI * 72 * (1 - progress / 100)}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="meditationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">
                {Math.round(activeMeditation.duration - (activeMeditation.duration * progress / 100))}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 block">
                min left
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setProgress(Math.max(0, progress - 10))}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setProgress(Math.min(100, progress + 10))}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>
          </div>

          {/* Meditation tips */}
          <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400">
              💜 Find a comfortable position, close your eyes, and focus on your breath.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Session selection view
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Guided Meditation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a session to begin
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              flex items-center gap-1 px-3 py-2 rounded-full whitespace-nowrap transition-all
              ${selectedCategory === cat.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Sessions grid */}
      <div className="grid gap-3">
        {filteredSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => startMeditation(session)}
            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <span className="text-4xl">{session.icon}</span>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-white">
                {session.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session.description}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 
                               text-primary-600 dark:text-primary-400 text-sm font-medium">
                {session.duration} min
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Benefits info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">
          Benefits of Meditation
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>✓ Reduces stress and anxiety</li>
          <li>✓ Improves focus and concentration</li>
          <li>✓ Enhances emotional well-being</li>
          <li>✓ Promotes better sleep</li>
        </ul>
      </div>
    </Card>
  );
};

export default GuidedMeditation;
