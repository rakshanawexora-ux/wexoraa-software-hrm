const User = require('../models/User');
const requestError = require('../config/requestError');
const Task = require('../models/Task');

// Task create - admin only
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority } = req.body;
    if (!await User.exists({ _id: assignedTo, role: 'employee', isActive: { $ne: false } })) {
      return res.status(400).json({ message: 'Select an active employee' });
    }
    const task = await Task.create({
      title,
      description,
      assignedTo,
      dueDate,
      assignmentNotifiedAt: new Date(),
      priority
    });
    const populated = await task.populate('assignedTo', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    requestError(res, err);
  }
};

// All tasks - admin view
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    requestError(res, err);
  }
};

// My tasks - employee view
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    requestError(res, err);
  }
};

// Task status update - employee
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'inprogress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Select a valid status' });
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user.id },
      { status },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    requestError(res, err);
  }
};

const getAssignmentNotifications = async (req, res) => {
  const assignments = {
    assignedTo: req.user.id,
    assignmentNotifiedAt: { $exists: true }
  };
  try {
    const [items, unreadCount] = await Promise.all([
      Task.find(assignments)
        .select('title priority dueDate assignmentNotifiedAt assignmentReadAt')
        .sort({ assignmentReadAt: 1, assignmentNotifiedAt: -1 })
        .limit(20)
        .lean(),
      Task.countDocuments({ ...assignments, assignmentReadAt: null })
    ]);
    res.json({ items, unreadCount });
  } catch (err) {
    requestError(res, err);
  }
};

const readAssignmentNotification = async (req, res) => {
  try {
    await Task.updateOne({
      _id: req.params.id,
      assignedTo: req.user.id,
      assignmentNotifiedAt: { $exists: true },
      assignmentReadAt: null
    }, { $set: { assignmentReadAt: new Date() } }, { timestamps: false });
    res.sendStatus(204);
  } catch (err) {
    requestError(res, err);
  }
};

module.exports = {
  createTask, getAllTasks, getMyTasks, updateTaskStatus,
  getAssignmentNotifications, readAssignmentNotification
};
