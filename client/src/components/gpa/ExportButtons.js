import React, { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { gpaService } from '../../services/services';
import toast from 'react-hot-toast';

const ExportButtons = () => {
  const { token } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await gpaService.exportPDF(token);

      // response.data is already a blob when responseType is set to 'blob'
      const url = window.URL.createObjectURL(response.data);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gpa-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to export PDF');
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await gpaService.exportExcel(token);

      // response.data is already a blob when responseType is set to 'blob'
      const url = window.URL.createObjectURL(response.data);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gpa-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel exported successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to export Excel');
      console.error('Excel export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
        title="Export as PDF"
      >
        <DocumentArrowDownIcon className="w-5 h-5" />
        <span className="hidden sm:inline">PDF</span>
      </button>

      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
        title="Export as Excel"
      >
        <DocumentArrowDownIcon className="w-5 h-5" />
        <span className="hidden sm:inline">Excel</span>
      </button>
    </div>
  );
};

export default ExportButtons;
