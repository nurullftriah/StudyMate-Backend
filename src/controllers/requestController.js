const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const PartnerRequest = require('../models/PartnerRequest');
const User = require('../models/User');

function populateRequest(query) {
  return query
    .populate('sender', 'name username email university studyProgram interests avatarColor')
    .populate('receiver', 'name username email university studyProgram interests avatarColor');
}

const createRequest = asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;

  if (!mongoose.isValidObjectId(receiverId)) {
    res.status(400);
    throw new Error('ID partner tidak valid');
  }

  if (String(receiverId) === String(req.user._id)) {
    res.status(400);
    throw new Error('Tidak dapat mengirim permintaan ke diri sendiri');
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    res.status(404);
    throw new Error('Calon partner tidak ditemukan');
  }

  const existing = await PartnerRequest.findOne({
    status: { $in: ['pending', 'accepted'] },
    $or: [
      { sender: req.user._id, receiver: receiverId },
      { sender: receiverId, receiver: req.user._id }
    ]
  });

  if (existing) {
    res.status(409);
    throw new Error('Permintaan atau koneksi dengan pengguna ini sudah ada');
  }

  const partnerRequest = await PartnerRequest.create({
    sender: req.user._id,
    receiver: receiverId,
    message: message || 'Halo, ayo belajar bersama!'
  });

  const populated = await populateRequest(PartnerRequest.findById(partnerRequest._id));
  res.status(201).json({ request: populated });
});

const getRequests = asyncHandler(async (req, res) => {
  const requests = await populateRequest(PartnerRequest.find({
    $or: [
      { sender: req.user._id },
      { receiver: req.user._id }
    ]
  }).sort({ createdAt: -1 }));

  const incoming = requests.filter((request) => String(request.receiver._id) === String(req.user._id) && request.status === 'pending');
  const outgoing = requests.filter((request) => String(request.sender._id) === String(req.user._id) && request.status === 'pending');
  const history = requests.filter((request) => request.status !== 'pending');

  res.json({ incoming, outgoing, history });
});

const updateRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Status harus accepted atau rejected');
  }

  const partnerRequest = await PartnerRequest.findById(req.params.id);
  if (!partnerRequest) {
    res.status(404);
    throw new Error('Permintaan tidak ditemukan');
  }

  if (String(partnerRequest.receiver) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Hanya penerima yang dapat merespon permintaan');
  }

  if (partnerRequest.status !== 'pending') {
    res.status(400);
    throw new Error('Permintaan sudah diproses');
  }

  partnerRequest.status = status;
  partnerRequest.respondedAt = new Date();
  await partnerRequest.save();

  const populated = await populateRequest(PartnerRequest.findById(partnerRequest._id));
  res.json({ request: populated });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const partnerRequest = await PartnerRequest.findById(req.params.id);
  if (!partnerRequest) {
    res.status(404);
    throw new Error('Permintaan tidak ditemukan');
  }

  if (String(partnerRequest.sender) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Hanya pengirim yang dapat membatalkan permintaan');
  }

  if (partnerRequest.status !== 'pending') {
    res.status(400);
    throw new Error('Permintaan sudah diproses');
  }

  partnerRequest.status = 'cancelled';
  partnerRequest.respondedAt = new Date();
  await partnerRequest.save();

  res.json({ message: 'Permintaan berhasil dibatalkan' });
});

module.exports = {
  createRequest,
  getRequests,
  updateRequest,
  cancelRequest
};
