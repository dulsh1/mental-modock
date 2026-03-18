const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Service for exporting schedules and timetables to PDF
 */
class ScheduleExporter {
  constructor() {
    this.theme = {
      primary: '#0B5FFF',
      primaryLight: '#E8F0FF',
      accent: '#0EA5A4',
      headerText: '#0F172A',
      mutedText: '#475569',
      border: '#CBD5E1',
      white: '#FFFFFF',
      priority: {
        urgent: '#DC2626',
        high: '#EA580C',
        medium: '#CA8A04',
        low: '#16A34A',
        break: '#2563EB'
      }
    };
  }

  /**
   * Generate PDF for a schedule
   * @param {Object} schedule - Schedule document
   * @param {Object} options - Export options
   * @returns {Stream} - PDF document stream
   */
  generateSchedulePDF(schedule, options = {}) {
    const {
      timeFormat = '24h',
      includeDetails = true,
      colorCode = true,
      title = 'Weekly Schedule'
    } = options;

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40
    });

    this.drawHeaderBand(doc, title, `Week of ${this.formatDateRange(schedule.weekStartDate, schedule.weekEndDate)}`);
    doc.moveDown();

    // Add summary
    if (schedule.stats) {
      this.addScheduleSummary(doc, schedule);
    }

    doc.moveDown();

    // Add daily schedule
    const groupedByDay = this.groupTimeBlocksByDay(schedule.timeBlocks);
    for (const date in groupedByDay) {
      this.addDaySchedule(doc, date, groupedByDay[date], timeFormat, colorCode, includeDetails);
      doc.moveDown();
    }

    // Add legend
    if (colorCode) {
      this.addPriorityLegend(doc);
    }

    // Add footer
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').fillColor(this.theme.mutedText).text(
      `Generated on ${new Date().toLocaleString()}`,
      { align: 'center', textAlignment: 'center' }
    );

    return doc;
  }

  /**
   * Generate PDF for a timetable template
   * @param {Object} template - TimetableTemplate document
   * @param {Object} options - Export options
   * @returns {Stream} - PDF document stream
   */
  generateTimetablePDF(template, options = {}) {
    const {
      timeFormat = '24h',
      includeDetails = true,
      colorCode = true
    } = options;

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40
    });

    this.drawHeaderBand(doc, template.name, template.description || 'Timetable Template');
    doc.fontSize(9).font('Helvetica').fillColor(this.theme.mutedText).text(
      `Template Type: ${template.templateType} | Usage Count: ${template.usageCount}`,
      { align: 'center' }
    );
    doc.moveDown();

    // Add preferred hours
    if (template.preferredHours && template.preferredHours.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(this.theme.headerText).text('Preferred Hours');
      template.preferredHours.forEach(pref => {
        doc.fontSize(9).fillColor(this.theme.mutedText).text(
          `  • ${pref.subjectName}: ${pref.totalHours}h (${pref.frequency})`,
          { indent: 20 }
        );
      });
      doc.moveDown();
    }

    // Add weekly workload
    if (template.weeklyWorkload) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(this.theme.headerText).text('Weekly Workload');
      doc.fontSize(9).fillColor(this.theme.mutedText).text(
        `  • Total: ${template.weeklyWorkload.totalHours}h (Study: ${template.weeklyWorkload.studyHours}h, Breaks: ${template.weeklyWorkload.breakHours}h)`,
        { indent: 20 }
      );
      doc.moveDown();
    }

    // Create weekly schedule table
    this.addTimetableTable(doc, template, timeFormat);

    // Add break schedule info
    if (template.schedulePattern && template.schedulePattern.breakSchedule) {
      doc.moveDown();
      doc.fontSize(11).font('Helvetica-Bold').fillColor(this.theme.headerText).text('Break Schedule');
      const breaks = template.schedulePattern.breakSchedule;
      doc.fontSize(9).fillColor(this.theme.mutedText).text(
        `  • Short breaks: ${breaks.shortBreakDuration} min every ${breaks.longBreakAfter} min of work`,
        { indent: 20 }
      );
      doc.fontSize(9).fillColor(this.theme.mutedText).text(
        `  • Long breaks: ${breaks.longBreakDuration} min`,
        { indent: 20 }
      );
    }

    // Add footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor(this.theme.mutedText).text(
      `Generated on ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    return doc;
  }

  async generateScheduleExcel(schedule, options = {}) {
    const { title = 'Weekly Schedule' } = options;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mental Modock';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Summary', { views: [{ showGridLines: false }] });
    this.buildScheduleSummarySheet(summarySheet, schedule, title);

    const detailsSheet = workbook.addWorksheet('Time Blocks');
    this.buildScheduleDetailsSheet(detailsSheet, schedule);

    return workbook;
  }

  async generateTimetableExcel(template) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mental Modock';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Template Summary', { views: [{ showGridLines: false }] });
    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = template.name;
    summarySheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF0F172A' } };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    const rows = [
      ['Description', template.description || 'N/A'],
      ['Template Type', template.templateType || 'custom'],
      ['Usage Count', template.usageCount || 0],
      ['Exported On', new Date().toLocaleString()]
    ];
    rows.forEach((row, idx) => {
      const line = idx + 3;
      summarySheet.getCell(`A${line}`).value = row[0];
      summarySheet.getCell(`B${line}`).value = row[1];
      summarySheet.getCell(`A${line}`).font = { bold: true, color: { argb: 'FF334155' } };
      summarySheet.getCell(`B${line}`).font = { color: { argb: 'FF0F172A' } };
    });
    summarySheet.getColumn('A').width = 22;
    summarySheet.getColumn('B').width = 45;

    const slotsSheet = workbook.addWorksheet('Weekly Pattern');
    slotsSheet.columns = [
      { header: 'Day', key: 'day', width: 14 },
      { header: 'Start', key: 'startTime', width: 10 },
      { header: 'End', key: 'endTime', width: 10 },
      { header: 'Activity', key: 'activity', width: 30 },
      { header: 'Type', key: 'activityType', width: 14 }
    ];

    this.styleExcelHeaderRow(slotsSheet.getRow(1));

    const dayMap = {
      0: 'Monday',
      1: 'Tuesday',
      2: 'Wednesday',
      3: 'Thursday',
      4: 'Friday',
      5: 'Saturday',
      6: 'Sunday'
    };

    (template.schedulePattern?.timeSlots || []).forEach((slot) => {
      const row = slotsSheet.addRow({
        day: dayMap[slot.dayOfWeek] || String(slot.dayOfWeek),
        startTime: slot.startTime,
        endTime: slot.endTime,
        activity: slot.activity || '-',
        activityType: slot.activityType || 'study'
      });
      const isBreak = (slot.activityType || '').toLowerCase() === 'break';
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isBreak ? 'FFEFF6FF' : 'FFFFFFFF' }
      };
    });

    slotsSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          left: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          bottom: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          right: { style: 'thin', color: { argb: 'FFD6DEE8' } }
        };
      });
    });

    return workbook;
  }

  // Helper methods

  formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  groupTimeBlocksByDay(timeBlocks) {
    const grouped = {};
    timeBlocks.forEach(block => {
      const dateStr = new Date(block.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(block);
    });

    return grouped;
  }

  addScheduleSummary(doc, schedule) {
    const startX = doc.x;
    const startY = doc.y;
    const boxHeight = 78;

    doc.roundedRect(startX, startY, 515, boxHeight, 8)
      .fillAndStroke(this.theme.primaryLight, this.theme.border);

    doc.fillColor(this.theme.headerText).fontSize(11).font('Helvetica-Bold').text('Schedule Summary', startX + 12, startY + 10);

    const stats = schedule.stats;
    doc.fontSize(9).font('Helvetica').fillColor(this.theme.mutedText);

    const summaryData = [
      `Total Scheduled Hours: ${stats.totalScheduledHours || 0}h`,
      `Total Break Hours: ${stats.totalBreakHours || 0}h`,
      `Tasks Scheduled: ${stats.tasksScheduled || 0}`,
      `Workload: ${stats.workloadPercentage || 0}% of available time`
    ];

    summaryData.forEach((item, idx) => {
      doc.text(`• ${item}`, startX + 20, startY + 30 + (idx * 10));
    });

    doc.moveDown(5);
  }

  addDaySchedule(doc, dateStr, timeBlocks, timeFormat, colorCode, includeDetails) {
    doc.roundedRect(doc.x, doc.y, 515, 20, 5)
      .fillAndStroke(this.theme.primary, this.theme.primary);
    doc.fillColor(this.theme.white).fontSize(11).font('Helvetica-Bold').text(dateStr, doc.x + 10, doc.y + 5);
    doc.moveDown(1.6);

    if (timeBlocks.length === 0) {
      doc.fillColor(this.theme.mutedText).fontSize(9).text('No scheduled tasks', { indent: 20 });
      return;
    }

    // Sort by start time
    const sorted = [...timeBlocks].sort((a, b) => {
      const aMin = this.timeStringToMinutes(a.startTime);
      const bMin = this.timeStringToMinutes(b.startTime);
      return aMin - bMin;
    });

    sorted.forEach(block => {
      const timeStr = this.formatTimeRange(block.startTime, block.endTime, timeFormat);
      const hours = this.calculateHours(block.startTime, block.endTime);

      let taskInfo = `${timeStr} - ${block.title}`;

      if (includeDetails && block.task) {
        taskInfo += ` (${hours}h)`;
      }

      const color = this.getPriorityColor(block.priority, block.isBreak);
      doc.fontSize(9).font('Helvetica').fillColor(color).text(taskInfo, {
        indent: 20,
        continued: false
      });

      // Add status indicator
      if (block.status !== 'scheduled') {
        const statusEmoji = block.status === 'completed' ? '✓' : '➜';
        doc.fontSize(8).fillColor(this.theme.mutedText).text(`${statusEmoji} ${block.status}`, {
          indent: 40,
          continued: false
        });
      }
    });

    doc.fillColor(this.theme.headerText);
  }

  addPriorityLegend(doc) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor(this.theme.headerText).text('Priority Legend');

    const priorities = [
      { label: 'Urgent', color: 'FF0000' },
      { label: 'High', color: 'FF6600' },
      { label: 'Medium', color: 'FFCC00' },
      { label: 'Low', color: '00CC00' },
      { label: 'Break', color: '6699FF' }
    ];

    priorities.forEach(priority => {
      doc.fontSize(8)
        .fillColor(priority.color)
        .text(`■ ${priority.label}`, { indent: 20 })
        .fillColor(this.theme.headerText);
    });
  }

  addTimetableTable(doc, template, timeFormat) {
    const slots = template.schedulePattern.timeSlots;
    if (!slots || slots.length === 0) return;

    // Group by day
    const dayMap = {
      0: 'Monday',
      1: 'Tuesday',
      2: 'Wednesday',
      3: 'Thursday',
      4: 'Friday',
      5: 'Saturday',
      6: 'Sunday'
    };

    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').fillColor(this.theme.headerText).text('Weekly Schedule Pattern');
    doc.moveDown(0.5);

    let y = doc.y;
    const colWidth = 72;
    const rowHeight = 40;

    // Headers
    const days = [0, 1, 2, 3, 4, 5, 6];
    days.forEach((day, idx) => {
      doc.rect(40 + idx * colWidth, y - 2, colWidth - 4, 18).fillAndStroke(this.theme.primary, this.theme.primary);
      doc.fillColor(this.theme.white).fontSize(8).font('Helvetica-Bold').text(dayMap[day], {
        x: 40 + idx * colWidth,
        y: y + 3,
        width: colWidth - 4,
        align: 'center',
        valign: 'center'
      });
    });
    doc.fillColor(this.theme.headerText);

    // Get all unique time slots
    const uniqueSlots = this.getUniqueTimeSlots(slots);
    uniqueSlots.forEach((timeSlot) => {
      y += rowHeight;

      // Time label
      const timeStr = this.formatTimeRange(timeSlot.start, timeSlot.end, timeFormat);
      doc.fontSize(8).fillColor(this.theme.mutedText).text(timeStr, {
        x: 0,
        y: y,
        width: 35,
        align: 'right'
      });

      // Slots for each day
      days.forEach((day, idx) => {
        const daySlots = slots.filter(s =>
          s.dayOfWeek === day &&
          s.startTime === timeSlot.start
        );

        const activity = daySlots.length > 0 ? daySlots[0].activity : '-';
        const bgColor = daySlots.length > 0 && daySlots[0].activityType === 'break'
          ? 'E8F4F8'
          : 'FFFFFF';

        doc.rect(40 + idx * colWidth, y - 8, colWidth - 4, rowHeight - 12)
          .fillAndStroke(bgColor, this.theme.border);

        doc.fillColor(this.theme.headerText).fontSize(7).text(activity, {
          x: 40 + idx * colWidth + 5,
          y: y - 3,
          width: colWidth - 13,
          height: rowHeight - 15,
          align: 'center',
          valign: 'center'
        });
      });
    });
  }

  getUniqueTimeSlots(slots) {
    const unique = {};
    slots.forEach(slot => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!unique[key]) {
        unique[key] = {
          start: slot.startTime,
          end: slot.endTime
        };
      }
    });

    return Object.values(unique).sort((a, b) => {
      const aMin = this.timeStringToMinutes(a.start);
      const bMin = this.timeStringToMinutes(b.start);
      return aMin - bMin;
    });
  }

  drawHeaderBand(doc, title, subtitle) {
    const startY = doc.y;
    doc.roundedRect(40, startY, 515, 54, 10)
      .fillAndStroke(this.theme.primary, this.theme.primary);
    doc.fillColor(this.theme.white).fontSize(18).font('Helvetica-Bold').text(title, 40, startY + 10, {
      align: 'center',
      width: 515
    });
    doc.fontSize(10).font('Helvetica').text(subtitle, 40, startY + 33, {
      align: 'center',
      width: 515
    });
    doc.moveDown(3.2);
    doc.fillColor(this.theme.headerText);
  }

  buildScheduleSummarySheet(sheet, schedule, title) {
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { size: 20, bold: true, color: { argb: 'FF0F172A' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:E2');
    sheet.getCell('A2').value = `Period: ${this.formatDateRange(schedule.weekStartDate, schedule.weekEndDate)}`;
    sheet.getCell('A2').font = { size: 11, color: { argb: 'FF475569' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    const stats = schedule.stats || {};
    const statsRows = [
      ['Total Scheduled Hours', stats.totalScheduledHours || 0],
      ['Total Break Hours', stats.totalBreakHours || 0],
      ['Tasks Scheduled', stats.tasksScheduled || 0],
      ['Workload %', `${stats.workloadPercentage || 0}%`],
      ['Generated On', new Date().toLocaleString()]
    ];

    statsRows.forEach((entry, idx) => {
      const rowIndex = idx + 4;
      sheet.getCell(`A${rowIndex}`).value = entry[0];
      sheet.getCell(`B${rowIndex}`).value = entry[1];
      sheet.getCell(`A${rowIndex}`).font = { bold: true, color: { argb: 'FF334155' } };
      sheet.getCell(`B${rowIndex}`).font = { color: { argb: 'FF0F172A' } };
    });

    sheet.columns = [
      { key: 'label', width: 30 },
      { key: 'value', width: 20 },
      { key: 'spacer1', width: 14 },
      { key: 'spacer2', width: 14 },
      { key: 'spacer3', width: 14 }
    ];

  }

  buildScheduleDetailsSheet(sheet, schedule) {
    sheet.columns = [
      { header: 'Date', key: 'date', width: 18 },
      { header: 'Start', key: 'startTime', width: 10 },
      { header: 'End', key: 'endTime', width: 10 },
      { header: 'Duration (h)', key: 'duration', width: 12 },
      { header: 'Title', key: 'title', width: 34 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Linked Task', key: 'linkedTask', width: 14 },
      { header: 'Notes', key: 'notes', width: 28 }
    ];

    this.styleExcelHeaderRow(sheet.getRow(1));

    const sorted = [...(schedule.timeBlocks || [])].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da !== db) return da - db;
      return this.timeStringToMinutes(a.startTime) - this.timeStringToMinutes(b.startTime);
    });

    sorted.forEach((block) => {
      const duration = this.calculateHours(block.startTime, block.endTime);
      const title = block.task?.title || block.title || 'Untitled';
      const row = sheet.addRow({
        date: new Date(block.date).toLocaleDateString(),
        startTime: block.startTime,
        endTime: block.endTime,
        duration,
        title,
        priority: block.priority || (block.isBreak ? 'break' : 'medium'),
        status: block.status || 'scheduled',
        type: block.isBreak ? 'Break' : 'Task',
        linkedTask: block.task ? 'Yes' : 'No',
        notes: block.notes || ''
      });

      const priority = String(row.getCell(6).value || '').toLowerCase();
      let fill = 'FFFFFFFF';
      if (priority === 'urgent') fill = 'FFFFF1F2';
      if (priority === 'high') fill = 'FFFFF7ED';
      if (priority === 'medium') fill = 'FFFFFBEB';
      if (priority === 'low') fill = 'FFF0FDF4';
      if (priority === 'break') fill = 'FFEFF6FF';

      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          left: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          bottom: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          right: { style: 'thin', color: { argb: 'FFD6DEE8' } }
        };
      });
      row.getCell(4).numFmt = '0.00';
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:J1';
  }

  styleExcelHeaderRow(row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B5FFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  formatTimeRange(startTime, endTime, timeFormat) {
    if (timeFormat === '12h') {
      return `${this.convertTo12h(startTime)} - ${this.convertTo12h(endTime)}`;
    }
    return `${startTime} - ${endTime}`;
  }

  convertTo12h(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  getPriorityColor(priority, isBreak) {
    if (isBreak) return '6699FF';
    switch (priority) {
      case 'urgent': return 'FF0000';
      case 'high': return 'FF6600';
      case 'medium': return 'FFCC00';
      case 'low': return '00CC00';
      default: return '000000';
    }
  }

  timeStringToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  calculateHours(startTime, endTime) {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);
    return (end - start) / 60;
  }
}

module.exports = {
  scheduleExporter: new ScheduleExporter()
};
