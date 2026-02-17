import api from './api';

// Mental Health Log Services
export const mentalHealthService = {
  createLog: (data) => api.post('/mental-health/log', data),
  getLogs: (params) => api.get('/mental-health/logs', { params }),
  getTodayLog: () => api.get('/mental-health/today'),
  getAnalytics: (days = 30) => api.get('/mental-health/analytics', { params: { days } }),
  getPrediction: () => api.get('/mental-health/predict'),
  deleteLog: (id) => api.delete(`/mental-health/log/${id}`)
};

// Task Services
export const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTodaysTasks: () => api.get('/tasks/today'),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  aiBreakdown: (taskDescription, estimatedHours) => 
    api.post('/tasks/ai-breakdown', { taskDescription, estimatedHours }),
  createWithBreakdown: (data) => api.post('/tasks/create-with-breakdown', data),
  autoSchedule: (taskIds, date) => api.post('/tasks/auto-schedule', { taskIds, date }),
  updateSubtask: (taskId, subtaskId, data) => 
    api.put(`/tasks/${taskId}/subtask/${subtaskId}`, data)
};

// Wellness Services
export const wellnessService = {
  getInterventions: () => api.get('/wellness/interventions'),
  getExercises: (params) => api.get('/wellness/exercises', { params }),
  getExercise: (id) => api.get(`/wellness/exercises/${id}`),
  startIntervention: (data) => api.post('/wellness/start', data),
  completeIntervention: (id, data) => api.put(`/wellness/complete/${id}`, data),
  dismissIntervention: (id, reason) => api.put(`/wellness/dismiss/${id}`, { reason }),
  getHistory: (params) => api.get('/wellness/history', { params }),
  getStats: () => api.get('/wellness/stats')
};

// Dashboard Services
export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
  getWeeklySummary: () => api.get('/dashboard/weekly-summary')
};

// Auth Services
export const authService = {
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};
