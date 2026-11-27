const requestError = require('../config/requestError');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// All employees get pannuvom
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (err) {
    requestError(res, err, 'Email already exists');
  }
};

// New employee add pannuvom
const addEmployee = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
      return res.status(400).json({ message: 'Use a password of at least 8 characters and at most 72 bytes' });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      department,
      role: 'employee'
    });

    res.status(201).json({
      id: employee._id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role
    });
  } catch (err) {
    requestError(res, err, 'Email already exists');
  }
};

// Employee update pannuvom
const updateEmployee = async (req, res) => {
  try {
    const { name, email, department, isActive } = req.body;
    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'employee' },
      { name, email, department, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    requestError(res, err, 'Email already exists');
  }
};

// Employee delete pannuvom
const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findOneAndDelete({ _id: req.params.id, role: 'employee' });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    requestError(res, err, 'Email already exists');
  }
};

module.exports = { getEmployees, addEmployee, updateEmployee, deleteEmployee };