const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignmentNotifiedAt: Date,
  assignmentReadAt: Date,
  dueDate: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'inprogress', 'done'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { timestamps: true });

taskSchema.index(
  { assignedTo: 1, assignmentReadAt: 1, assignmentNotifiedAt: -1 },
  { partialFilterExpression: { assignmentNotifiedAt: { $exists: true } } }
);

module.exports = mongoose.model('Task', taskSchema);
