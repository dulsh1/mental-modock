import React, { useState } from 'react';
import Card from '../common/Card';

const TaskForm = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    estimatedTime: task?.estimatedTime || '',
    tags: task?.tags?.join(', ') || '',
    category: task?.category || 'general',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (formData.estimatedTime && (isNaN(formData.estimatedTime) || formData.estimatedTime < 0)) {
      newErrors.estimatedTime = 'Invalid time estimate';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const processedData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
      };
      onSubmit(processedData);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {task ? 'Edit Task' : 'Create New Task'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What needs to be done?"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.title 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-200 dark:border-gray-600 focus:ring-primary-500'
            } bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent`}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add more details..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Priority and Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
            </select>
          </div>
        </div>

        {/* Due Date and Estimated Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              name="estimatedTime"
              value={formData.estimatedTime}
              onChange={handleChange}
              placeholder="e.g., 30"
              min="0"
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.estimatedTime 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-200 dark:border-gray-600 focus:ring-primary-500'
              } bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent`}
            />
            {errors.estimatedTime && (
              <p className="text-sm text-red-500 mt-1">{errors.estimatedTime}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., urgent, meeting, project"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Suggested Tags */}
        <div className="flex flex-wrap gap-2">
          {['urgent', 'work', 'personal', 'health', 'meeting', 'follow-up'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                if (!currentTags.includes(tag)) {
                  setFormData(prev => ({
                    ...prev,
                    tags: [...currentTags, tag].join(', ')
                  }));
                }
              }}
              className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 
                         text-gray-600 dark:text-gray-300 hover:bg-primary-100 
                         dark:hover:bg-primary-900/30 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                       text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
                       transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 
                       text-white font-medium hover:opacity-90 transition-opacity"
          >
            {task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default TaskForm;
