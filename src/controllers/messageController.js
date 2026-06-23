const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const PartnerRequest = require('../models/PartnerRequest');
const Message = require('../models/Message');
const User = require('../models/User');

async function findAcceptedConnection(userId, partnerId) {
  return PartnerRequest.findOne({
    status: 'accepted',
    $or: [
      { sender: userId, receiver: partnerId },
      { sender: partnerId, receiver: userId }
    ]
  });
}

const getConversations = asyncHandler(async (req, res) => {
  const connections = await PartnerRequest.find({
    status: 'accepted',
    $or: [
      { sender: req.user._id },
      { receiver: req.user._id }
    ]
  }).populate('sender', 'name username email university studyProgram interests avatarColor')
    .populate('receiver', 'name username email university studyProgram interests avatarColor');

  const conversations = await Promise.all(connections.map(async (connection) => {
    const partner = String(connection.sender._id) === String(req.user._id) ? connection.receiver : connection.sender;
    const lastMessage = await Message.findOne({
      $or: [
        { sender: req.user._id, receiver: partner._id },
        { sender: partner._id, receiver: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    const unreadCount = await Message.countDocuments({
      sender: partner._id,
      receiver: req.user._id,
      readAt: { $exists: false }
    });

    return {
      partner,
      lastMessage,
      unreadCount
    };
  }));

  conversations.sort((a, b) => {
    const dateA = a.lastMessage ? a.lastMessage.createdAt : a.partner.createdAt;
    const dateB = b.lastMessage ? b.lastMessage.createdAt : b.partner.createdAt;
    return new Date(dateB) - new Date(dateA);
  });

  res.json({ conversations });
});

const getMessages = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;

  if (!mongoose.isValidObjectId(partnerId)) {
    res.status(400);
    throw new Error('ID partner tidak valid');
  }

  const partner = await User.findById(partnerId);
  if (!partner) {
    res.status(404);
    throw new Error('Partner tidak ditemukan');
  }

  const connection = await findAcceptedConnection(req.user._id, partnerId);
  if (!connection) {
    res.status(403);
    throw new Error('Chat hanya dapat digunakan dengan partner yang sudah diterima');
  }

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: partnerId },
      { sender: partnerId, receiver: req.user._id }
    ]
  }).sort({ createdAt: 1 });

  await Message.updateMany({
    sender: partnerId,
    receiver: req.user._id,
    readAt: { $exists: false }
  }, {
    $set: { readAt: new Date() }
  });

  res.json({ partner, messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Pesan tidak boleh kosong');
  }

  if (!mongoose.isValidObjectId(partnerId)) {
    res.status(400);
    throw new Error('ID partner tidak valid');
  }

  const connection = await findAcceptedConnection(req.user._id, partnerId);
  if (!connection) {
    res.status(403);
    throw new Error('Kirim pesan hanya dapat dilakukan dengan partner yang sudah diterima');
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: partnerId,
    text
  });

  res.status(201).json({ message });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage
};
