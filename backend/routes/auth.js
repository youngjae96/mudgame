const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PlayerData = require('../models/PlayerData');
const router = express.Router();
const SECRET = 'your_jwt_secret';
const auth = require('../middlewares/auth');

// 회원가입
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '필수 입력값 누락' });

  // IP 추출
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  const existIp = await User.findOne({ createdIp: ip });
  if (existIp) return res.status(400).json({ error: '같은 IP에서는 1계정만 가입할 수 있습니다.' });

  const hash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await User.create({ username, password: hash, createdIp: ip });
    await PlayerData.create({
      userId: user._id,
      name: user.username,
      world: 1,
      position: { x: 4, y: 4 },
      hp: 30, maxHp: 30, mp: 10, maxMp: 10,
      str: 5, dex: 5, int: 5, atk: 3, def: 1, gold: 100,
      inventory: [],
    });
    res.json({ success: true, userId: user._id });
  } catch (e) {
    res.status(400).json({ error: '이미 존재하는 닉네임입니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: '존재하지 않는 계정입니다.' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
  // Access Token: 7일
  const accessToken = jwt.sign({ userId: user._id, username: user.username }, SECRET, { expiresIn: '7d' });
  res.json({ success: true, accessToken });
});

// 비밀번호 변경
router.post('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '필수 입력값 누락' });
  }
  const user = await User.findOne({ _id: req.user.userId });
  if (!user) return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });

  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) return res.status(400).json({ error: '기존 비밀번호가 일치하지 않습니다.' });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true });
});

module.exports = router; 