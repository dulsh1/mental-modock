import React, { useState, useEffect, useCallback } from 'react';
import Card from '../common/Card';

const breathingPatterns = {
  relaxing: {
    name: 'Relaxing Breath',
    description: '4-7-8 technique for calm and sleep',
    inhale: 4,
    hold: 7,
    exhale: 8,
    color: 'from-blue-500 to-cyan-500',
  },
  energizing: {
    name: 'Energizing Breath',
    description: 'Quick breath to boost energy',
    inhale: 4,
    hold: 4,
    exhale: 4,
    color: 'from-orange-500 to-yellow-500',
  },
  box: {
    name: 'Box Breathing',
    description: 'Navy SEAL technique for focus',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfter: 4,
    color: 'from-purple-500 to-pink-500',
  },
  calming: {
    name: 'Deep Calm',
    description: 'Extended exhale for anxiety relief',
    inhale: 4,
    hold: 2,
    exhale: 6,
    color: 'from-green-500 to-teal-500',
  },
};

const phases = ['inhale', 'hold', 'exhale', 'holdAfter'];
const phaseLabels = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  holdAfter: 'Hold',
};

const BreathingExercise = ({ onComplete }) => {
  const [selectedPattern, setSelectedPattern] = useState('relaxing');
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('inhale');
  const [phaseTime, setPhaseTime] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalCycles, setTotalCycles] = useState(5);

  const pattern = breathingPatterns[selectedPattern];

  const getCurrentPhaseDuration = useCallback(() => {
    return pattern[currentPhase] || 0;
  }, [pattern, currentPhase]);

  const getNextPhase = useCallback(() => {
    const currentIndex = phases.indexOf(currentPhase);
    for (let i = 1; i <= phases.length; i++) {
      const nextPhase = phases[(currentIndex + i) % phases.length];
      if (pattern[nextPhase]) {
        return nextPhase;
      }
    }
    return 'inhale';
  }, [currentPhase, pattern]);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      const duration = getCurrentPhaseDuration();
      
      if (phaseTime >= duration) {
        const nextPhase = getNextPhase();
        
        if (nextPhase === 'inhale' && currentPhase !== 'inhale') {
          setCyclesCompleted(prev => prev + 1);
          
          if (cyclesCompleted + 1 >= totalCycles) {
            setIsActive(false);
            if (onComplete) {
              onComplete({ pattern: selectedPattern, cycles: totalCycles });
            }
            return;
          }
        }
        
        setCurrentPhase(nextPhase);
        setPhaseTime(0);
      } else {
        interval = setInterval(() => {
          setPhaseTime(prev => prev + 0.1);
        }, 100);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, phaseTime, currentPhase, cyclesCompleted, totalCycles, getCurrentPhaseDuration, getNextPhase, onComplete, selectedPattern]);

  const startExercise = () => {
    setIsActive(true);
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setCyclesCompleted(0);
  };

  const stopExercise = () => {
    setIsActive(false);
    setCurrentPhase('inhale');
    setPhaseTime(0);
  };

  const progress = (phaseTime / getCurrentPhaseDuration()) * 100;
  const overallProgress = (cyclesCompleted / totalCycles) * 100;

  const getCircleScale = () => {
    if (currentPhase === 'inhale') {
      return 0.6 + (progress / 100) * 0.4;
    } else if (currentPhase === 'exhale') {
      return 1 - (progress / 100) * 0.4;
    }
    return currentPhase === 'hold' || currentPhase === 'holdAfter' ? 1 : 0.6;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Breathing Exercise
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Guided breathing for wellness
          </p>
        </div>
        {!isActive && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Cycles:</span>
            <select
              value={totalCycles}
              onChange={(e) => setTotalCycles(parseInt(e.target.value))}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
            >
              {[3, 5, 7, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pattern selector */}
      {!isActive && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {Object.entries(breathingPatterns).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSelectedPattern(key)}
              className={`
                p-3 rounded-lg text-left transition-all
                ${selectedPattern === key 
                  ? `bg-gradient-to-r ${value.color} text-white` 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <p className={`font-medium text-sm ${selectedPattern === key ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                {value.name}
              </p>
              <p className={`text-xs ${selectedPattern === key ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {value.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Animation display */}
      <div className="relative flex items-center justify-center h-64 mb-6">
        {/* Background circles */}
        <div className="absolute w-48 h-48 rounded-full bg-gray-100 dark:bg-gray-800 opacity-50" />
        <div className="absolute w-40 h-40 rounded-full bg-gray-100 dark:bg-gray-800 opacity-30" />
        
        {/* Animated breathing circle */}
        <div
          className={`
            absolute rounded-full transition-transform duration-500 ease-in-out
            bg-gradient-to-br ${pattern.color} shadow-2xl
          `}
          style={{
            width: '12rem',
            height: '12rem',
            transform: `scale(${getCircleScale()})`,
          }}
        />

        {/* Center content */}
        <div className="relative z-10 text-center">
          <p className="text-2xl font-bold text-white drop-shadow-lg">
            {isActive ? phaseLabels[currentPhase] : 'Ready'}
          </p>
          {isActive && (
            <p className="text-lg text-white/80 font-medium drop-shadow">
              {Math.ceil(getCurrentPhaseDuration() - phaseTime)}
            </p>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      {isActive && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>Cycle {cyclesCompleted + 1} of {totalCycles}</span>
            <span>{Math.round(overallProgress)}% complete</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${pattern.color} transition-all duration-300`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex justify-center">
        {isActive ? (
          <button
            onClick={stopExercise}
            className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 
                       text-gray-700 dark:text-gray-300 font-medium
                       hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Stop Exercise
          </button>
        ) : (
          <button
            onClick={startExercise}
            className={`
              px-8 py-3 rounded-xl font-medium text-white
              bg-gradient-to-r ${pattern.color}
              hover:opacity-90 transition-opacity shadow-lg
            `}
          >
            Start Breathing
          </button>
        )}
      </div>

      {/* Pattern info */}
      {!isActive && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-800 dark:text-white mb-2">
            {pattern.name} Pattern
          </h4>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Inhale: {pattern.inhale}s</span>
            <span>Hold: {pattern.hold}s</span>
            <span>Exhale: {pattern.exhale}s</span>
            {pattern.holdAfter && <span>Hold: {pattern.holdAfter}s</span>}
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-xs text-green-600 dark:text-green-400 flex items-start gap-2">
          <span>🌿</span>
          <span>
            Regular breathing exercises can reduce stress, lower blood pressure, improve focus, 
            and promote better sleep.
          </span>
        </p>
      </div>
    </Card>
  );
};

export default BreathingExercise;
