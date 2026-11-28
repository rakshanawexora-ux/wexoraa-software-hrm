require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const { MONGO_URI, JWT_SECRET, CLIENT_ORIGIN = 'http://localhost:5173', PORT = 5000 } = process.env;

app.disable('x-powered-by');
app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((origin) => origin.trim()) }));
app.use(express.json());
app.use('/api', (req, res, next) => {
  connectDatabase().then(() => next(), (error) => {
    console.error('HRMS database unavailable:', error.name);
    res.status(503).json({ message: 'Database temporarily unavailable' });
  });
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/tasks', require('./routes/tasks'));
app.get('/', (req, res) => res.json({ message: 'Wexoraa Infotech HRMS API' }));
app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request too large' });
  res.status(500).json({ message: 'Server error' });
});

let databaseReady;

async function connectDatabase() {
  if (!MONGO_URI || !JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('Set MONGO_URI and a JWT_SECRET of at least 32 characters.');
  }
  if (!databaseReady) {
    databaseReady = mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .then(() => Promise.all(['User', 'Attendance', 'Report'].map((model) => mongoose.model(model).init())))
      .catch((error) => {
        databaseReady = undefined;
        throw error;
      });
  }
  return databaseReady;
}

async function start() {
  await connectDatabase();
  app.listen(PORT, () => console.log('HRMS API listening on port ' + PORT));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('HRMS startup failed:', error.name === 'Error' ? error.message : error.name);
    process.exit(1);
  });
}
module.exports = app;
