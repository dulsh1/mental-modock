const Schedule = require('../models/Schedule');
const TimetableTemplate = require('../models/TimetableTemplate');
const { scheduleExporter } = require('../services/export/scheduleExporter');

const toMinutes = (timeStr) => {
  const [h, m] = String(timeStr || '00:00').split(':').map(Number);
  return (Number.isNaN(h) ? 0 : h * 60) + (Number.isNaN(m) ? 0 : m);
};

const durationHours = (startTime, endTime) => {
  const mins = Math.max(0, toMinutes(endTime) - toMinutes(startTime));
  return mins / 60;
};


/**
 * Export a timetable template as PDF
 * POST /api/export/timetable-pdf/:templateId
 */
exports.exportTimetablePDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;
    const { timeFormat = '24h', includeDetails = true } = req.body;

    const template = await TimetableTemplate.findOne({
      _id: templateId,
      user: userId
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Generate PDF
    const doc = scheduleExporter.generateTimetablePDF(template, {
      timeFormat,
      includeDetails,
      colorCode: true,
      title: `${template.name} - Timetable`
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${template.name.replace(/\s+/g, '-')}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Error exporting timetable to PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export monthly schedule overview as PDF
 * POST /api/export/monthly-schedule-pdf
 */
exports.exportMonthlySchedulePDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const { yearMonth } = req.body; // Format: "2024-03"

    if (!yearMonth) {
      return res.status(400).json({
        success: false,
        message: 'Year-month is required'
      });
    }

    const [year, month] = yearMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const schedules = await Schedule.find({
      user: userId,
      weekStartDate: { $gte: monthStart, $lte: monthEnd },
      isArchived: false
    }).sort({ weekStartDate: 1 });

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No schedules found for this month'
      });
    }

    // Combine all schedules for the month
    let allTimeBlocks = [];
    schedules.forEach(schedule => {
      allTimeBlocks = allTimeBlocks.concat(schedule.timeBlocks);
    });

    // Create a temporary schedule object for exporting
    const tempSchedule = {
      weekStartDate: monthStart,
      weekEndDate: monthEnd,
      timeBlocks: allTimeBlocks,
      stats: {
        totalScheduledHours: allTimeBlocks
          .filter(b => !b.isBreak)
          .reduce((sum, b) => sum + durationHours(b.startTime, b.endTime), 0),
        totalBreakHours: allTimeBlocks
          .filter(b => b.isBreak)
          .reduce((sum, b) => sum + durationHours(b.startTime, b.endTime), 0),
        tasksScheduled: allTimeBlocks.filter(b => !b.isBreak).length
      }
    };

    // Generate PDF
    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const doc = scheduleExporter.generateSchedulePDF(tempSchedule, {
      timeFormat: '24h',
      includeDetails: true,
      colorCode: true,
      title: `Monthly Schedule Overview - ${monthName}`
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="monthly-schedule-${yearMonth}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Error exporting monthly schedule to PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export monthly schedule overview as Excel
 * POST /api/export/monthly-schedule-excel
 */
exports.exportMonthlyScheduleExcel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { yearMonth } = req.body;

    if (!yearMonth) {
      return res.status(400).json({
        success: false,
        message: 'Year-month is required'
      });
    }

    const [year, month] = yearMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const schedules = await Schedule.find({
      user: userId,
      weekStartDate: { $gte: monthStart, $lte: monthEnd },
      isArchived: false
    }).sort({ weekStartDate: 1 });

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No schedules found for this month'
      });
    }

    let allTimeBlocks = [];
    schedules.forEach(schedule => {
      allTimeBlocks = allTimeBlocks.concat(schedule.timeBlocks);
    });

    const tempSchedule = {
      weekStartDate: monthStart,
      weekEndDate: monthEnd,
      timeBlocks: allTimeBlocks,
      stats: {
        totalScheduledHours: allTimeBlocks
          .filter(b => !b.isBreak)
          .reduce((sum, b) => sum + durationHours(b.startTime, b.endTime), 0),
        totalBreakHours: allTimeBlocks
          .filter(b => b.isBreak)
          .reduce((sum, b) => sum + durationHours(b.startTime, b.endTime), 0),
        tasksScheduled: allTimeBlocks.filter(b => !b.isBreak).length
      }
    };

    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const workbook = await scheduleExporter.generateScheduleExcel(tempSchedule, {
      title: `Monthly Schedule Overview - ${monthName}`
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="monthly-schedule-${yearMonth}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting monthly schedule to Excel:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
