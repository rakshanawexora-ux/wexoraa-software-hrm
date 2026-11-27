const express = require('express');
const router = express.Router();
const { submitReport, getAllReports, getMyReports } = require('../controllers/reportController');
const { protect, isAdmin, isEmployee } = require('../middleware/auth');

router.post('/submit', protect, isEmployee, submitReport);
router.get('/all', protect, isAdmin, getAllReports);
router.get('/my', protect, isEmployee, getMyReports);

module.exports = router;