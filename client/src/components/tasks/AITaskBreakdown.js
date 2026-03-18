import React, { useState } from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { taskService } from '../../services/services';

const AITaskBreakdown = ({ task, onApply, onBreakdown, onClose, isLoading }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  // For standalone mode (when no task is provided)
  const [taskInput, setTaskInput] = useState({
    title: task?.title || '',
    description: task?.description || ''
  });

  // Get the current task (either from prop or input)
  const currentTask = task || (taskInput.title ? taskInput : null);

  const buildSubtaskState = (items = []) => items.map((st) => ({
    title: st.title,
    estimatedTime: st.estimatedTime || st.estimatedMinutes || 30,
    selected: st.selected ?? true,
    tips: st.tips || ''
  }));

  // Generate AI breakdown via backend with fallback mode.
  const generateBreakdown = async () => {
    if (!currentTask?.title) return;

    setGenerating(true);

    try {
      const prompt = `${currentTask.title}${currentTask.description ? `: ${currentTask.description}` : ''}`;
      const estimatedHours = task?.estimatedDuration
        ? Math.max(1, Math.round(task.estimatedDuration / 60))
        : undefined;

      const response = await taskService.aiBreakdown(prompt, estimatedHours);
      const breakdown = response?.data?.data || {};
      const aiSubtasks = buildSubtaskState(breakdown.subtasks || []);

      if (!aiSubtasks.length) {
        throw new Error('No subtasks generated');
      }

      setSubtasks(aiSubtasks);
      setGeneratedPlan({
        totalEstimatedTime: breakdown.totalEstimatedMinutes || aiSubtasks.reduce((sum, st) => sum + st.estimatedTime, 0),
        complexity: aiSubtasks.length >= 6 ? 'High' : aiSubtasks.length >= 4 ? 'Medium' : 'Low',
        suggestedApproach: breakdown.suggestions || 'Review and customize the generated subtasks before applying.'
      });
    } catch (error) {
      const mockSubtasks = buildSubtaskState(generateMockSubtasks(currentTask.title, currentTask.description));
      setSubtasks(mockSubtasks);
      setGeneratedPlan({
        totalEstimatedTime: mockSubtasks.reduce((sum, st) => sum + st.estimatedTime, 0),
        complexity: 'Medium',
        suggestedApproach: 'Using offline fallback suggestions. Edit these subtasks as needed before applying.'
      });
      toast.error('AI service unavailable, showing fallback suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const generateMockSubtasks = (title, description) => {
    const withRandomOrder = (items) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // Simple mock logic - in real app, this comes from AI
    const baseSubtasks = [
      { title: 'Research and gather requirements', estimatedTime: 30, selected: true },
      { title: 'Create initial outline/plan', estimatedTime: 20, selected: true },
      { title: 'Work on core implementation', estimatedTime: 60, selected: true },
      { title: 'Review and refine', estimatedTime: 20, selected: true },
      { title: 'Final touches and documentation', estimatedTime: 15, selected: true },
    ];

    const titleLower = (title || '').toLowerCase();

    // Customize based on task content
    if (titleLower.includes('report')) {
      return withRandomOrder([
        { title: 'Gather data and sources', estimatedTime: 30, selected: true },
        { title: 'Create report outline', estimatedTime: 15, selected: true },
        { title: 'Write introduction', estimatedTime: 20, selected: true },
        { title: 'Write main content sections', estimatedTime: 45, selected: true },
        { title: 'Create visualizations/charts', estimatedTime: 25, selected: true },
        { title: 'Write conclusion', estimatedTime: 15, selected: true },
        { title: 'Proofread and format', estimatedTime: 20, selected: true },
      ]);
    }

    if (titleLower.includes('meeting') || titleLower.includes('presentation')) {
      return withRandomOrder([
        { title: 'Define meeting objectives', estimatedTime: 10, selected: true },
        { title: 'Create agenda', estimatedTime: 15, selected: true },
        { title: 'Prepare presentation slides', estimatedTime: 40, selected: true },
        { title: 'Gather supporting materials', estimatedTime: 20, selected: true },
        { title: 'Practice/rehearse', estimatedTime: 15, selected: true },
        { title: 'Send meeting invites', estimatedTime: 5, selected: true },
      ]);
    }

    if (titleLower.includes('study') || titleLower.includes('learn')) {
      return withRandomOrder([
        { title: 'Review learning objectives', estimatedTime: 10, selected: true },
        { title: 'Read primary materials', estimatedTime: 45, selected: true },
        { title: 'Take notes and summarize', estimatedTime: 25, selected: true },
        { title: 'Practice with exercises', estimatedTime: 30, selected: true },
        { title: 'Self-test and review', estimatedTime: 20, selected: true },
      ]);
    }

    return withRandomOrder(baseSubtasks);
  };

  const toggleSubtask = (index) => {
    setSubtasks(prev => prev.map((st, i) => 
      i === index ? { ...st, selected: !st.selected } : st
    ));
  };

  const updateSubtaskField = (index, field, value) => {
    setSubtasks(prev => prev.map((st, i) => {
      if (i !== index) return st;

      if (field === 'estimatedTime') {
        const minutes = Number(value);
        return { ...st, estimatedTime: Number.isNaN(minutes) ? 0 : Math.max(0, minutes) };
      }

      return { ...st, [field]: value };
    }));
  };

  const handleApply = () => {
    const selectedSubtasks = subtasks
      .filter(st => st.selected)
      .map(st => ({
        ...st,
        title: st.title.trim(),
        estimatedTime: Number(st.estimatedTime) || 0
      }))
      .filter(st => st.title.length > 0);

    if (!selectedSubtasks.length) {
      toast.error('Select at least one valid subtask to apply');
      return;
    }

    // Support both callback names
    const breakdownPayload = {
      sourceTask: {
        title: currentTask?.title || '',
        description: currentTask?.description || ''
      },
      subtasks: selectedSubtasks
    };

    if (onApply) {
      onApply(breakdownPayload);
    } else if (onBreakdown) {
      onBreakdown(breakdownPayload);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                AI Task Breakdown
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Let AI help you break down complex tasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task Input (if no task prop provided) */}
        {!task && !subtasks.length && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={taskInput.title}
                onChange={(e) => setTaskInput({ ...taskInput, title: e.target.value })}
                placeholder="e.g., Complete project report"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={taskInput.description}
                onChange={(e) => setTaskInput({ ...taskInput, description: e.target.value })}
                placeholder="Add more details about the task..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* Task Info (if task prop provided) */}
        {task && !subtasks.length && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
            <h4 className="font-medium text-gray-800 dark:text-white">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
            )}
          </div>
        )}

        {/* Generate Button or Results */}
        {!subtasks.length && (
          <div className="text-center py-8">
            {generating ? (
              <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-500 dark:text-gray-400">
                  AI is analyzing your task and creating subtasks...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <span className="text-6xl">🧠</span>
                </div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  Ready to break down your task?
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Our AI will analyze your task and suggest manageable subtasks with time estimates.
                </p>
                <button
                  onClick={generateBreakdown}
                  disabled={!currentTask?.title}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                             font-medium rounded-lg hover:opacity-90 transition-opacity
                             flex items-center gap-2 mx-auto
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Breakdown
                </button>
              </>
            )}
          </div>
        )}

        {/* Generated Subtasks */}
        {subtasks.length > 0 && (
          <>
            {/* Task being broken down */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              <h4 className="font-medium text-gray-800 dark:text-white">{currentTask?.title}</h4>
              {currentTask?.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentTask.description}</p>
              )}
            </div>

            {/* Plan Summary */}
            {generatedPlan && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {subtasks.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Subtasks</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {generatedPlan.totalEstimatedTime}m
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Time</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {generatedPlan.complexity}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complexity</p>
                </div>
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Select subtasks to add:
              </p>
              {subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition-all
                    ${subtask.selected 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500' 
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={subtask.selected}
                    onChange={() => toggleSubtask(index)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(e) => updateSubtaskField(index, 'title', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={subtask.estimatedTime}
                      onChange={(e) => updateSubtaskField(index, 'estimatedTime', e.target.value)}
                      className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">m</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Regenerate button */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={generateBreakdown}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate suggestions
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                           text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
                           transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!subtasks.some(st => st.selected)}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 
                           text-white font-medium hover:opacity-90 transition-opacity
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply {subtasks.filter(st => st.selected).length} Subtasks
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AITaskBreakdown;
