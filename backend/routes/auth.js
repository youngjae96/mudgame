const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PlayerData = require('../models/PlayerData');
const BannedIp = require('../models/BannedIp');
const router = express.Router();
const SECRET = 'your_jwt_secret';
const auth = require('../middlewares/auth');

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '필수 입력값 누락' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  // BannedIp 컬렉션에 등록된 IP 차단
  const bannedIp = await BannedIp.findOne({ ip });
  if (bannedIp) return res.status(403).json({ error: '이 IP는 차단되어 회원가입이 불가합니다.' });
  // banned: true인 유저의 createdIp, lastLoginIp와 동일한 IP는 차단
  const bannedIpUsers = await User.find({ banned: true, $or: [ { createdIp: ip }, { lastLoginIp: ip } ] });
  if (bannedIpUsers.length > 0) return res.status(403).json({ error: '이 IP는 차단되어 회원가입이 불가합니다.' });
  const bannedUser = await User.findOne({ username, banned: true });
  if (bannedUser) return res.status(403).json({ error: '이 계정은 차단되어 회원가입이 불가합니다.' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hash, createdIp: ip });
    await PlayerData.create({
      userId: user._id,
      name: user.username,
      world: 1,
      position: { x: 4, y: 4 },
      hp: 30,
      maxHp: 30,
      mp: 10,
      maxMp: 10,
      str: 5,
      dex: 5,
      int: 5,
      atk: 3,
      def: 1,
      gold: 100,
      inventory: [],
      strExp: 0,
      strExpMax: 10,
      dexExp: 0,
      dexExpMax: 10,
      intExp: 0,
      intExpMax: 10,
      equipWeapon: null,
      equipArmor: null,
    });
    res.json({ success: true, userId: user._id });
  } catch (e) {
    res.status(400).json({ error: '이미 존재하는 닉네임입니다.' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: '존재하지 않는 계정입니다.' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  // BannedIp 컬렉션에 등록된 IP 차단
  const bannedIp = await BannedIp.findOne({ ip });
  if (bannedIp) return res.status(403).json({ error: '이 IP는 차단되어 로그인할 수 없습니다.' });
  // banned: true인 유저의 createdIp, lastLoginIp와 동일한 IP는 차단
  const bannedIpUsers = await User.find({ banned: true, $or: [ { createdIp: ip }, { lastLoginIp: ip } ] });
  if (bannedIpUsers.length > 0) return res.status(403).json({ error: '이 IP는 차단되어 로그인할 수 없습니다.' });
  if (user.banned) return res.status(403).json({ error: '이 계정은 차단되어 로그인할 수 없습니다.' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
  const token = jwt.sign({ userId: user._id, username: user.username }, SECRET, { expiresIn: '7d' });
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