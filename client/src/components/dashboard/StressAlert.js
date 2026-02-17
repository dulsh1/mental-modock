import React from 'react';
import Card from '../common/Card';

const StressAlert = ({ prediction, onDismiss, onTakeAction }) => {
  if (!prediction || prediction.probability < 0.6) {
    return null;
  }

  const getSeverityStyles = (probability) => {
    if (probability >= 0.8) {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
        border: 'border-red-500',
        icon: '🚨',
        level: 'High',
      };
    }
    if (probability >= 0.7) {
      return {
        bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
        border: 'border-orange-500',
        icon: '⚠️',
        level: 'Elevated',
      };
    }
    return {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-400',
      border: 'border-yellow-500',
      icon: '💡',
      level: 'Moderate',
    };
  };

  const severity = getSeverityStyles(prediction.probability);

  return (
    <Card className={`p-0 overflow-hidden border-l-4 ${severity.border}`}>
      {/* Header */}
      <div className={`${severity.bg} px-6 py-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{severity.icon}</span>
            <div>
              <h3 className="font-bold text-lg">Stress Alert</h3>
              <p className="text-white/80 text-sm">
                {severity.level} stress risk detected
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Probability meter */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Stress Probability</span>
            <span className="font-bold">{Math.round(prediction.probability * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${severity.bg} transition-all duration-500`}
              style={{ width: `${prediction.probability * 100}%` }}
            />
          </div>
        </div>

        {/* Contributing factors */}
        {prediction.factors && prediction.factors.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 dark:text-white mb-3">
              Contributing Factors
            </h4>
            <div className="space-y-2">
              {prediction.factors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-xl">{getFactorIcon(factor.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {factor.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {factor.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${getImpactColor(factor.impact)}`}>
                      {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {prediction.recommendations && prediction.recommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 dark:text-white mb-3">
              Recommended Actions
            </h4>
            <div className="space-y-2">
              {prediction.recommendations.slice(0, 3).map((rec, index) => (
                <button
                  key={index}
                  onClick={() => onTakeAction && onTakeAction(rec)}
                  className="w-full flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 
                             rounded-lg text-left hover:bg-primary-100 dark:hover:bg-primary-900/30 
                             transition-colors group"
                >
                  <span className="text-xl">{rec.icon || '💡'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {rec.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {rec.duration || 'Quick action'}
                    </p>
                  </div>
                  <svg 
                    className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onTakeAction && onTakeAction({ type: 'breathing' })}
            className={`flex-1 py-3 rounded-lg text-white font-medium ${severity.bg} 
                       hover:opacity-90 transition-opacity`}
          >
            Start Breathing Exercise
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 
                       text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 
                       transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Footer tip */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This prediction is based on your recent patterns. Early intervention can help prevent stress buildup.
        </p>
      </div>
    </Card>
  );
};

// Helper functions
const getFactorIcon = (type) => {
  const icons = {
    sleep: '😴',
    workload: '📋',
    mood: '😟',
    energy: '⚡',
    deadline: '⏰',
    pattern: '📊',
    default: '📌',
  };
  return icons[type] || icons.default;
};

const getImpactColor = (impact) => {
  if (impact >= 0.3) return 'text-red-500';
  if (impact >= 0.15) return 'text-orange-500';
  return 'text-yellow-500';
};

export default StressAlert;
