const express = require('express');
const router = express.Router();
const workClock = require('../config/workClock');
const { checkIn, checkOut, saveWorkTimer, getTodayAttendance, getMyAttendance } = require('../controllers/attendanceController');
const { protect, isAdmin, isEmployee } = require('../middleware/auth');
const Attendance = require('../models/Attendance');

router.post('/checkin', protect, isEmployee, checkIn);
router.put('/checkout', protect, isEmployee, checkOut);
router.post('/save-timer', protect, isEmployee, saveWorkTimer);
router.get('/today', protect, isAdmin, getTodayAttendance);
router.get('/my', protect, isEmployee, getMyAttendance);

// Date wise attendance - admin
router.get('/by-date', protect, isAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      return res.status(400).json({ message: 'Use YYYY-MM-DD for the attendance date' });
    }
    const records = await Attendance.find({ date: date || workClock().date })
      .populate('employee', 'name email department');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/by-month', protect, isAdmin, async (req, res, next) => {
  const { month } = req.query;
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ message: 'Use YYYY-MM for the attendance month' });
  }
  try {
    const records = await Attendance.find({ date: { $gte: month + '-01', $lte: month + '-31' } })
      .populate('employee', 'name email department');
    res.json(records);
  } catch (error) {
    next(error);
  }
});

module.exports = router;