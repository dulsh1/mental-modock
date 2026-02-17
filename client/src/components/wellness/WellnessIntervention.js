import React, { useState } from 'react';
import Card from '../common/Card';

const interventionCategories = {
  stress: {
    title: 'Stress Relief',
    icon: '😤',
    color: 'from-red-500 to-orange-500',
    interventions: [
      {
        id: 'quick-breathing',
        title: 'Quick Breathing Reset',
        description: 'Take 5 deep breaths to calm your nervous system',
        duration: '1 min',
        type: 'exercise',
      },
      {
        id: 'muscle-relaxation',
        title: 'Progressive Muscle Relaxation',
        description: 'Tense and release muscle groups for full-body relief',
        duration: '10 min',
        type: 'exercise',
      },
      {
        id: 'stress-journaling',
        title: 'Stress Dump Journal',
        description: 'Write out everything that\'s stressing you',
        duration: '5 min',
        type: 'activity',
      },
    ],
  },
  energy: {
    title: 'Energy Boost',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
    interventions: [
      {
        id: 'power-stretch',
        title: 'Power Stretch Routine',
        description: 'Quick stretches to wake up your body',
        duration: '3 min',
        type: 'exercise',
      },
      {
        id: 'cold-water',
        title: 'Cold Water Splash',
        description: 'Splash cold water on face for instant alertness',
        duration: '30 sec',
        type: 'tip',
      },
      {
        id: 'energizing-music',
        title: 'Energizing Playlist',
        description: 'Listen to upbeat music to boost energy',
        duration: '5 min',
        type: 'activity',
      },
    ],
  },
  focus: {
    title: 'Focus Enhancement',
    icon: '🎯',
    color: 'from-blue-500 to-purple-500',
    interventions: [
      {
        id: 'mini-meditation',
        title: 'Mini Focus Meditation',
        description: 'Clear your mind before starting a task',
        duration: '2 min',
        type: 'exercise',
      },
      {
        id: 'intention-setting',
        title: 'Set Intentions',
        description: 'Write down your top 3 priorities for now',
        duration: '2 min',
        type: 'activity',
      },
      {
        id: 'distraction-list',
        title: 'Distraction Dump',
        description: 'Write down distracting thoughts to address later',
        duration: '1 min',
        type: 'tip',
      },
    ],
  },
  mood: {
    title: 'Mood Boost',
    icon: '😊',
    color: 'from-green-500 to-teal-500',
    interventions: [
      {
        id: 'gratitude-3',
        title: '3 Things Gratitude',
        description: 'List 3 things you\'re grateful for right now',
        duration: '2 min',
        type: 'activity',
      },
      {
        id: 'nature-break',
        title: 'Nature Micro-Break',
        description: 'Step outside or look at nature for a moment',
        duration: '3 min',
        type: 'activity',
      },
      {
        id: 'positive-affirmation',
        title: 'Positive Affirmations',
        description: 'Repeat encouraging statements to yourself',
        duration: '1 min',
        type: 'exercise',
      },
    ],
  },
};

const WellnessIntervention = ({ currentMood, currentEnergy, currentStress, onIntervention }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [completedInterventions, setCompletedInterventions] = useState([]);

  // Suggest category based on current state
  const getSuggestedCategory = () => {
    if (currentStress >= 7) return 'stress';
    if (currentEnergy <= 3) return 'energy';
    if (currentMood <= 3) return 'mood';
    return 'focus';
  };

  const suggestedCategory = getSuggestedCategory();

  const handleComplete = (intervention) => {
    setCompletedInterventions(prev => [...prev, intervention.id]);
    if (onIntervention) {
      onIntervention(intervention);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Wellness Interventions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quick activities to improve your state
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 
                         text-green-600 dark:text-green-400 text-sm">
          {completedInterventions.length} completed today
        </span>
      </div>

      {/* AI Suggestion */}
      {!selectedCategory && (
        <div className={`
          mb-6 p-4 rounded-xl bg-gradient-to-r ${interventionCategories[suggestedCategory].color}
          text-white
        `}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{interventionCategories[suggestedCategory].icon}</span>
            <div>
              <p className="font-medium">Suggested for you</p>
              <p className="text-sm text-white/80">
                Based on your current {suggestedCategory === 'stress' ? 'stress level' : 
                  suggestedCategory === 'energy' ? 'energy level' : 
                  suggestedCategory === 'mood' ? 'mood' : 'state'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCategory(suggestedCategory)}
            className="w-full mt-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg 
                       font-medium transition-colors"
          >
            Explore {interventionCategories[suggestedCategory].title} →
          </button>
        </div>
      )}

      {/* Category selection */}
      {!selectedCategory && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(interventionCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`
                p-4 rounded-xl text-left transition-all hover:scale-[1.02]
                ${key === suggestedCategory 
                  ? `bg-gradient-to-br ${category.color} text-white` 
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className="text-3xl block mb-2">{category.icon}</span>
              <p className={`font-medium ${key === suggestedCategory ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                {category.title}
              </p>
              <p className={`text-xs ${key === suggestedCategory ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {category.interventions.length} activities
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Intervention list for selected category */}
      {selectedCategory && (
        <>
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 
                       hover:text-primary-500 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to categories
          </button>

          <div className={`
            flex items-center gap-3 p-4 rounded-xl mb-4
            bg-gradient-to-r ${interventionCategories[selectedCategory].color} text-white
          `}>
            <span className="text-4xl">{interventionCategories[selectedCategory].icon}</span>
            <div>
              <h4 className="font-bold text-lg">{interventionCategories[selectedCategory].title}</h4>
              <p className="text-sm text-white/80">Choose an activity below</p>
            </div>
          </div>

          <div className="space-y-3">
            {interventionCategories[selectedCategory].interventions.map((intervention) => {
              const isCompleted = completedInterventions.includes(intervention.id);
              
              return (
                <div
                  key={intervention.id}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${isCompleted 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-500'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-800 dark:text-white">
                          {intervention.title}
                        </h5>
                        {isCompleted && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {intervention.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 
                                         text-gray-600 dark:text-gray-400">
                          ⏱️ {intervention.duration}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 
                                         text-gray-600 dark:text-gray-400">
                          {intervention.type === 'exercise' ? '🏃 Exercise' : 
                           intervention.type === 'activity' ? '✍️ Activity' : '💡 Tip'}
                        </span>
                      </div>
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(intervention)}
                        className={`
                          px-4 py-2 rounded-lg text-white font-medium text-sm
                          bg-gradient-to-r ${interventionCategories[selectedCategory].color}
                          hover:opacity-90 transition-opacity
                        `}
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Completion encouragement */}
      {completedInterventions.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 
                        dark:from-green-900/20 dark:to-teal-900/20 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <span>🎉</span>
            <span>
              Great job! You've completed {completedInterventions.length} intervention
              {completedInterventions.length !== 1 ? 's' : ''} today. Keep taking care of yourself!
            </span>
          </p>
        </div>
      )}
    </Card>
  );
};

export default WellnessIntervention;
