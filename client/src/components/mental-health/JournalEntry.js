import React, { useState } from 'react';
import Card from '../common/Card';

const promptSuggestions = [
  "What made you smile today?",
  "What's one thing you're grateful for?",
  "How did you handle a challenge today?",
  "What's on your mind right now?",
  "What would make tomorrow better?",
  "Describe your ideal relaxing moment.",
];

const JournalEntry = ({ value, onChange, placeholder }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [charCount, setCharCount] = useState(value?.length || 0);

  const handleChange = (e) => {
    const text = e.target.value;
    setCharCount(text.length);
    onChange(text);
  };

  const insertPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    const newValue = value ? `${value}\n\n${prompt}\n` : `${prompt}\n`;
    onChange(newValue);
    setCharCount(newValue.length);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Journal Entry
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {charCount} characters
        </span>
      </div>

      {/* Writing prompts */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Need inspiration? Try a prompt:
        </p>
        <div className="flex flex-wrap gap-2">
          {promptSuggestions.map((prompt, index) => (
            <button
              key={index}
              onClick={() => insertPrompt(prompt)}
              className={`
                px-3 py-1.5 text-xs rounded-full transition-all duration-200
                ${selectedPrompt === prompt
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900'
                }
              `}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Text area */}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder || "Write your thoughts here... Express yourself freely."}
          rows={6}
          className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     resize-none transition-all duration-200"
        />
        
        {/* Decorative elements */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={() => onChange('')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Clear"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mood tags */}
      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Tag your entry (optional):
        </p>
        <div className="flex flex-wrap gap-2">
          {['#gratitude', '#reflection', '#goals', '#challenges', '#achievements', '#self-care'].map((tag) => (
            <button
              key={tag}
              onClick={() => onChange(value ? `${value} ${tag}` : tag)}
              className="px-2 py-1 text-xs rounded-md bg-gradient-to-r from-primary-100 to-secondary-100 
                         dark:from-primary-900/30 dark:to-secondary-900/30
                         text-primary-700 dark:text-primary-300 hover:opacity-80 transition-opacity"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Writing tips */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
          <span>💡</span>
          <span>
            Regular journaling can reduce stress, improve memory, and boost emotional intelligence. 
            Try to write for at least 5 minutes.
          </span>
        </p>
      </div>
    </Card>
  );
};

export default JournalEntry;
