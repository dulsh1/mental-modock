const TimetableTemplate = require('../models/TimetableTemplate');
const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const { timetableApplier } = require('../services/scheduling/timetableApplier');

/**
 * Create a new timetable template
 * POST /api/templates
 */
exports.createTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      description,
      templateType,
      schedulePattern,
      preferredHours,
      semester,
      startDate,
      endDate,
      customSettings,
      tags
    } = req.body;

    // Validate required fields
    if (!name || !schedulePattern) {
      return res.status(400).json({
        success: false,
        message: 'Template name and schedule pattern are required'
      });
    }

    const template = new TimetableTemplate({
      user: userId,
      name: name.trim(),
      description,
      templateType: templateType || 'custom',
      schedulePattern: {
        timeSlots: schedulePattern.timeSlots || [],
        breakSchedule: schedulePattern.breakSchedule || {
          shortBreakDuration: 15,
          longBreakDuration: 30,
          longBreakAfter: 120
        },
        workdayStart: schedulePattern.workdayStart || '08:00',
        workdayEnd: schedulePattern.workdayEnd || '22:00'
      },
      preferredHours: preferredHours || [],
      semester,
      startDate,
      endDate,
      customSettings: customSettings || {
        includeWeekends: false,
        autoAdjustBased: null,
        minTimeBetweenSubjects: 0
      },
      tags: tags || []
    });

    // Calculate weekly workload
    let totalHours = 0;
    let studyHours = 0;
    let breakHours = 0;

    if (schedulePattern.timeSlots) {
      schedulePattern.timeSlots.forEach(slot => {
        const start = new Date(`2000-01-01 ${slot.startTime}`);
        const end = new Date(`2000-01-01 ${slot.endTime}`);
        const hours = (end - start) / (1000 * 60 * 60);

        totalHours += hours;
        if (slot.activityType === 'break') {
          breakHours += hours;
        } else {
          studyHours += hours;
        }
      });
    }

    template.weeklyWorkload = {
      totalHours: Math.round(totalHours * 100) / 100,
      studyHours: Math.round(studyHours * 100) / 100,
      breakHours: Math.round(breakHours * 100) / 100
    };

    await template.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all templates for user
 * GET /api/templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateType = null, sortBy = 'recent', limit = 50 } = req.query;

    const query = { user: userId };
    if (templateType && templateType !== 'all') {
      query.templateType = templateType;
    }

    let sortObj = { createdAt: -1 };
    if (sortBy === 'name') sortObj = { name: 1 };
    if (sortBy === 'default') sortObj = { isDefault: -1, updatedAt: -1 };
    if (sortBy === 'usage') sortObj = { usageCount: -1 };

    const templates = await TimetableTemplate.find(query)
      .sort(sortObj)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a specific template
 * GET /api/templates/:templateId
 */
exports.getTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;

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

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update a template
 * PUT /api/templates/:templateId
 */
exports.updateTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;
    const updates = req.body;

    const template = await TimetableTemplate.findOneAndUpdate(
      { _id: templateId, user: userId },
      {
        ...updates,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated',
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete a template
 * DELETE /api/templates/:templateId
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;

    // Don't allow deleting default templates without unset first
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

    if (template.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the default template. Unset it first.'
      });
    }

    await TimetableTemplate.findByIdAndDelete(templateId);

    res.json({
      success: true,
      message: 'Template deleted'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Set template as default
 * POST /api/templates/:templateId/set-default
 */
exports.setDefaultTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;

    // Unset all other default templates for this user
    await TimetableTemplate.updateMany(
      { user: userId, isDefault: true },
      { isDefault: false }
    );

    // Set this template as default
    const template = await TimetableTemplate.findOneAndUpdate(
      { _id: templateId, user: userId },
      { isDefault: true },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template set as default',
      data: template
    });
  } catch (error) {
    console.error('Error setting default template:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Apply template to a week - generates schedule based on template
 * POST /api/templates/:templateId/apply
 */
exports.applyTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;
    const { weekStartDate, autoGenerateSchedule = true, preferences = {} } = req.body;

    if (!weekStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Week start date is required'
      });
    }

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

    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get tasks to schedule for this week
    const tasks = await Task.find({
      user: userId,
      status: { $in: ['pending', 'in_progress'] },
      dueDate: { $lte: weekEnd },
      scheduledDate: null
    }).sort({ priority: -1, dueDate: 1 });

    // Apply template to generate schedule
    const result = await timetableApplier.applyTemplateToWeek(
      template,
      weekStart,
      weekEnd,
      tasks,
      preferences
    );

    // Create schedule document
    const schedule = new Schedule({
      user: userId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      scheduleType: 'custom',
      sourceTemplate: templateId,
      timeBlocks: result.timeBlocks,
      conflicts: [],
      preferences: {
        workdayStart: template.schedulePattern.workdayStart,
        workdayEnd: template.schedulePattern.workdayEnd,
        breakDuration: template.schedulePattern.breakSchedule.shortBreakDuration,
        breakInterval: template.schedulePattern.breakSchedule.longBreakAfter,
        ...preferences
      },
      stats: result.stats
    });

    await schedule.save();

    // Update tasks with schedule info
    for (const timeBlock of result.timeBlocks) {
      if (timeBlock.task) {
        await Task.findByIdAndUpdate(timeBlock.task, {
          scheduledDate: timeBlock.date,
          scheduledTime: {
            start: timeBlock.startTime,
            end: timeBlock.endTime
          },
          timeBlockId: schedule._id
        });
      }
    }

    // Record template usage
    await template.recordUsage(weekStart);

    res.json({
      success: true,
      message: 'Template applied successfully',
      data: {
        schedule: schedule._id,
        timeBlocks: schedule.timeBlocks,
        stats: schedule.stats
      }
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Add a time slot to template
 * POST /api/templates/:templateId/slots
 */
exports.addTimeSlot = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;
    const slotData = req.body;

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

    const newSlot = template.addTimeSlot(slotData);
    await template.save();

    res.json({
      success: true,
      message: 'Time slot added',
      data: {
        timeSlot: newSlot,
        template
      }
    });
  } catch (error) {
    console.error('Error adding time slot:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remove a time slot from template
 * DELETE /api/templates/:templateId/slots/:slotId
 */
exports.removeTimeSlot = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId, slotId } = req.params;

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

    template.removeTimeSlot(slotId);
    await template.save();

    res.json({
      success: true,
      message: 'Time slot removed',
      data: template
    });
  } catch (error) {
    console.error('Error removing time slot:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Rate/provide feedback on template
 * POST /api/templates/:templateId/rate
 */
exports.rateTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId } = req.params;
    const { score } = req.body;

    if (score < 0 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Score must be between 0 and 5'
      });
    }

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

    await template.addRating(score);

    res.json({
      success: true,
      message: 'Rating recorded',
      data: template
    });
  } catch (error) {
    console.error('Error rating template:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get template suggestions for user
 * GET /api/templates/suggestions/:templateType
 */
exports.getTemplateSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateType = 'study-focused' } = req.params;

    // Get user's existing templates
    const userTemplates = await TimetableTemplate.find({
      user: userId
    }).select('name templateType');

    // Get public templates of same type (for inspiration)
    const publicTemplates = await TimetableTemplate.getPublicTemplates({
      templateType,
      sortBy: 'rating',
      limit: 3
    });

    res.json({
      success: true,
      data: {
        userTemplates,
        suggestions: publicTemplates
      }
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
