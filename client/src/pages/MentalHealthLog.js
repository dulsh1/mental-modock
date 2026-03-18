import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoodTracker from '../components/mental-health/MoodTracker';
import EnergySlider from '../components/mental-health/EnergySlider';
import StressIndicator from '../components/mental-health/StressIndicator';
import JournalEntry from '../components/mental-health/JournalEntry';
import { mentalHealthService } from '../services/services';
import { CheckCircleIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const MentalHealthLog = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  
  // Form state
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [journalEntry, setJournalEntry] = useState('');
  const [sleepHours, setSleepHours] = useState(7);
  const [activities, setActivities] = useState([]);

  const availableActivities = [
    'Exercise', 'Meditation', 'Reading', 'Social', 'Work', 
    'Study', 'Creative', 'Nature', 'Rest', 'Gaming'
  ];

  const moodLabelFromScore = (score) => {
    if (score <= 2) return 'very_low';
    if (score <= 4) return 'low';
    if (score <= 6) return 'neutral';
    if (score <= 8) return 'good';
    return 'excellent';
  };

  const normalizeLogForUI = (log) => ({
    ...log,
    mood: typeof log?.mood === 'object' ? (log.mood?.score || 3) : (log?.mood || 3),
    energy: typeof log?.energy === 'object' ? (log.energy?.score || 3) : (log?.energy || 3),
    stress: typeof log?.stress === 'object' ? (log.stress?.score || 3) : (log?.stress || 3),
    journalEntry: log?.journal || log?.journalEntry || '',
    sleepHours: log?.sleep?.hours || log?.sleepHours || 7,
    activities: log?.activities || []
  });

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, recentRes] = await Promise.all([
        mentalHealthService.getTodayLog(),
        mentalHealthService.getRecentLogs(7)
      ]);
      
      if (todayRes.data.data) {
        const log = normalizeLogForUI(todayRes.data.data);
        setTodayLog(log);
        setMood(log.mood);
        setEnergy(log.energy);
        setStress(log.stress);
        setJournalEntry(log.journalEntry);
        setSleepHours(log.sleepHours);
        setActivities(log.activities);
      }
      
      setRecentLogs((recentRes.data.data || []).map(normalizeLogForUI));
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      // Demo data
      setRecentLogs(getDemoLogs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDemoLogs = () => {
    const logs = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      logs.push({
        _id: i.toString(),
        date: date.toISOString(),
        mood: Math.floor(Math.random() * 3) + 3,
        energy: Math.floor(Math.random() * 3) + 3,
        stress: Math.floor(Math.random() * 4) + 2,
      });
    }
    return logs;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const logData = {
        mood: {
          score: mood,
          label: moodLabelFromScore(mood)
        },
        energy: {
          score: energy
        },
        stress: {
          score: stress
        },
        journal: journalEntry,
        sleep: {
          hours: sleepHours,
          quality: 'fair'
        },
        activities,
      };

      if (todayLog) {
        await mentalHealthService.updateLog(todayLog._id, logData);
      } else {
        const response = await mentalHealthService.createLog(logData);
        setTodayLog(normalizeLogForUI(response.data.data));
      }
      
      toast.success('Daily log saved successfully!');
    } catch (error) {
      toast.error('Failed to save log');
      // Save locally for demo
      setTodayLog({ ...todayLog, mood, energy, stress, journalEntry, sleepHours, activities });
      toast.success('Log saved locally');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivity = (activity) => {
    setActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const getMoodEmoji = (value) => {
    const emojis = ['😢', '😕', '😐', '🙂', '😊'];
    return emojis[value - 1] || '😐';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading your log..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Daily Mental Health Log
          </h1>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        {todayLog && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm">Logged today</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Main Tracking */}
        <div className="space-y-6">
          {/* Mood Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                How are you feeling today?
              </h2>
              <MoodTracker value={mood} onChange={setMood} />
            </Card>
          </motion.div>

          {/* Energy Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Energy Level
              </h2>
              <EnergySlider value={energy} onChange={setEnergy} />
            </Card>
          </motion.div>

          {/* Stress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Stress Level
              </h2>
              <StressIndicator value={stress} onChange={setStress} />
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Sleep Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Sleep Duration
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="text-center min-w-[60px]">
                  <span className="text-2xl font-bold text-primary-600">{sleepHours}</span>
                  <span className="text-sm text-gray-500 ml-1">hrs</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </Card>
          </motion.div>

          {/* Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Today's Activities
              </h2>
              <div className="flex flex-wrap gap-2">
                {availableActivities.map(activity => (
                  <button
                    key={activity}
                    onClick={() => toggleActivity(activity)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      activities.includes(activity)
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 ring-2 ring-primary-500'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Journal Entry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Journal Entry
              </h2>
              <JournalEntry value={journalEntry} onChange={setJournalEntry} />
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8 py-3 text-lg"
        >
          {saving ? 'Saving...' : todayLog ? 'Update Log' : 'Save Log'}
        </button>
      </motion.div>

      {/* Recent Logs Preview */}
      {recentLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Past 7 Days
            </h2>
            <div className="flex justify-between items-end h-24">
              {recentLogs.slice(0, 7).reverse().map((log, index) => (
                <div key={log._id} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                  <div 
                    className="w-8 bg-primary-200 dark:bg-primary-800 rounded-t"
                    style={{ height: `${(log.mood / 5) * 60}px` }}
                  />
                  <span className="text-xs text-gray-400">
                    {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MentalHealthLog;
