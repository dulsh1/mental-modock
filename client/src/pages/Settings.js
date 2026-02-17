import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import { authService } from '../services/services';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { register: registerProfile, handleSubmit: handleSubmitProfile } = useForm({
    defaultValues: {
      name: user?.name || '',
      pomodoroWork: user?.preferences?.pomodoroSettings?.workDuration || 25,
      pomodoroShortBreak: user?.preferences?.pomodoroSettings?.shortBreak || 5,
      pomodoroLongBreak: user?.preferences?.pomodoroSettings?.longBreak || 15
    }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword } = useForm();

  const onSaveProfile = async (data) => {
    setSaving(true);
    try {
      const response = await authService.updateProfile({
        name: data.name,
        preferences: {
          pomodoroSettings: {
            workDuration: parseInt(data.pomodoroWork),
            shortBreak: parseInt(data.pomodoroShortBreak),
            longBreak: parseInt(data.pomodoroLongBreak)
          }
        }
      });
      updateUser(response.data.data);
      toast.success('Settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed!');
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Settings ⚙️
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize your experience
        </p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile
          </h2>
          <form onSubmit={handleSubmitProfile(onSaveProfile)} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                {...registerProfile('name')}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input bg-gray-100 dark:bg-gray-600"
                value={user?.email}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      </motion.div>

      {/* Theme Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', icon: '☀️' },
              { id: 'dark', label: 'Dark', icon: '🌙' },
              { id: 'system', label: 'System', icon: '💻' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.label}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Pomodoro Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pomodoro Timer
          </h2>
          <form onSubmit={handleSubmitProfile(onSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Work (min)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="60"
                  {...registerProfile('pomodoroWork')}
                />
              </div>
              <div>
                <label className="label">Short Break (min)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="30"
                  {...registerProfile('pomodoroShortBreak')}
                />
              </div>
              <div>
                <label className="label">Long Break (min)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="60"
                  {...registerProfile('pomodoroLongBreak')}
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Timer Settings'}
            </button>
          </form>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Change Password
          </h2>
          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input"
                {...registerPassword('currentPassword', { required: true })}
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                {...registerPassword('newPassword', { required: true, minLength: 6 })}
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                {...registerPassword('confirmPassword', { required: true })}
              />
            </div>
            <button type="submit" disabled={savingPassword} className="btn-primary">
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{user?.stats?.totalLogs || 0}</p>
              <p className="text-primary-100 text-sm">Total Logs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{user?.stats?.totalTasksCompleted || 0}</p>
              <p className="text-primary-100 text-sm">Tasks Done</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{user?.stats?.currentStreak || 0}</p>
              <p className="text-primary-100 text-sm">Current Streak</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{user?.stats?.longestStreak || 0}</p>
              <p className="text-primary-100 text-sm">Best Streak</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Settings;
