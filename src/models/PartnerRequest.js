const mongoose = require('mongoose');

const partnerRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    default: 'Halo, ayo belajar bersama!',
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  respondedAt: Date
}, { timestamps: true });

partnerRequestSchema.index({ sender: 1, receiver: 1, status: 1 });

module.exports = mongoose.model('PartnerRequest', partnerRequestSchema);
