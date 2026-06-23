const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const PartnerRequest = require('../models/PartnerRequest');
const Message = require('../models/Message');
const normalizeInterests = require('../utils/normalizeInterests');

function regex(value) {
  return new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'username',
    'university',
    'studyProgram',
    'interests',
    'skillLevel',
    'bio',
    'learningMode',
    'availability',
    'profilePhoto'
  ];

  const update = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      update[field] = field === 'interests'
        ? normalizeInterests(req.body[field])
        : req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true
  });

  res.json({ user: user.toSafeJSON() });
});

const listPartners = asyncHandler(async (req, res) => {
  const { topic, university, studyProgram, keyword, availability, learningMode } = req.query;

  const query = {
    _id: { $ne: req.user._id }
  };

  if (topic) {
    query.interests = { $elemMatch: { $regex: regex(topic) } };
  }

  if (university) {
    query.university = { $regex: regex(university) };
  }

  if (studyProgram) {
    query.studyProgram = { $regex: regex(studyProgram) };
  }

  if (availability) {
    query.availability = { $regex: regex(availability) };
  }

  if (learningMode) {
    query.learningMode = { $regex: regex(learningMode) };
  }

  if (keyword) {
    const keywordRegex = regex(keyword);
    query.$or = [
      { name: keywordRegex },
      { username: keywordRegex },
      { email: keywordRegex },
      { university: keywordRegex },
      { studyProgram: keywordRegex },
      { availability: keywordRegex },
      { learningMode: keywordRegex },
      { interests: { $elemMatch: { $regex: keywordRegex } } }
    ];
  }

  const users = await User.find(query).sort({ createdAt: -1 }).limit(30);
  const userIds = users.map((user) => user._id);

  const requests = await PartnerRequest.find({
    $or: [
      { sender: req.user._id, receiver: { $in: userIds } },
      { receiver: req.user._id, sender: { $in: userIds } }
    ],
    status: { $in: ['pending', 'accepted'] }
  });

  const statusByUserId = {};
  requests.forEach((request) => {
    const otherId = String(request.sender) === String(req.user._id)
      ? request.receiver
      : request.sender;
    statusByUserId[String(otherId)] = request.status;
  });

  res.json({
    partners: users.map((user) => ({
      ...user.toSafeJSON(),
      connectionStatus: statusByUserId[String(user._id)] || 'none'
    }))
  });
});

const getDashboard = asyncHandler(async (req, res) => {
  const acceptedRequests = await PartnerRequest.find({
    status: 'accepted',
    $or: [
      { sender: req.user._id },
      { receiver: req.user._id }
    ]
  });

  const partnerIds = acceptedRequests.map((request) => {
    return String(request.sender) === String(req.user._id)
      ? request.receiver
      : request.sender;
  });

  const incomingPendingCount = await PartnerRequest.countDocuments({
    receiver: req.user._id,
    status: 'pending'
  });

  const outgoingPendingCount = await PartnerRequest.countDocuments({
    sender: req.user._id,
    status: 'pending'
  });

  const messageUserIds = await Message.distinct('sender', { receiver: req.user._id });
  const messageReceiverIds = await Message.distinct('receiver', { sender: req.user._id });
  const chatActive = new Set([...messageUserIds, ...messageReceiverIds].map(String)).size;

  const currentInterests = req.user.interests || [];
  const recommendationQuery = {
    _id: { $ne: req.user._id, $nin: partnerIds }
  };

  if (currentInterests.length > 0) {
    recommendationQuery.interests = { $in: currentInterests };
  }

  let recommendations = await User.find(recommendationQuery)
    .limit(4)
    .sort({ createdAt: -1 });

  if (recommendations.length < 4) {
    recommendations = await User.find({ _id: { $ne: req.user._id } })
      .limit(4)
      .sort({ createdAt: -1 });
  }

  res.json({
    stats: {
      activePartners: acceptedRequests.length,
      requests: incomingPendingCount + outgoingPendingCount,
      activeChats: chatActive
    },
    recommendations: recommendations.map((user) => user.toSafeJSON())
  });
});

const getUserById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('ID pengguna tidak valid');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Pengguna tidak ditemukan');
  }

  res.json({ user: user.toSafeJSON() });
});

module.exports = {
  getProfile,
  updateProfile,
  listPartners,
  getDashboard,
  getUserById
};