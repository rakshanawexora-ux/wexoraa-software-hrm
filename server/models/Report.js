const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  tasksCompleted: {
    type: String,
    required: true
  },
  hoursWorked: {
    type: Number, min: 0, max: 1440,
    required: true
  },
  blockers: {
    type: String,
    default: ''
  },
  tomorrowPlan: {
    type: String,
    default: ''
  }
}, { timestamps: true });

reportSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);