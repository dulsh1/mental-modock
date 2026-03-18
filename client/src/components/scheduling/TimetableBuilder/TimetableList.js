import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../../../components/common/Card';
import { scheduleService } from '../../../services/services';
import toast from 'react-hot-toast';
import { StarIcon, TrashIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

const TimetableList = ({ templates, onTemplateApplied }) => {
  const [applying, setApplying] = useState(null);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleApplyTemplate = async (templateId) => {
    if (!selectedWeek) {
      toast.error('Please select a week');
      return;
    }

    try {
      setApplying(templateId);
      await scheduleService.applyTemplate(templateId, {
        weekStartDate: selectedWeek,
        autoGenerateSchedule: true
      });
      toast.success('Template applied successfully!');
      onTemplateApplied();
      setShowApplyModal(false);
    } catch (error) {
      toast.error('Failed to apply template');
    } finally {
      setApplying(null);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;

    try {
      await scheduleService.deleteTemplate(templateId);
      toast.success('Template deleted');
      onTemplateApplied?.();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await scheduleService.setDefaultTemplate(templateId);
      toast.success('Template set as default');
      onTemplateApplied?.();
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  if (templates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-5xl mb-4">📅</div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No templates yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Create your first timetable template to start scheduling efficiently
        </p>
        <button className="btn-primary flex items-center gap-2 mx-auto">
          <PlusIcon className="w-5 h-5" />
          Create Template
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template, idx) => (
          <motion.div
            key={template._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 hover" hover>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      {template.name}
                    </h3>
                    {template.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {template.description}
                    </p>
                  )}
                </div>
                {template.rating?.score > 0 && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <StarIcon className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">
                      {template.rating.score.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <p className="text-gray-600 dark:text-gray-400">Type</p>
                  <p className="font-medium text-gray-800 dark:text-white capitalize">
                    {template.templateType}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <p className="text-gray-600 dark:text-gray-400">Usage</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {template.usageCount}x
                  </p>
                </div>
              </div>

              {template.weeklyWorkload && (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Weekly Workload</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {template.weeklyWorkload.totalHours}h total
                    ({template.weeklyWorkload.studyHours}h study)
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTemplateId(template._id);
                    setShowApplyModal(true);
                  }}
                  disabled={applying === template._id}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  {applying === template._id ? 'Applying...' : 'Apply'}
                </button>
                <button
                  onClick={() => handleSetDefault(template._id)}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Set as default"
                >
                  <StarIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template._id)}
                  className="px-3 py-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Apply Template Modal */}
      {showApplyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowApplyModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <Card className="w-full max-w-md p-6">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">
                Apply Template
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Select Week Start Date
                </label>
                <input
                  type="date"
                  value={selectedWeek}
                  onChange={e => setSelectedWeek(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!activeTemplateId) {
                      toast.error('No template selected');
                      return;
                    }
                    handleApplyTemplate(activeTemplateId);
                  }}
                  className="flex-1 px-4 py-2 btn-primary rounded-lg"
                >
                  Apply
                </button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TimetableList;
