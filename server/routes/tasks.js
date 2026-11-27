const express = require('express');
const router = express.Router();
const {
  createTask, getAllTasks, getMyTasks, updateTaskStatus,
  getAssignmentNotifications, readAssignmentNotification
} = require('../controllers/taskController');
const { protect, isAdmin, isEmployee } = require('../middleware/auth');
const Task = require('../models/Task');

router.post('/', protect, isAdmin, createTask);
router.get('/', protect, isAdmin, getAllTasks);
router.get('/my', protect, isEmployee, getMyTasks);
router.get('/my/notifications', protect, isEmployee, getAssignmentNotifications);
router.put('/my/notifications/:id/read', protect, isEmployee, readAssignmentNotification);
router.put('/:id/status', protect, isEmployee, updateTaskStatus);
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;