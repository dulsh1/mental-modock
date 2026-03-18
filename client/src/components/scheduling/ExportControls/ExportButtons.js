import React, { useState } from 'react';
import Card from '../../../components/common/Card';
import { scheduleService } from '../../../services/services';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const ExportButtons = ({ schedule, currentDate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(null);

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportMonthlyPDF = async () => {
    try {
      setExporting('monthly');
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const filename = `monthly-schedule-${yearMonth}.pdf`;
      const response = await scheduleService.exportMonthlySchedulePDF({
        yearMonth
      });
      downloadFile(response.data, filename);
      toast.success('Monthly schedule exported!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No schedules found for this month');
      } else {
        toast.error('Failed to export monthly schedule');
      }
    } finally {
      setExporting(null);
    }
  };

  const handleExportMonthlyExcel = async () => {
    try {
      setExporting('monthly-excel');
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const filename = `monthly-schedule-${yearMonth}.xlsx`;
      const response = await scheduleService.exportMonthlyScheduleExcel({
        yearMonth
      });
      downloadFile(response.data, filename);
      toast.success('Monthly schedule exported to Excel!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No schedules found for this month');
      } else {
        toast.error('Failed to export monthly schedule to Excel');
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="btn-secondary flex items-center gap-2"
        disabled={!!exporting}
      >
        <ArrowDownTrayIcon className="w-5 h-5" />
        Export
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <button
            onClick={handleExportMonthlyPDF}
            disabled={exporting === 'monthly'}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting === 'monthly' ? 'Exporting...' : '📊 Monthly Overview'}
          </button>
          <button
            onClick={handleExportMonthlyExcel}
            disabled={exporting === 'monthly-excel'}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-t border-gray-200 dark:border-gray-700"
          >
            {exporting === 'monthly-excel' ? 'Exporting...' : '📗 Monthly Overview (Excel)'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButtons;
