import React from 'react';

const ProgressGauge = ({ current, target, label, size = 'md' }) => {
  let radius, cx, cy, fontSize, strokeWidth;

  switch (size) {
    case 'sm':
      radius = 40;
      cx = cy = 50;
      fontSize = '12px';
      strokeWidth = 3;
      break;
    case 'lg':
      radius = 70;
      cx = cy = 80;
      fontSize = '18px';
      strokeWidth = 4;
      break;
    case 'md':
    default:
      radius = 55;
      cx = cy = 65;
      fontSize = '16px';
      strokeWidth = 3;
  }

  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((current / (target || 4.0)) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (current, target) => {
    const ratio = current / (target || 4.0);
    if (ratio >= 0.9) return '#10b981'; // green
    if (ratio >= 0.75) return '#3b82f6'; // blue
    if (ratio >= 0.5) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getColorCSS = (current, target) => {
    const ratio = current / (target || 4.0);
    if (ratio >= 0.9) return 'text-green-600 dark:text-green-400';
    if (ratio >= 0.75) return 'text-blue-600 dark:text-blue-400';
    if (ratio >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div style={{ position: 'relative', width: cx * 2, height: cy * 2 }}>
        <svg width={cx * 2} height={cy * 2} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            className="dark:stroke-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={getColor(current, target)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <div className={`text-2xl font-bold ${getColorCSS(current, target)}`}
            style={{ fontSize: 'clamp(16px, 4vw, 24px)' }}>
            {current.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            of {(target || 4.0).toFixed(2)}
          </div>
        </div>
      </div>

      {label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">
          {label}
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {percentage.toFixed(1)}% complete
      </p>
    </div>
  );
};

export default ProgressGauge;
