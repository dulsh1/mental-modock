import api from './api';

// Mental Health Log Services
export const mentalHealthService = {
  createLog: (data) => api.post('/mental-health/log', data),
  // Backend upserts today's log on POST /log, so update can use same endpoint.
  updateLog: (id, data) => api.post('/mental-health/log', data),
  getLogs: (params) => api.get('/mental-health/logs', { params }),
  getRecentLogs: (limit = 7) => api.get('/mental-health/logs', { params: { limit } }),
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

// GPA Calculator Services
export const gpaService = {
  // Semester endpoints
  getSemesters: (token) => api.get('/gpa/semesters'),
  getSemester: (id) => api.get(`/gpa/semesters/${id}`),
  createSemester: (data, token) => api.post('/gpa/semesters', data),
  updateSemester: (id, data, token) => api.put(`/gpa/semesters/${id}`, data),
  deleteSemester: (id, token) => api.delete(`/gpa/semesters/${id}`),
  getSemesterGPA: (semesterId, token) => api.get(`/gpa/semester-gpa/${semesterId}`),

  // Course endpoints
  getCourses: (semesterId, token) => api.get(`/gpa/semesters/${semesterId}/courses`),
  getCourse: (id) => api.get(`/gpa/courses/${id}`),
  createCourse: (semesterId, data, token) => api.post(`/gpa/semesters/${semesterId}/courses`, data),
  updateCourse: (id, data, token) => api.put(`/gpa/courses/${id}`, data),
  deleteCourse: (id, token) => api.delete(`/gpa/courses/${id}`),

  // Calculation endpoints
  getCGPA: (token) => api.get('/gpa/cgpa'),
  getWhatIf: (data, token) => api.post('/gpa/whatif', data),
  getAnalytics: (token) => api.get('/gpa/analytics'),
  getSemesterAnalytics: (semesterId, token) => api.get(`/gpa/semesters/${semesterId}/analytics`),

  // Goal endpoints
  setGoal: (semesterId, data, token) => api.post(`/gpa/goals/${semesterId}`, data),
  getGoal: (semesterId, token) => api.get(`/gpa/goals/${semesterId}`),
  updateGoal: (semesterId, data, token) => api.put(`/gpa/goals/${semesterId}`, data),
  deleteGoal: (semesterId, token) => api.delete(`/gpa/goals/${semesterId}`),
  getRecommendations: (semesterId, token) => api.get(`/gpa/semesters/${semesterId}/goals/recommendations`),

  // Export endpoints
  exportPDF: (token) => api.post('/gpa/export/pdf', {}, { responseType: 'blob' }),
  exportExcel: (token) => api.post('/gpa/export/excel', {}, { responseType: 'blob' })
};

// Schedule Services
export const scheduleService = {
  // Schedule endpoints
  generateSchedule: (data) => api.post('/schedules/generate', data),
  generateDailyOptimized: (data) => api.post('/schedules/daily/generate', data),
  getWeeklySchedule: (weekStartDate) => api.get(`/schedules/week/${weekStartDate}`),
  getMonthlySchedule: (yearMonth) => api.get(`/schedules/month/${yearMonth}`),
  getSchedules: (params) => api.get('/schedules', { params }),
  addTimeBlock: (scheduleId, data) => api.post(`/schedules/${scheduleId}/timeblock`, data),
  updateTimeBlock: (scheduleId, blockId, data) =>
    api.put(`/schedules/${scheduleId}/timeblock/${blockId}`, data),
  deleteTimeBlock: (scheduleId, blockId) => api.delete(`/schedules/${scheduleId}/timeblock/${blockId}`),
  getSuggestedSchedules: (scheduleId) => api.get(`/schedules/${scheduleId}/suggestions`),
  archiveSchedule: (scheduleId) => api.put(`/schedules/${scheduleId}/archive`, {}),
  deleteSchedule: (scheduleId) => api.delete(`/schedules/${scheduleId}`),

  // Template endpoints
  createTemplate: (data) => api.post('/templates', data),
  getTemplates: (params) => api.get('/templates', { params }),
  getTemplate: (id) => api.get(`/templates/${id}`),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  setDefaultTemplate: (id) => api.post(`/templates/${id}/set-default`, {}),
  applyTemplate: (id, data) => api.post(`/templates/${id}/apply`, data),
  addTimeSlot: (id, data) => api.post(`/templates/${id}/slots`, data),
  removeTimeSlot: (id, slotId) => api.delete(`/templates/${id}/slots/${slotId}`),
  rateTemplate: (id, data) => api.post(`/templates/${id}/rate`, data),
  getTemplateSuggestions: (templateType) => api.get(`/templates/suggestions/${templateType}`),

  // Export endpoints
  exportTimetablePDF: (templateId, data) =>
    api.post(`/export/timetable-pdf/${templateId}`, data, { responseType: 'blob' }),
  exportMonthlySchedulePDF: (data) =>
    api.post('/export/monthly-schedule-pdf', data, { responseType: 'blob' }),
  exportMonthlyScheduleExcel: (data) =>
    api.post('/export/monthly-schedule-excel', data, { responseType: 'blob' })
};

// Auth Services
export const authService = {
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};
