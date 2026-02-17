import React from 'react';

const EnergySlider = ({ value, onChange }) => {
  const getEnergyColor = (level) => {
    if (level <= 3) return 'from-red-500 to-orange-500';
    if (level <= 5) return 'from-orange-500 to-yellow-500';
    if (level <= 7) return 'from-yellow-500 to-lime-500';
    return 'from-lime-500 to-green-500';
  };

  const getEnergyLabel = (level) => {
    if (level <= 2) return 'Exhausted';
    if (level <= 4) return 'Low Energy';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'Energetic';
    return 'Highly Energetic';
  };

  const getEnergyIcon = (level) => {
    if (level <= 2) return '🪫';
    if (level <= 4) return '🔋';
    if (level <= 6) return '⚡';
    if (level <= 8) return '💪';
    return '🚀';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getEnergyIcon(value)}</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {getEnergyLabel(value)}
          </span>
        </div>
        <span className="text-lg font-bold text-primary-600">{value}/10</span>
      </div>

      <div className="relative">
        {/* Background track */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Filled track with gradient */}
          <div
            className={`h-full bg-gradient-to-r ${getEnergyColor(value)} transition-all duration-300 rounded-full`}
            style={{ width: `${value * 10}%` }}
          />
        </div>

        {/* Slider input */}
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Tick marks */}
        <div className="flex justify-between mt-2 px-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-2 rounded-full transition-colors ${
                i < value ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Energy tips */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {getEnergyTip(value)}
        </p>
      </div>
    </div>
  );
};

const getEnergyTip = (level) => {
  if (level <= 3) {
    return "💡 Tip: Consider taking a power nap, having a healthy snack, or doing some light stretching.";
  }
  if (level <= 5) {
    return "💡 Tip: A short walk or some fresh air might help boost your energy levels.";
  }
  if (level <= 7) {
    return "💡 Tip: You have good energy for focused work. Consider tackling important tasks.";
  }
  return "💡 Tip: Great energy! This is an optimal time for challenging or creative tasks.";
};

export default EnergySlider;
