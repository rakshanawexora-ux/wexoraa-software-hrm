module.exports = function requestError(res, error, duplicateMessage = 'Record already exists') {
  if (error.code === 11000) return res.status(409).json({ message: duplicateMessage });
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'One or more fields are invalid' });
  }
  return res.status(500).json({ message: 'Server error' });
};
