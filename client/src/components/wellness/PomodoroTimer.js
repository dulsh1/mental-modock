import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../common/Card';

const TIMER_MODES = {
  WORK: { name: 'Focus', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
  SHORT_BREAK: { name: 'Short Break', duration: 5 * 60, color: 'from-green-500 to-teal-500' },
  LONG_BREAK: { name: 'Long Break', duration: 15 * 60, color: 'from-blue-500 to-purple-500' },
};

const PomodoroTimer = ({ onSessionComplete }) => {
  const [mode, setMode] = useState('WORK');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.WORK.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const audioRef = useRef(null);

  const currentMode = TIMER_MODES[mode];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentMode.duration - timeLeft) / currentMode.duration) * 100;

  const playNotification = useCallback(() => {
    // Play a gentle notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: mode === 'WORK' ? 'Great work! Time for a break.' : 'Break is over. Ready to focus?',
        icon: '🍅',
      });
    }
  }, [mode]);

  const handleTimerComplete = useCallback(() => {
    playNotification();
    
    if (mode === 'WORK') {
      setCompletedSessions(prev => prev + 1);
      setTotalFocusTime(prev => prev + TIMER_MODES.WORK.duration);
      
      // After 4 work sessions, take a long break
      if ((completedSessions + 1) % 4 === 0) {
        setMode('LONG_BREAK');
        setTimeLeft(TIMER_MODES.LONG_BREAK.duration);
      } else {
        setMode('SHORT_BREAK');
        setTimeLeft(TIMER_MODES.SHORT_BREAK.duration);
      }
      
      if (onSessionComplete) {
        onSessionComplete({ type: 'work', duration: TIMER_MODES.WORK.duration });
      }
    } else {
      setMode('WORK');
      setTimeLeft(TIMER_MODES.WORK.duration);
    }
    
    setIsRunning(false);
  }, [mode, completedSessions, playNotification, onSessionComplete]);

  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(currentMode.duration);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_MODES[newMode].duration);
    setIsRunning(false);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Card className="p-6">
      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" type="audio/wav" />
      </audio>

      {/* Header with session info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Pomodoro Timer
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stay focused, take breaks
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-500">🍅 {completedSessions}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sessions today
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-6">
        {Object.entries(TIMER_MODES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`
              flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all
              ${mode === key 
                ? `bg-gradient-to-r ${value.color} text-white shadow-md` 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }
            `}
          >
            {value.name}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Progress ring */}
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={mode === 'WORK' ? '#ef4444' : mode === 'SHORT_BREAK' ? '#22c55e' : '#3b82f6'} />
              <stop offset="100%" stopColor={mode === 'WORK' ? '#f97316' : mode === 'SHORT_BREAK' ? '#14b8a6' : '#a855f7'} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Time display */}
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-bold text-gray-800 dark:text-white font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className={`text-sm font-medium bg-gradient-to-r ${currentMode.color} bg-clip-text text-transparent`}>
            {currentMode.name}
          </span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Reset"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <button
          onClick={toggleTimer}
          className={`
            p-4 rounded-full shadow-lg transition-all transform hover:scale-105
            bg-gradient-to-r ${currentMode.color} text-white
          `}
        >
          {isRunning ? (
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
          onClick={() => switchMode(mode === 'WORK' ? 'SHORT_BREAK' : 'WORK')}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Skip"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {Math.floor(totalFocusTime / 60)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Minutes focused today
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {completedSessions * 25}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Productivity score
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <p className="text-xs text-primary-600 dark:text-primary-400 flex items-start gap-2">
          <span>💡</span>
          <span>
            {mode === 'WORK' 
              ? "Focus on one task. Avoid distractions. You've got this!"
              : "Step away from your screen. Stretch, hydrate, or take a short walk."
            }
          </span>
        </p>
      </div>
    </Card>
  );
};

export default PomodoroTimer;
