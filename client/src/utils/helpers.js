// Date formatting utilities
export const formatDate = (date, format = 'default') => {
  const d = new Date(date);
  
  const formats = {
    default: d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    short: d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    long: d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    datetime: d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    iso: d.toISOString(),
    relative: getRelativeTime(d),
  };

  return formats[format] || formats.default;
};

// Get relative time (e.g., "5 minutes ago")
export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  return `${months} month${months !== 1 ? 's' : ''} ago`;
};

// Check if date is today
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

// Check if date is overdue
export const isOverdue = (date) => {
  return new Date(date) < new Date() && !isToday(date);
};

// Get days until date
export const getDaysUntil = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Validation utilities
export const validators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },
  password: (value) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return regex.test(value);
  },
  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },
  minLength: (value, min) => {
    return value && value.length >= min;
  },
  maxLength: (value, max) => {
    return value && value.length <= max;
  },
};

// String utilities
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str, length = 50) => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Number utilities
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

export const percentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') return a[key] > b[key] ? 1 : -1;
    return a[key] < b[key] ? 1 : -1;
  });
};

export const uniqueBy = (array, key) => {
  return [...new Map(array.map(item => [item[key], item])).values()];
};

// Color utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const getContrastColor = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Mood/Wellness utilities
export const getMoodColor = (mood) => {
  const colors = {
    1: '#ef4444', // red
    2: '#f97316', // orange
    3: '#facc15', // yellow
    4: '#84cc16', // lime
    5: '#22c55e', // green
  };
  return colors[mood] || '#9ca3af';
};

export const getMoodLabel = (mood) => {
  const labels = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Great',
  };
  return labels[mood] || 'Unknown';
};

export const getStressLevel = (stress) => {
  if (stress >= 8) return { level: 'High', color: '#ef4444' };
  if (stress >= 5) return { level: 'Moderate', color: '#f97316' };
  return { level: 'Low', color: '#22c55e' };
};

export const calculateWellnessScore = (mood, energy, stress) => {
  // Normalize values: mood and energy are positive factors, stress is negative
  const moodScore = (mood / 5) * 40;  // Max 40 points
  const energyScore = (energy / 10) * 30;  // Max 30 points
  const stressScore = ((10 - stress) / 10) * 30;  // Max 30 points (inverse)
  
  return Math.round(moodScore + energyScore + stressScore);
};

// Local storage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export default {
  formatDate,
  getRelativeTime,
  isToday,
  isOverdue,
  getDaysUntil,
  validators,
  capitalize,
  truncate,
  slugify,
  formatNumber,
  clamp,
  percentage,
  groupBy,
  sortBy,
  uniqueBy,
  getMoodColor,
  getMoodLabel,
  getStressLevel,
  calculateWellnessScore,
  storage,
  debounce,
  throttle,
};
