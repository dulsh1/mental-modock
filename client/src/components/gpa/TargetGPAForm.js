import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import ProgressGauge from './ProgressGauge';

const TargetGPAForm = ({ isOpen, onClose, onSubmit, semesterId, initialData }) => {
  const [targetGPA, setTargetGPA] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTargetGPA(initialData.targetGPA || '');
    } else {
      setTargetGPA('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!targetGPA) {
      newErrors.targetGPA = 'Target GPA is required';
    } else {
      const gpa = parseFloat(targetGPA);
      if (isNaN(gpa) || gpa < 0 || gpa > 4.0) {
        newErrors.targetGPA = 'Target GPA must be between 0 and 4.0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setTargetGPA(e.target.value);
    if (errors.targetGPA) {
      setErrors(prev => ({
        ...prev,
        targetGPA: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        targetGPA: parseFloat(targetGPA),
        semesterId
      });
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to set goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  {initialData ? 'Update Target GPA' : 'Set Target GPA'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Target GPA Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target GPA (0.0 - 4.0) *
                    </label>
                    <input
                      type="number"
                      value={targetGPA}
                      onChange={handleChange}
                      placeholder="3.5"
                      step="0.1"
                      min="0"
                      max="4.0"
                      className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.targetGPA ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.targetGPA && <p className="text-red-500 text-xs mt-1">{errors.targetGPA}</p>}
                  </div>

                  {/* Help Text */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      📝 Set a realistic target GPA for this semester. You'll see recommendations for what grades you need to achieve your goal.
                    </p>
                  </div>

                  {/* Common Presets */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Select:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['3.0', '3.5', '3.8', '4.0'].map((gpa) => (
                        <button
                          key={gpa}
                          type="button"
                          onClick={() => {
                            setTargetGPA(gpa);
                            setErrors({});
                          }}
                          className={`px-2 py-2 rounded text-sm font-medium transition ${
                            targetGPA === gpa
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {gpa}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-md transition"
                    >
                      {isSubmitting ? 'Setting...' : 'Set Goal'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-medium py-2 rounded-md transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TargetGPAForm;
