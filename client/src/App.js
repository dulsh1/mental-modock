import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/common/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MentalHealthLog from './pages/MentalHealthLog';
import Analytics from './pages/Analytics';
import Tasks from './pages/Tasks';
import TimeBlockingCalendar from './pages/TimeBlockingCalendar';
import WellnessCoach from './pages/WellnessCoach';
import Settings from './pages/Settings';
import GPACalculator from './pages/GPACalculator';
import GPAAnalytics from './pages/GPAAnalytics';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="log" element={<MentalHealthLog />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="schedule" element={<TimeBlockingCalendar />} />
              <Route path="wellness" element={<WellnessCoach />} />
              <Route path="gpa" element={<GPACalculator />} />
              <Route path="gpa/analytics" element={<GPAAnalytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
