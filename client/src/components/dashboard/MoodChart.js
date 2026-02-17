import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Card from '../common/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MoodChart = ({ data, period = 'week' }) => {
  // Default demo data if no data provided
  const defaultData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    mood: [3, 4, 3, 5, 4, 4, 5],
    energy: [4, 3, 4, 4, 5, 3, 4],
    stress: [5, 4, 6, 3, 4, 3, 2],
  };

  const chartData = data || defaultData;

  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Mood',
        data: chartData.mood,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(236, 72, 153)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Energy',
        data: chartData.energy,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const stressChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Stress Level',
        data: chartData.stress,
        backgroundColor: chartData.stress.map(val => 
          val >= 7 ? 'rgba(239, 68, 68, 0.7)' :
          val >= 4 ? 'rgba(251, 191, 36, 0.7)' :
          'rgba(34, 197, 94, 0.7)'
        ),
        borderColor: chartData.stress.map(val => 
          val >= 7 ? 'rgb(239, 68, 68)' :
          val >= 4 ? 'rgb(251, 191, 36)' :
          'rgb(34, 197, 94)'
        ),
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            const labels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Great'];
            return labels[value];
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.raw;
            let label = value >= 7 ? 'High' : value >= 4 ? 'Moderate' : 'Low';
            return `Stress: ${value}/10 (${label})`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Mood & Energy Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Mood & Energy Trends
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your emotional patterns over time
            </p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((p) => (
              <button
                key={p}
                className={`px-3 py-1 text-sm rounded-full transition-colors
                  ${period === p 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <Line data={lineChartData} options={lineOptions} />
        </div>
      </Card>

      {/* Stress Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Stress Levels
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor stress patterns and identify triggers
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Low (1-3)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              Moderate (4-6)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              High (7-10)
            </span>
          </div>
        </div>
        <div className="h-48">
          <Bar data={stressChartData} options={barOptions} />
        </div>
      </Card>
    </div>
  );
};

export default MoodChart;
