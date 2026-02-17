const Task = require('../models/Task');
const User = require('../models/User');
const { breakdownTask } = require('../services/ai/taskBreakdownService');
const { scheduleTasksOptimally } = require('../services/ai/schedulingService');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, category, search, sortBy = 'dueDate' } = req.query;

    let query = { user: req.user.id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {
      dueDate: { dueDate: 1 },
      priority: { priority: -1 },
      createdAt: { createdAt: -1 }
    };

    const tasks = await Task.find(query).sort(sortOptions[sortBy] || { dueDate: 1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      user: req.user.id
    };

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Handle completion
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
      
      // Update user stats
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.totalTasksCompleted': 1 }
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    AI-powered task breakdown
// @route   POST /api/tasks/ai-breakdown
// @access  Private
exports.aiBreakdown = async (req, res) => {
  try {
    const { taskDescription, estimatedHours } = req.body;

    if (!taskDescription) {
      return res.status(400).json({
        success: false,
        message: 'Task description is required'
      });
    }

    const breakdown = await breakdownTask(taskDescription, estimatedHours);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create task with AI-generated subtasks
// @route   POST /api/tasks/create-with-breakdown
// @access  Private
exports.createWithBreakdown = async (req, res) => {
  try {
    const { title, description, category, priority, dueDate, estimatedHours } = req.body;

    // Get AI breakdown
    const breakdown = await breakdownTask(title + (description ? ': ' + description : ''), estimatedHours);

    // Create task with subtasks
    const task = await Task.create({
      user: req.user.id,
      title,
      description,
      category,
      priority,
      dueDate,
      estimatedDuration: breakdown.totalEstimatedMinutes,
      subtasks: breakdown.subtasks.map((st, index) => ({
        title: st.title,
        estimatedTime: st.estimatedMinutes,
        order: index
      })),
      isAIGenerated: true,
      aiBreakdownSuggestion: {
        originalPrompt: title,
        generatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Auto-schedule tasks
// @route   POST /api/tasks/auto-schedule
// @access  Private
exports.autoSchedule = async (req, res) => {
  try {
    const { taskIds, date } = req.body;

    // Get user's productive hours
    const user = await User.findById(req.user.id);

    // Get tasks to schedule
    let tasks;
    if (taskIds && taskIds.length > 0) {
      tasks = await Task.find({
        _id: { $in: taskIds },
        user: req.user.id
      });
    } else {
      tasks = await Task.getUnscheduledTasks(req.user.id);
    }

    // Schedule tasks optimally
    const scheduledTasks = await scheduleTasksOptimally(
      tasks,
      user.preferences.productiveHours,
      req.user.id,
      date
    );

    // Update tasks with scheduled times
    for (const scheduled of scheduledTasks) {
      await Task.findByIdAndUpdate(scheduled.taskId, {
        scheduledDate: scheduled.date,
        scheduledTime: scheduled.time
      });
    }

    res.json({
      success: true,
      data: scheduledTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get today's tasks
// @route   GET /api/tasks/today
// @access  Private
exports.getTodaysTasks = async (req, res) => {
  try {
    const tasks = await Task.getTodaysTasks(req.user.id);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update subtask
// @route   PUT /api/tasks/:id/subtask/:subtaskId
// @access  Private
exports.updateSubtask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    // Update subtask
    Object.assign(subtask, req.body);

    if (req.body.completed && !subtask.completedAt) {
      subtask.completedAt = new Date();
    }

    await task.save();

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
