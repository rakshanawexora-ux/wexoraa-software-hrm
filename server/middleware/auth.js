const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Sign in to continue' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid' });
  }

  try {
    const user = await User.findById(decoded.id).select('role isActive');
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: 'Account unavailable' });
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

const isEmployee = (req, res, next) => {
  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Employee access required' });
  next();
};

module.exports = { protect, isAdmin, isEmployee };
