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

module.exports = { createTask, getAllTasks, getMyTasks, updateTaskStatus };