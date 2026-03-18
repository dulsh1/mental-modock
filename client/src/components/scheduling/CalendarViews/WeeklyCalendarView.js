import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../../../components/common/Card';
import { scheduleService } from '../../../services/services';
import toast from 'react-hot-toast';

const WeeklyCalendarView = ({ schedule, currentDate, onScheduleUpdate }) => {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Group time blocks by day and time
  const blocksByDayAndTime = useMemo(() => {
    const grouped = {};
    days.forEach((day, idx) => {
      grouped[idx] = {};
      hours.forEach(hour => {
        grouped[idx][hour] = [];
      });
    });

    if (schedule && schedule.timeBlocks) {
      schedule.timeBlocks.forEach(block => {
        const blockDate = new Date(block.date);
        const dayOfWeek = blockDate.getDay();
        const hour = parseInt(block.startTime.split(':')[0]);

        if (grouped[dayOfWeek] && grouped[dayOfWeek][hour]) {
          grouped[dayOfWeek][hour].push(block);
        }
      });
    }

    return grouped;
  }, [schedule, hours, days]);

  const getDayDate = (dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleMarkComplete = async (blockId) => {
    try {
      await scheduleService.updateTimeBlock(schedule._id, blockId, { status: 'completed' });
      onScheduleUpdate();
      toast.success('Task marked complete!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const getPriorityColor = (priority, isBreak) => {
    if (isBreak) return 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700';
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700';
      case 'high': return 'bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700';
      case 'low': return 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700';
      default: return 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Weekly Grid */}
      <div className="overflow-x-auto">
        <Card className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="bg-gray-50 dark:bg-gray-800 p-3 text-left text-sm font-semibold w-16">
                  Time
                </th>
                {days.map((day, idx) => (
                  <th
                    key={day}
                    className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-semibold border-l border-gray-200 dark:border-gray-700"
                  >
                    <div className="font-bold text-primary-600">{day.slice(0, 3)}</div>
                    <div className="text-xs text-gray-500">{getDayDate(idx)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map(hour => (
                <tr key={hour} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="bg-gray-50 dark:bg-gray-800 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 w-16 text-right">
                    {String(hour).padStart(2, '0')}:00
                  </td>
                  {days.map((day, dayIdx) => (
                    <td
                      key={`${dayIdx}-${hour}`}
                      className="border-l border-gray-200 dark:border-gray-700 p-2 h-20 align-top"
                    >
                      {blocksByDayAndTime[dayIdx][hour].length > 0 && (
                        <div className="space-y-1">
                          {blocksByDayAndTime[dayIdx][hour].map(block => (
                            <motion.div
                              key={block._id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`p-2 rounded text-xs border cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(
                                block.priority,
                                block.isBreak
                              )}`}
                              onClick={() => !block.isBreak && handleMarkComplete(block._id)}
                              title={block.title}
                            >
                              <div className="font-semibold truncate">{block.title}</div>
                              <div className="text-xs opacity-75">{block.startTime}</div>
                              {block.status === 'completed' && (
                                <div className="text-green-600 font-bold">✓</div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Priority Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Urgent', color: 'bg-red-100 dark:bg-red-900' },
            { label: 'High', color: 'bg-orange-100 dark:bg-orange-900' },
            { label: 'Medium', color: 'bg-yellow-100 dark:bg-yellow-900' },
            { label: 'Low', color: 'bg-green-100 dark:bg-green-900' },
            { label: 'Break', color: 'bg-blue-100 dark:bg-blue-900' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WeeklyCalendarView;
