import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DailyTaskView from '../components/scheduling/CalendarViews/DailyTaskView';
import MonthlyCalendarView from '../components/scheduling/CalendarViews/MonthlyCalendarView';
import ExportButtons from '../components/scheduling/ExportControls/ExportButtons';
import { scheduleService } from '../services/services';
import { CalendarIcon } from '@heroicons/react/24/outline';

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date) => {
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const TimeBlockingCalendar = () => {
  const [currentView, setCurrentView] = useState('daily'); // daily, calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyGenerating, setDailyGenerating] = useState(false);

  // Fetch schedule for the week containing currentDate, then render daily slice.
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const weekStart = getWeekStart(currentDate);
      const dateStr = toLocalDateString(weekStart);
      const response = await scheduleService.getWeeklySchedule(dateStr);

      if (response.data.success) {
        if (response.data.data) {
          setSchedule(response.data.data);
          return;
        }

        // Fallback for timezone/week-boundary mismatches: pick a schedule that contains currentDate.
        const listRes = await scheduleService.getSchedules({ limit: 10, archived: false });
        const items = listRes?.data?.data || [];
        const target = new Date(currentDate);
        target.setHours(0, 0, 0, 0);

        const candidate = items.find((s) => {
          const start = new Date(s.weekStartDate);
          const end = new Date(s.weekEndDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return target >= start && target <= end;
        });

        setSchedule(candidate || null);
      }
    } catch (error) {
      setSchedule(null);
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    if (currentView === 'daily') {
      fetchSchedule();
    }
  }, [currentView, currentDate, fetchSchedule]);

  const handleGenerateDailyOptimized = async () => {
    try {
      setDailyGenerating(true);
      const response = await scheduleService.generateDailyOptimized({
        targetDate: toLocalDateString(currentDate)
      });

      if (response?.data?.success && response?.data?.data) {
        setSchedule(response.data.data);
      } else {
        await fetchSchedule();
      }

      setCurrentView('daily');
      toast.success('Daily optimized schedule generated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate daily optimized schedule');
    } finally {
      setDailyGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Time Blocking Calendar
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Daily planning with smart optimization and focused scheduling
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportButtons schedule={schedule} currentDate={currentDate} />
        </div>
      </div>

      {/* View Selector */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">View:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['daily', 'calendar'].map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-4 py-2 text-sm rounded-lg capitalize font-medium transition-all ${
                  currentView === view
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Navigation Controls */}
          {currentView === 'daily' && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  const nextDate = new Date(currentDate);
                  nextDate.setDate(nextDate.getDate() - 1);
                  setCurrentDate(nextDate);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-max">
                {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const nextDate = new Date(currentDate);
                  nextDate.setDate(nextDate.getDate() + 1);
                  setCurrentDate(nextDate);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              >
                Next →
              </button>
            </div>
          )}

          {currentView === 'calendar' && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  const nextDate = new Date(currentDate);
                  nextDate.setMonth(nextDate.getMonth() - 1);
                  setCurrentDate(nextDate);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-max">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const nextDate = new Date(currentDate);
                  nextDate.setMonth(nextDate.getMonth() + 1);
                  setCurrentDate(nextDate);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading schedule..." />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'daily' && schedule ? (
              <DailyTaskView schedule={schedule} currentDate={currentDate} onScheduleUpdate={fetchSchedule} />
            ) : currentView === 'daily' ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No schedule found for this date. Create one to get started!
                </p>
                <button
                  onClick={handleGenerateDailyOptimized}
                  disabled={dailyGenerating}
                  className="btn-primary"
                >
                  {dailyGenerating ? 'Optimizing...' : 'Generate Daily Optimized Plan'}
                </button>
              </Card>
            ) : null}

            {currentView === 'calendar' && (
              <MonthlyCalendarView currentDate={currentDate} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

    </div>
  );
};

export default TimeBlockingCalendar;
