/**
 * Library of wellness exercises
 */
const wellnessExercises = [
  // Breathing Exercises
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    type: 'breathing',
    duration: 240, // 4 minutes
    description: 'A calming breathing technique used by Navy SEALs to reduce stress and improve focus.',
    instructions: [
      'Sit comfortably with your back straight',
      'Breathe in slowly for 4 seconds',
      'Hold your breath for 4 seconds',
      'Exhale slowly for 4 seconds',
      'Hold your breath for 4 seconds',
      'Repeat the cycle 4-6 times'
    ],
    benefits: ['Reduces stress', 'Improves focus', 'Calms the nervous system'],
    mediaType: null
  },
  {
    id: '478-breathing',
    name: '4-7-8 Breathing',
    type: 'breathing',
    duration: 180, // 3 minutes
    description: 'A relaxing breath technique that helps reduce anxiety and promote sleep.',
    instructions: [
      'Place the tip of your tongue against the ridge behind your upper front teeth',
      'Exhale completely through your mouth, making a whoosh sound',
      'Close your mouth and inhale quietly through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale completely through your mouth for 8 counts',
      'Repeat 3-4 times'
    ],
    benefits: ['Reduces anxiety', 'Helps with sleep', 'Promotes relaxation'],
    mediaType: null
  },
  {
    id: 'deep-breathing',
    name: 'Deep Belly Breathing',
    type: 'breathing',
    duration: 300, // 5 minutes
    description: 'Simple diaphragmatic breathing to activate your relaxation response.',
    instructions: [
      'Sit or lie down comfortably',
      'Place one hand on your chest and one on your belly',
      'Breathe in slowly through your nose, feeling your belly rise',
      'Your chest should remain relatively still',
      'Exhale slowly through pursed lips',
      'Continue for 5-10 minutes'
    ],
    benefits: ['Reduces tension', 'Lowers heart rate', 'Improves oxygen flow'],
    mediaType: null
  },

  // Meditation Exercises
  {
    id: 'quick-meditation',
    name: 'Quick Mindfulness',
    type: 'meditation',
    duration: 180, // 3 minutes
    description: 'A quick mindfulness exercise to center yourself.',
    instructions: [
      'Close your eyes and take a deep breath',
      'Focus on the sensation of your breath',
      'Notice any sounds around you without judgment',
      'Scan your body for any tension',
      'Breathe into any areas of tension',
      'Slowly open your eyes'
    ],
    benefits: ['Quick stress relief', 'Improves focus', 'Increases awareness'],
    mediaType: null
  },
  {
    id: 'stress-relief-meditation',
    name: 'Stress Relief Meditation',
    type: 'meditation',
    duration: 600, // 10 minutes
    description: 'A guided meditation specifically designed to release stress and tension.',
    instructions: [
      'Find a quiet, comfortable place to sit',
      'Close your eyes and take three deep breaths',
      'Imagine a warm, calming light above your head',
      'Visualize this light slowly moving down through your body',
      'As it moves, it dissolves all tension and stress',
      'Feel the stress leaving your body with each exhale',
      'Continue until you feel completely relaxed'
    ],
    benefits: ['Deep relaxation', 'Stress release', 'Mental clarity'],
    mediaType: null
  },
  {
    id: 'body-scan',
    name: 'Body Scan Meditation',
    type: 'meditation',
    duration: 900, // 15 minutes
    description: 'A mindfulness practice that involves scanning your body for tension.',
    instructions: [
      'Lie down or sit comfortably',
      'Close your eyes and take a few deep breaths',
      'Start at the top of your head',
      'Slowly move your attention down through each body part',
      'Notice any sensations without trying to change them',
      'Breathe into areas of tension',
      'Continue until you reach your toes'
    ],
    benefits: ['Body awareness', 'Tension release', 'Better sleep'],
    mediaType: null
  },

  // Physical Exercises
  {
    id: 'desk-stretches',
    name: 'Desk Stretches',
    type: 'exercise',
    duration: 300, // 5 minutes
    description: 'Quick stretches you can do at your desk to release tension.',
    instructions: [
      'Neck rolls: Slowly roll your head in circles',
      'Shoulder shrugs: Raise shoulders to ears, hold, release',
      'Arm stretches: Extend arms and rotate wrists',
      'Seated twist: Turn your torso to each side',
      'Forward fold: Bend forward in your chair',
      'Ankle circles: Rotate your ankles'
    ],
    benefits: ['Releases muscle tension', 'Improves circulation', 'Prevents stiffness'],
    mediaType: null
  },
  {
    id: 'energizing-stretch',
    name: 'Energizing Stretch Routine',
    type: 'exercise',
    duration: 420, // 7 minutes
    description: 'A quick stretch routine to boost your energy and alertness.',
    instructions: [
      'Stand up and reach your arms overhead',
      'Take a deep breath in as you stretch up',
      'Side stretch to the left, then right',
      'Forward fold to touch your toes',
      'Roll up slowly, one vertebra at a time',
      'Shoulder rolls backwards 5 times',
      'Jump in place or march for 30 seconds'
    ],
    benefits: ['Boosts energy', 'Improves posture', 'Increases blood flow'],
    mediaType: null
  },

  // Break Activities
  {
    id: 'mindful-break',
    name: 'Mindful Break',
    type: 'break',
    duration: 300, // 5 minutes
    description: 'A structured break to refresh your mind.',
    instructions: [
      'Step away from your work area',
      'Look out a window or at something in the distance',
      'Take 5 slow, deep breaths',
      'Notice 3 things you can see',
      'Notice 2 things you can hear',
      'Notice 1 thing you can feel',
      'Slowly return to your work'
    ],
    benefits: ['Mental refresh', 'Eye strain relief', 'Grounding'],
    mediaType: null
  },
  {
    id: 'walking-break',
    name: 'Walking Break',
    type: 'break',
    duration: 600, // 10 minutes
    description: 'A short walk to clear your mind and move your body.',
    instructions: [
      'Put on comfortable shoes',
      'Walk at a comfortable pace',
      'Focus on your surroundings',
      'Notice the feeling of your feet on the ground',
      'Breathe deeply and naturally',
      'Return feeling refreshed'
    ],
    benefits: ['Physical movement', 'Mental clarity', 'Fresh air'],
    mediaType: null
  },

  // Pomodoro
  {
    id: 'pomodoro-session',
    name: 'Pomodoro Focus Session',
    type: 'pomodoro',
    duration: 1500, // 25 minutes
    description: 'A focused work session using the Pomodoro technique.',
    instructions: [
      'Choose a task to focus on',
      'Set a timer for 25 minutes',
      'Work on the task with full focus',
      'When the timer rings, stop working',
      'Take a 5-minute break',
      'After 4 pomodoros, take a longer 15-30 minute break'
    ],
    benefits: ['Improved focus', 'Better time management', 'Reduced burnout'],
    settings: {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4
    },
    mediaType: null
  },

  // Journaling
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journaling',
    type: 'journaling',
    duration: 300, // 5 minutes
    description: 'Write down things you\'re grateful for to improve mood and perspective.',
    instructions: [
      'Find a quiet moment',
      'Think about your day so far',
      'Write down 3 things you\'re grateful for',
      'Be specific - why are you grateful for each?',
      'Notice how you feel after writing',
      'Try to do this daily for best results'
    ],
    prompts: [
      'What made you smile today?',
      'Who are you thankful for and why?',
      'What\'s something you often take for granted?',
      'What\'s a small pleasure you enjoyed recently?'
    ],
    benefits: ['Improved mood', 'Better perspective', 'Increased happiness'],
    mediaType: null
  },
  {
    id: 'reflection-journal',
    name: 'Daily Reflection',
    type: 'journaling',
    duration: 600, // 10 minutes
    description: 'Reflect on your day to gain insights and process emotions.',
    instructions: [
      'Find a quiet space',
      'Write about the highlights of your day',
      'Note any challenges you faced',
      'Consider what you learned',
      'Set an intention for tomorrow',
      'Close with something positive'
    ],
    prompts: [
      'What was the best part of today?',
      'What was challenging and how did you handle it?',
      'What would you do differently?',
      'What are you looking forward to?'
    ],
    benefits: ['Self-awareness', 'Emotional processing', 'Goal clarity'],
    mediaType: null
  },

  // Hydration Reminder
  {
    id: 'hydration-break',
    name: 'Hydration Break',
    type: 'hydration',
    duration: 60, // 1 minute
    description: 'A reminder to drink water and stay hydrated.',
    instructions: [
      'Pause what you\'re doing',
      'Get a glass of water',
      'Drink slowly and mindfully',
      'Notice how refreshing it feels',
      'Set a reminder for your next water break'
    ],
    benefits: ['Better focus', 'Improved energy', 'Overall health'],
    mediaType: null
  }
];

module.exports = {
  wellnessExercises
};
