const Attendance = require('../models/Attendance');
const workClock = require('../config/workClock');
const requestError = require('../config/requestError');

function statusFor(time) {
  return time.slice(0, 5) > '09:30' ? 'late' : 'present';
}

const checkIn = async (req, res) => {
  const { date, time } = workClock();
  try {
    const attendance = await Attendance.create({
      employee: req.user.id, date, checkIn: time, status: statusFor(time)
    });
    res.status(201).json(attendance);
  } catch (error) {
    requestError(res, error, 'Already checked in today');
  }
};

const checkOut = async (req, res) => {
  const { date, time } = workClock();
  try {
    const attendance = await Attendance.findOneAndUpdate(
      { employee: req.user.id, date, checkOut: null },
      { checkOut: time }, { new: true }
    );
    if (!attendance) return res.status(409).json({ message: 'No open attendance record for today' });
    res.json(attendance);
  } catch (error) {
    requestError(res, error);
  }
};

const saveWorkTimer = async (req, res) => {
  const { date, time } = workClock();
  const { checkIn, workSeconds, breakSeconds, breakCount } = req.body || {};
  if (typeof checkIn !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(checkIn) ||
      ![workSeconds, breakSeconds, breakCount].every((value) => Number.isSafeInteger(value) && value >= 0) ||
      workSeconds + breakSeconds > 86400) {
    return res.status(400).json({ message: 'Invalid work timer data' });
  }

  try {
    const employee = req.user.id;
    const attendance = await Attendance.findOneAndUpdate(
      { employee, date, checkOut: null },
      {
        $setOnInsert: { employee, date, checkIn, status: statusFor(checkIn) },
        $set: { checkOut: time, workSeconds, breakSeconds, breakCount }
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      try {
        const saved = await Attendance.findOne({
          employee: req.user.id, date, checkIn, workSeconds, breakSeconds, breakCount,
          checkOut: { $ne: null }
        });
        if (saved) return res.json(saved);
      } catch (lookupError) {
        return requestError(res, lookupError);
      }
    }
    requestError(res, error, 'Attendance already recorded for today');
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ date: workClock().date })
      .populate('employee', 'name email department');
    res.json(records);
  } catch (error) {
    requestError(res, error);
  }
};

const getMyAttendance = async (req, res) => {
  try {
    res.json(await Attendance.find({ employee: req.user.id }).sort({ date: -1 }));
  } catch (error) {
    requestError(res, error);
  }
};

module.exports = { checkIn, checkOut, saveWorkTimer, getTodayAttendance, getMyAttendance };
