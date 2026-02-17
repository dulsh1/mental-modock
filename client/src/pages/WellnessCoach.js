import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PomodoroTimer from '../components/wellness/PomodoroTimer';
import BreathingExercise from '../components/wellness/BreathingExercise';
import GuidedMeditation from '../components/wellness/GuidedMeditation';
import WellnessIntervention from '../components/wellness/WellnessIntervention';
import { wellnessService } from '../services/services';
import { 
  HeartIcon, 
  ClockIcon, 
  SparklesIcon,
  PlayIcon,
  MusicalNoteIcon 
} from '@heroicons/react/24/outline';

const WellnessCoach = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [interventions, setInterventions] = useState([]);
  const [wellnessStats, setWellnessStats] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);

  // Check if we should open breathing exercise from navigation state
  useEffect(() => {
    if (location.state?.openBreathing) {
      setActiveTab('breathing');
    }
  }, [location.state]);

  const fetchWellnessData = useCallback(async () => {
    try {
      const [interventionsRes, statsRes] = await Promise.all([
        wellnessService.getInterventions(),
        wellnessService.getWellnessStats()
      ]);
      
      setInterventions(interventionsRes.data.data || []);
      setWellnessStats(statsRes.data.data || getDemoStats());
    } catch (error) {
      console.error('Failed to fetch wellness data:', error);
      setInterventions(getDemoInterventions());
      setWellnessStats(getDemoStats());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWellnessData();
  }, [fetchWellnessData]);

  const getDemoStats = () => ({
    totalMinutesMeditated: 245,
    pomodoroSessions: 18,
    breathingExercises: 12,
    currentStreak: 5,
    weeklyGoalProgress: 75,
  });

  const getDemoInterventions = () => [
    {
      _id: '1',
      type: 'breathing',
      title: 'Quick Stress Relief',
      description: 'A 2-minute breathing exercise to reduce stress',
      duration: 2,
      priority: 'high',
    },
    {
      _id: '2',
      type: 'meditation',
      title: 'Mindful Moment',
      description: '5-minute guided meditation for focus',
      duration: 5,
      priority: 'medium',
    },
    {
      _id: '3',
      type: 'break',
      title: 'Movement Break',
      description: 'Take a short walk or stretch',
      duration: 10,
      priority: 'low',
    },
  ];

  const handleStartExercise = (exercise) => {
    setActiveExercise(exercise);
    toast.success(`Starting ${exercise.title}`);
  };

  const handleCompleteExercise = async (exerciseId) => {
    try {
      await wellnessService.completeIntervention(exerciseId);
      toast.success('Exercise completed! Great job!');
      setActiveExercise(null);
      fetchWellnessData();
    } catch (error) {
      toast.success('Exercise completed!');
      setActiveExercise(null);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HeartIcon },
    { id: 'pomodoro', label: 'Pomodoro', icon: ClockIcon },
    { id: 'breathing', label: 'Breathing', icon: SparklesIcon },
    { id: 'meditation', label: 'Meditation', icon: MusicalNoteIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading wellness coach..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Wellness Coach
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your personal guide to mental wellness and productivity
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">{wellnessStats?.totalMinutesMeditated || 0}</p>
                <p className="text-sm text-gray-500">Minutes Meditated</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{wellnessStats?.pomodoroSessions || 0}</p>
                <p className="text-sm text-gray-500">Pomodoro Sessions</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{wellnessStats?.breathingExercises || 0}</p>
                <p className="text-sm text-gray-500">Breathing Exercises</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">🔥 {wellnessStats?.currentStreak || 0}</p>
                <p className="text-sm text-gray-500">Day Streak</p>
              </Card>
            </div>

            {/* Suggested Interventions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Suggested For You
              </h2>
              <div className="space-y-3">
                {interventions.map(intervention => (
                  <WellnessIntervention
                    key={intervention._id}
                    intervention={intervention}
                    onStart={() => handleStartExercise(intervention)}
                  />
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card 
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab('breathing')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Quick Breathing</h3>
                    <p className="text-sm text-gray-500">2 min exercise</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab('pomodoro')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Start Pomodoro</h3>
                    <p className="text-sm text-gray-500">Focus session</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab('meditation')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <MusicalNoteIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Guided Meditation</h3>
                    <p className="text-sm text-gray-500">5-15 min sessions</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'pomodoro' && (
          <motion.div
            key="pomodoro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PomodoroTimer />
          </motion.div>
        )}

        {activeTab === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BreathingExercise />
          </motion.div>
        )}

        {activeTab === 'meditation' && (
          <motion.div
            key="meditation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GuidedMeditation />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Exercise Modal */}
      {activeExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              {activeExercise.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {activeExercise.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCompleteExercise(activeExercise._id)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Complete
              </button>
              <button
                onClick={() => setActiveExercise(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WellnessCoach;
