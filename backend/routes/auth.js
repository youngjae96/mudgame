const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const SECRET = 'your_jwt_secret';
const auth = require('../middlewares/auth');

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '필수 입력값 누락' });
  const hash = await bcrypt.hash(password, 10);
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  try {
    const user = await User.create({ username, password: hash, createdIp: ip });
    res.json({ success: true, userId: user._id });
  } catch (e) {
    res.status(400).json({ error: '이미 존재하는 닉네임입니다.' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: '존재하지 않는 계정입니다.' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
  const token = jwt.sign({ userId: user._id, username: user.username }, SECRET, { expiresIn: '7d' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  user.lastLoginIp = ip;
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ success: true, token });
});

// JWT 인증 테스트용 엔드포인트
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: { username: req.user.username, userId: req.user.userId } });
});

module.exports = router; 