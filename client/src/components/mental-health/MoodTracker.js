import React, { useState } from 'react';

const moodOptions = [
  { value: 1, emoji: '😢', label: 'Very Low', color: 'bg-red-500' },
  { value: 2, emoji: '😔', label: 'Low', color: 'bg-orange-500' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'bg-yellow-500' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'bg-lime-500' },
  { value: 5, emoji: '😊', label: 'Great', color: 'bg-green-500' },
];

const MoodTracker = ({ onMoodSelect, selectedMood, value, onChange }) => {
  const [hoveredMood, setHoveredMood] = useState(null);

  // Support both prop patterns
  const currentMood = selectedMood ?? value ?? 3;
  const handleSelect = (moodValue) => {
    if (onMoodSelect) {
      onMoodSelect(moodValue);
    }
    if (onChange) {
      onChange(moodValue);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center gap-2">
        {moodOptions.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleSelect(mood.value)}
            onMouseEnter={() => setHoveredMood(mood.value)}
            onMouseLeave={() => setHoveredMood(null)}
            className={`
              relative flex flex-col items-center p-3 rounded-xl transition-all duration-200
              ${currentMood === mood.value 
                ? `${mood.color} text-white scale-110 shadow-lg` 
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
            `}
          >
            <span className="text-3xl mb-1">{mood.emoji}</span>
            <span className={`text-xs font-medium ${
              currentMood === mood.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'
            }`}>
              {mood.label}
            </span>
            
            {/* Pulse animation for selected mood */}
            {currentMood === mood.value && (
              <span className={`absolute inset-0 rounded-xl ${mood.color} animate-ping opacity-25`} />
            )}
          </button>
        ))}
      </div>

      {/* Mood description tooltip */}
      {hoveredMood && (
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
          {getMoodDescription(hoveredMood)}
        </div>
      )}
    </div>
  );
};

const getMoodDescription = (moodValue) => {
  const descriptions = {
    1: "You're feeling quite down. Remember, it's okay to have tough days.",
    2: "Things could be better. Consider taking a short break.",
    3: "You're in a balanced state. Keep monitoring how you feel.",
    4: "You're doing well! Keep up the positive momentum.",
    5: "You're feeling great! Excellent time for challenging tasks.",
  };
  return descriptions[moodValue] || '';
};

export default MoodTracker;
