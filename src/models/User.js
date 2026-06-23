const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: 6,
    select: false
  },
  university: {
    type: String,
    default: '',
    trim: true
  },
  studyProgram: {
    type: String,
    default: '',
    trim: true
  },
  interests: [{
    type: String,
    trim: true
  }],
  skillLevel: {
    type: String,
    enum: ['Pemula', 'Menengah', 'Mahir'],
    default: 'Pemula'
  },
  bio: {
    type: String,
    default: '',
    maxlength: 300
  },

  // tambahan hasil perbaikan UX
  learningMode: {
    type: String,
    enum: ['Online', 'Offline', 'Hybrid', ''],
    default: ''
  },
  availability: {
    type: String,
    default: '',
    trim: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },

  avatarColor: {
    type: String,
    default: '#426ca8'
  }
}, { timestamps: true });

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    university: this.university,
    studyProgram: this.studyProgram,
    interests: this.interests,
    skillLevel: this.skillLevel,
    bio: this.bio,
    learningMode: this.learningMode,
    availability: this.availability,
    profilePhoto: this.profilePhoto,
    avatarColor: this.avatarColor,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);