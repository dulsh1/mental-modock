const Semester = require('../models/Semester');
const Course = require('../models/Course');
const SemesterGPAGoal = require('../models/SemesterGPAGoal');
const GPACalculationService = require('../services/gpaCalculationService');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const GPA_THEME = {
  primary: '#0B5FFF',
  primaryLight: '#E8F0FF',
  text: '#0F172A',
  muted: '#475569',
  border: '#D6DEE8'
};

const excelHeaderStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B5FFF' } },
  alignment: { vertical: 'middle', horizontal: 'center' }
};

const applyHeaderStyle = (row) => {
  row.font = excelHeaderStyle.font;
  row.fill = excelHeaderStyle.fill;
  row.alignment = excelHeaderStyle.alignment;
};

const applyTableBorders = (row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD6DEE8' } },
      left: { style: 'thin', color: { argb: 'FFD6DEE8' } },
      bottom: { style: 'thin', color: { argb: 'FFD6DEE8' } },
      right: { style: 'thin', color: { argb: 'FFD6DEE8' } }
    };
  });
};

const styleSheetHeader = (sheet, title, subtitle, endColumn = 'B') => {
  sheet.insertRow(1, []);
  sheet.mergeCells(`A1:${endColumn}1`);
  sheet.getCell('A1').value = title;
  sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF0F172A' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.insertRow(2, []);
  sheet.mergeCells(`A2:${endColumn}2`);
  sheet.getCell('A2').value = subtitle;
  sheet.getCell('A2').font = { size: 11, color: { argb: 'FF475569' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.insertRow(3, []);
};

// @desc    Export GPA data as PDF
// @route   POST /api/gpa/export/pdf
// @access  Private
exports.exportPDF = async (req, res) => {
  try {
    const semesters = await Semester.find({ user: req.user.id })
      .sort({ semesterNumber: 1 });

    // Get all courses for all semesters
    const semestersWithCourses = await Promise.all(
      semesters.map(async (semester) => {
        const courses = await Course.find({ semester: semester._id });
        const goal = await SemesterGPAGoal.findOne({ semester: semester._id });
        return {
          ...semester.toObject(),
          courses,
          goal
        };
      })
    );

    const analyticsData = GPACalculationService.getAnalyticsData(semestersWithCourses);

    // Build courseHistory for display
    const courseHistory = semestersWithCourses.flatMap(semester =>
      (semester.courses || []).map(course => ({
        semesterName: semester.semesterName,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        letterGrade: course.letterGrade,
        gradePoint: GPACalculationService.gradeToPoint(course.letterGrade)
      }))
    );

    // Create PDF document
    const doc = new PDFDocument({ margin: 40 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="gpa-report.pdf"');

    // Pipe to response
    doc.pipe(res);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;

    // Hero header
    doc.roundedRect(startX, 40, pageWidth, 64, 10)
      .fillAndStroke(GPA_THEME.primary, GPA_THEME.primary);
    doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold')
      .text('GPA Performance Report', startX, 55, { align: 'center', width: pageWidth });
    doc.fontSize(10).font('Helvetica')
      .text(`Generated on ${new Date().toLocaleDateString()}`, startX, 83, { align: 'center', width: pageWidth });
    doc.moveTo(startX, 116).lineTo(startX + pageWidth, 116).strokeColor(GPA_THEME.border).stroke();
    doc.fillColor(GPA_THEME.text);
    doc.y = 128;

    // Summary cards
    doc.fontSize(14).font('Helvetica-Bold').fillColor(GPA_THEME.text).text('Academic Summary');
    doc.moveDown(0.5);

    const cards = [
      { label: 'Cumulative GPA', value: `${(analyticsData.cgpa || 0).toFixed(2)} / 4.0` },
      { label: 'Semesters', value: `${semesters.length}` },
      { label: 'Courses', value: `${analyticsData.totalCourses}` },
      { label: 'Credits', value: `${analyticsData.totalCredits}` }
    ];

    const cardWidth = (pageWidth - 15) / 2;
    const cardHeight = 46;
    cards.forEach((card, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = startX + col * (cardWidth + 15);
      const y = doc.y + row * (cardHeight + 8);

      doc.roundedRect(x, y, cardWidth, cardHeight, 8)
        .fillAndStroke(GPA_THEME.primaryLight, GPA_THEME.border);
      doc.fillColor(GPA_THEME.muted).fontSize(9).font('Helvetica').text(card.label, x + 10, y + 8);
      doc.fillColor(GPA_THEME.text).fontSize(14).font('Helvetica-Bold').text(card.value, x + 10, y + 22);
    });
    doc.y += (cardHeight * 2) + 22;
    doc.moveDown();

    // Semester Breakdown
    doc.fontSize(14).font('Helvetica-Bold').fillColor(GPA_THEME.text).text('Semester Breakdown');
    doc.moveDown(0.4);

    analyticsData.semesterGPAs.forEach((semesterGPA) => {
      doc.roundedRect(startX, doc.y, pageWidth, 30, 6)
        .fillAndStroke('#FFFFFF', GPA_THEME.border);
      doc.fillColor(GPA_THEME.text).fontSize(10).font('Helvetica-Bold')
        .text(semesterGPA.semesterName, startX + 10, doc.y + 8);
      doc.fillColor(GPA_THEME.muted).fontSize(9).font('Helvetica')
        .text(`GPA ${semesterGPA.gpa.toFixed(2)} | Courses ${semesterGPA.courseCount} | Credits ${semesterGPA.credits}`, startX + 220, doc.y + 9);
      doc.moveDown(1.7);
    });

    doc.moveDown();

    // Grade Distribution
    doc.fontSize(14).font('Helvetica-Bold').fillColor(GPA_THEME.text).text('Grade Distribution');
    doc.fontSize(10).font('Helvetica').fillColor(GPA_THEME.muted);

    const gradeLabels = Object.keys(analyticsData.gradeDistribution);
    gradeLabels.forEach((grade) => {
      const count = analyticsData.gradeDistribution[grade];
      if (count > 0) {
        doc.text(`${grade}: ${count} course${count !== 1 ? 's' : ''}`);
      }
    });

    doc.moveDown();

    // Course History
    doc.fontSize(14).font('Helvetica-Bold').fillColor(GPA_THEME.text).text('Complete Course History');
    doc.fontSize(9).font('Helvetica').fillColor(GPA_THEME.text);

    if (courseHistory && courseHistory.length > 0) {
      // Table headers
      const tableTop = doc.y + 4;
      const col1 = 40;
      const col2 = 102;
      const col3 = 250;
      const col4 = 372;
      const col5 = 430;
      const col6 = 485;
      const rowHeight = 18;

      const drawCourseTableHeader = (y) => {
        doc.rect(40, y - 2, 510, rowHeight).fillAndStroke(GPA_THEME.primary, GPA_THEME.primary);

        doc.fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('Code', col1 + 4, y + 3);
        doc.text('Course Name', col2 + 4, y + 3);
        doc.text('Semester', col3 + 4, y + 3);
        doc.text('Cred', col4 + 4, y + 3);
        doc.text('Grade', col5 + 4, y + 3);
        doc.text('Pts', col6 + 4, y + 3);
      };

      drawCourseTableHeader(tableTop);

      doc.fillColor(GPA_THEME.text).font('Helvetica');
      let y = tableTop + rowHeight;

      courseHistory.forEach((course, idx) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
          drawCourseTableHeader(y);
          y += rowHeight;
        }
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, y - 2, 510, rowHeight).fillAndStroke(rowBg, GPA_THEME.border);

        doc.fillColor(GPA_THEME.text).text(course.courseCode, col1 + 4, y + 2);
        doc.text(course.courseName.substring(0, 22), col2 + 4, y + 2);
        doc.text((course.semesterName || '-').substring(0, 16), col3 + 4, y + 2);
        doc.text(course.credits.toString(), col4 + 4, y + 2);
        doc.text(course.letterGrade, col5 + 4, y + 2);
        doc.text(course.gradePoint.toFixed(2), col6 + 4, y + 2);
        y += rowHeight;
      });
    }

    // Footer
    doc.fillColor(GPA_THEME.muted).fontSize(8).font('Helvetica').text(
      'This report was generated by Mental Modock GPA Calculator',
      { align: 'center', y: 750 }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export GPA data as Excel
// @route   POST /api/gpa/export/excel
// @access  Private
exports.exportExcel = async (req, res) => {
  try {
    const semesters = await Semester.find({ user: req.user.id })
      .sort({ semesterNumber: 1 });

    // Get all courses for all semesters
    const semestersWithCourses = await Promise.all(
      semesters.map(async (semester) => {
        const courses = await Course.find({ semester: semester._id });
        const goal = await SemesterGPAGoal.findOne({ semester: semester._id });
        return {
          ...semester.toObject(),
          courses,
          goal
        };
      })
    );

    const analyticsData = GPACalculationService.getAnalyticsData(semestersWithCourses);

    // Build courseHistory for display
    const courseHistory = semestersWithCourses.flatMap(semester =>
      (semester.courses || []).map(course => ({
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        letterGrade: course.letterGrade,
        gradePoint: GPACalculationService.gradeToPoint(course.letterGrade)
      }))
    );

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mental Modock';
    workbook.created = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary', { views: [{ showGridLines: false }] });
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    styleSheetHeader(summarySheet, 'GPA Summary', `Generated ${new Date().toLocaleDateString()}`, 'B');
    applyHeaderStyle(summarySheet.getRow(4));
    applyTableBorders(summarySheet.getRow(4));
    summarySheet.addRows([
      { metric: 'Cumulative GPA', value: (analyticsData.cgpa || 0).toFixed(2) },
      { metric: 'Total Semesters', value: semesters.length },
      { metric: 'Total Courses', value: analyticsData.totalCourses },
      { metric: 'Total Credits', value: analyticsData.totalCredits },
      { metric: 'Export Date', value: new Date().toLocaleDateString() }
    ]);
    for (let i = 5; i <= summarySheet.rowCount; i += 1) {
      applyTableBorders(summarySheet.getRow(i));
      if (i % 2 === 0) {
        summarySheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    }

    // Sheet 2: Semester Details
    const semesterSheet = workbook.addWorksheet('Semester Details');
    semesterSheet.columns = [
      { header: 'Semester', key: 'semesterName', width: 20 },
      { header: 'GPA', key: 'gpa', width: 10 },
      { header: 'Courses', key: 'courseCount', width: 10 },
      { header: 'Credits', key: 'credits', width: 10 },
      { header: 'Target GPA', key: 'targetGPA', width: 12 }
    ];

    const semesterRows = semestersWithCourses.map((semester) => {
      const semesterGPA = GPACalculationService.calculateSemesterGPA(semester.courses || []);
      const totalCredits = (semester.courses || []).reduce(
        (sum, c) => sum + (parseFloat(c.credits) || 0), 0
      );
      return {
        semesterName: semester.semesterName,
        gpa: semesterGPA.toFixed(2),
        courseCount: (semester.courses || []).length,
        credits: totalCredits,
        targetGPA: semester.goal ? semester.goal.targetGPA.toFixed(2) : 'N/A'
      };
    });

    semesterSheet.addRows(semesterRows);
    applyHeaderStyle(semesterSheet.getRow(1));
    semesterSheet.views = [{ state: 'frozen', ySplit: 1 }];
    semesterSheet.autoFilter = 'A1:E1';
    for (let i = 2; i <= semesterSheet.rowCount; i += 1) {
      applyTableBorders(semesterSheet.getRow(i));
      const gpaCell = semesterSheet.getRow(i).getCell(2);
      const gpaVal = parseFloat(gpaCell.value);
      if (!Number.isNaN(gpaVal)) {
        if (gpaVal >= 3.5) gpaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F7EE' } };
        else if (gpaVal < 2.5) gpaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
      }
    }

    // Sheet 3: Course History
    const courseSheet = workbook.addWorksheet('Course History');
    courseSheet.columns = [
      { header: 'Code', key: 'courseCode', width: 12 },
      { header: 'Course Name', key: 'courseName', width: 28 },
      { header: 'Semester', key: 'semesterName', width: 20 },
      { header: 'Credits', key: 'credits', width: 10 },
      { header: 'Grade', key: 'letterGrade', width: 8 },
      { header: 'Grade Points', key: 'gradePoint', width: 12 }
    ];

    const courseRows = courseHistory.map((course) => ({
      courseCode: course.courseCode,
      courseName: course.courseName,
      semesterName: course.semesterName || '-',
      credits: course.credits,
      letterGrade: course.letterGrade,
      gradePoint: course.gradePoint.toFixed(2)
    }));

    courseSheet.addRows(courseRows);
    applyHeaderStyle(courseSheet.getRow(1));
    courseSheet.views = [{ state: 'frozen', ySplit: 1 }];
    courseSheet.autoFilter = 'A1:F1';
    for (let i = 2; i <= courseSheet.rowCount; i += 1) {
      applyTableBorders(courseSheet.getRow(i));
      if (i % 2 === 0) {
        courseSheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    }

    // Sheet 4: Grade Distribution
    const distributionSheet = workbook.addWorksheet('Grade Distribution');
    distributionSheet.columns = [
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Count', key: 'count', width: 10 }
    ];

    const distributionRows = Object.keys(analyticsData.gradeDistribution)
      .filter(grade => analyticsData.gradeDistribution[grade] > 0)
      .map(grade => ({
        grade,
        count: analyticsData.gradeDistribution[grade]
      }));

    distributionSheet.addRows(distributionRows);
    applyHeaderStyle(distributionSheet.getRow(1));
    for (let i = 2; i <= distributionSheet.rowCount; i += 1) {
      applyTableBorders(distributionSheet.getRow(i));
      if (i % 2 === 0) {
        distributionSheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="gpa-report.xlsx"');

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
