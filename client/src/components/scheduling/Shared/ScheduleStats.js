import React from 'react';
import Card from '../../../components/common/Card';
import { ClockIcon, CheckIcon, PauseIcon } from '@heroicons/react/24/outline';

const ScheduleStats = ({ stats }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Schedule Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-center mb-2">
            <ClockIcon className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.totalScheduledHours}h
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-center mb-2">
            <PauseIcon className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.totalBreakHours}h
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Breaks</p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-center mb-2">
            <CheckIcon className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.tasksScheduled}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tasks</p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-center mb-2">
            <div className="text-xl font-bold text-orange-600">%</div>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.workloadPercentage}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Workload</p>
        </div>
      </div>

      {stats.workloadPercentage > 85 && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            ⚠️ High workload detected. Consider spreading tasks across more days.
          </p>
        </div>
      )}
    </Card>
  );
};

export default ScheduleStats;
