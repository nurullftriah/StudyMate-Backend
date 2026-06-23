require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const PartnerRequest = require('./models/PartnerRequest');
const Message = require('./models/Message');

const users = [
  {
    name: 'Vins',
    username: 'vins',
    email: 'vins@example.com',
    university: 'Institut Teknologi Bacharuddin Jusuf Habibie',
    studyProgram: 'Ilmu Komputer',
    interests: ['UI Design', 'Prototyping', 'Wireframing', 'Web Development'],
    skillLevel: 'Menengah',
    bio: 'Ingin mencari partner untuk belajar UI/UX dan rekayasa web.'
  },
  {
    name: 'Keyra Leora',
    username: 'keyra',
    email: 'keyra@example.com',
    university: 'Universitas Negeri Makassar',
    studyProgram: 'Sistem Informasi',
    interests: ['Pemrograman', 'Web Development', 'Database'],
    skillLevel: 'Pemula',
    bio: 'Aktif belajar pemrograman web dan ingin berdiskusi dengan teman belajar.'
  },
  {
    name: 'Fathzan Prayoga',
    username: 'fathzan',
    email: 'fathzan@example.com',
    university: 'Universitas Hasanuddin',
    studyProgram: 'Desain UI/UX',
    interests: ['UI Design', 'Research', 'Figma'],
    skillLevel: 'Menengah',
    bio: 'Suka mengerjakan desain antarmuka dan usability testing.'
  },
  {
    name: 'User A',
    username: 'usera',
    email: 'usera@example.com',
    university: 'Institut Teknologi Bacharuddin Jusuf Habibie',
    studyProgram: 'Pemrograman Web',
    interests: ['React', 'Node.js', 'MongoDB'],
    skillLevel: 'Mahir',
    bio: 'Fokus belajar full-stack web.'
  },
  {
    name: 'User B',
    username: 'userb',
    email: 'userb@example.com',
    university: 'Universitas Hasanuddin',
    studyProgram: 'Desain UI/UX',
    interests: ['UI Design', 'Prototyping', 'Figma'],
    skillLevel: 'Menengah',
    bio: 'Mencari teman diskusi desain aplikasi.'
  },
  {
    name: 'User C',
    username: 'userc',
    email: 'userc@example.com',
    university: 'Universitas Negeri Makassar',
    studyProgram: 'Data Science',
    interests: ['Data Science', 'Python', 'Machine Learning'],
    skillLevel: 'Pemula',
    bio: 'Sedang belajar data science dari dasar.'
  },
  {
    name: 'User D',
    username: 'userd',
    email: 'userd@example.com',
    university: 'Institut Teknologi Bacharuddin Jusuf Habibie',
    studyProgram: 'Statistika',
    interests: ['Statistika', 'Matematika', 'Data Analysis'],
    skillLevel: 'Menengah',
    bio: 'Suka belajar statistik dan analisis data.'
  }
];

async function runSeed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    PartnerRequest.deleteMany({}),
    Message.deleteMany({})
  ]);

  const password = await bcrypt.hash('password123', 10);
  const createdUsers = await User.insertMany(users.map((user) => ({ ...user, password })));

  const vins = createdUsers.find((user) => user.email === 'vins@example.com');
  const keyra = createdUsers.find((user) => user.email === 'keyra@example.com');
  const fathzan = createdUsers.find((user) => user.email === 'fathzan@example.com');
  const userA = createdUsers.find((user) => user.email === 'usera@example.com');
  const userB = createdUsers.find((user) => user.email === 'userb@example.com');

  await PartnerRequest.create([
    { sender: keyra._id, receiver: vins._id, message: 'Halo Vins, ayo belajar React bersama.', status: 'pending' },
    { sender: userA._id, receiver: vins._id, message: 'Saya ingin belajar pemrograman web.', status: 'pending' },
    { sender: vins._id, receiver: fathzan._id, message: 'Ayo diskusi UI/UX.', status: 'accepted', respondedAt: new Date() },
    { sender: vins._id, receiver: userB._id, message: 'Boleh belajar Figma bareng?', status: 'accepted', respondedAt: new Date() }
  ]);

  await Message.create([
    { sender: vins._id, receiver: fathzan._id, text: 'Halo, kapan kita belajar desain prototype?' },
    { sender: fathzan._id, receiver: vins._id, text: 'Sore ini bisa. Kita bahas user flow dulu.' },
    { sender: userB._id, receiver: vins._id, text: 'Besok kita lanjutkan desain halaman dashboard ya.' }
  ]);

  console.log('Seed selesai. Password semua akun demo: password123');
  await mongoose.connection.close();
}

runSeed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
