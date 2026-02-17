import React from 'react';

const stressLevels = [
  { value: 1, label: 'Very Relaxed', color: 'bg-green-500', textColor: 'text-green-500' },
  { value: 2, label: 'Relaxed', color: 'bg-green-400', textColor: 'text-green-400' },
  { value: 3, label: 'Calm', color: 'bg-lime-500', textColor: 'text-lime-500' },
  { value: 4, label: 'Mild Tension', color: 'bg-yellow-400', textColor: 'text-yellow-400' },
  { value: 5, label: 'Moderate Stress', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { value: 6, label: 'Stressed', color: 'bg-orange-400', textColor: 'text-orange-400' },
  { value: 7, label: 'High Stress', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { value: 8, label: 'Very Stressed', color: 'bg-red-400', textColor: 'text-red-400' },
  { value: 9, label: 'Overwhelmed', color: 'bg-red-500', textColor: 'text-red-500' },
  { value: 10, label: 'Crisis', color: 'bg-red-600', textColor: 'text-red-600' },
];

const StressIndicator = ({ value, onChange }) => {
  const currentLevel = stressLevels.find(l => l.value === value) || stressLevels[4];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentLevel.color} text-white`}>
          {currentLevel.label}
        </span>
        <span className="text-lg font-bold text-primary-600">{value}/10</span>
      </div>

      {/* Stress meter visualization */}
      <div className="relative mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {stressLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className={`
                flex-1 transition-all duration-200 relative
                ${level.color}
                ${value === level.value ? 'ring-2 ring-white ring-offset-2 z-10 scale-y-125' : 'opacity-60 hover:opacity-80'}
              `}
              title={level.label}
            >
              {value === level.value && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scale labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Relaxed</span>
          <span>Moderate</span>
          <span>High</span>
        </div>
      </div>

      {/* Current stress info */}
      <div className={`p-4 rounded-lg ${getStressBackground(value)}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getStressEmoji(value)}</span>
          <div>
            <p className="font-medium text-gray-800 dark:text-white">
              {getStressMessage(value)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {getStressSuggestion(value)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stress factors */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Common stress factors (optional):
        </p>
        <div className="flex flex-wrap gap-2">
          {['Work', 'Relationships', 'Health', 'Finance', 'Sleep', 'Other'].map((factor) => (
            <button
              key={factor}
              className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 
                         text-gray-600 dark:text-gray-300 hover:bg-primary-100 
                         dark:hover:bg-primary-900 transition-colors"
            >
              {factor}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const getStressBackground = (level) => {
  if (level <= 3) return 'bg-green-50 dark:bg-green-900/20';
  if (level <= 5) return 'bg-yellow-50 dark:bg-yellow-900/20';
  if (level <= 7) return 'bg-orange-50 dark:bg-orange-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
};

const getStressEmoji = (level) => {
  if (level <= 2) return '😌';
  if (level <= 4) return '🙂';
  if (level <= 6) return '😟';
  if (level <= 8) return '😰';
  return '🆘';
};

const getStressMessage = (level) => {
  if (level <= 3) return "You're in a good place mentally!";
  if (level <= 5) return "You have manageable stress levels.";
  if (level <= 7) return "Your stress is elevated. Consider taking a break.";
  return "High stress detected. Please prioritize self-care.";
};

const getStressSuggestion = (level) => {
  if (level <= 3) return "Keep maintaining your current wellness practices.";
  if (level <= 5) return "A short meditation or walk could help maintain balance.";
  if (level <= 7) return "Try our breathing exercises or contact a wellness coach.";
  return "We recommend reaching out to a mental health professional.";
};

export default StressIndicator;
