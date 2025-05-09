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
  if (username.length > 5) return res.status(400).json({ error: '닉네임은 5글자까지 가능합니다.' });
  // 한글, 영어, 숫자만 허용 (공백, 특수문자 제한)
  if (!/^[a-zA-Z0-9가-힣]+$/.test(username)) {
    return res.status(400).json({ error: '닉네임은 한글, 영어, 숫자만 사용할 수 있습니다.' });
  }
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  // BannedIp 컬렉션에 등록된 IP 차단
  const bannedIp = await BannedIp.findOne({ ip });
  if (bannedIp) return res.status(403).json({ error: '이 IP는 차단되어 회원가입이 불가합니다.' });
  // banned: true인 유저의 createdIp, lastLoginIp와 동일한 IP는 차단
  const bannedIpUsers = await User.find({ banned: true, $or: [ { createdIp: ip }, { lastLoginIp: ip } ] });
  if (bannedIpUsers.length > 0) return res.status(403).json({ error: '이 IP는 차단되어 회원가입이 불가합니다.' });
  const bannedUser = await User.findOne({ username, banned: true });
  if (bannedUser) return res.status(403).json({ error: '이 계정은 차단되어 회원가입이 불가합니다.' });
  // 같은 IP로 이미 가입된 계정이 있으면 거부
  const existingUserByIp = await User.findOne({ createdIp: ip });
  if (existingUserByIp) {
    return res.status(400).json({ error: '이 IP에서는 이미 계정이 생성되었습니다.' });
  }
  const hash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await User.create({ username, password: hash, createdIp: ip });
  } catch (e) {
    return res.status(400).json({ error: '이미 존재하는 닉네임입니다.' });
  }
  try {
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
    await User.deleteOne({ _id: user._id });
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: '존재하지 않는 계정입니다.' });
  const pdata = await PlayerData.findOne({ userId: user._id });
  if (!pdata) return res.status(400).json({ error: '플레이어 데이터가 존재하지 않습니다. 관리자에게 문의하세요.' });
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
  // Access Token: 1시간, Refresh Token: 7일
  const accessToken = jwt.sign({ userId: user._id, username: user.username }, SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user._id, username: user.username }, SECRET, { expiresIn: '7d' });
  user.lastLoginIp = ip;
  user.lastLoginAt = new Date();
  user.refreshToken = refreshToken;
  await user.save();
  res.json({ success: true, accessToken, refreshToken });
});

// Refresh Token으로 Access Token 재발급
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh Token이 필요합니다.' });
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, SECRET);
  } catch (e) {
    return res.status(401).json({ error: '유효하지 않은 Refresh Token입니다.' });
  }
  const user = await User.findOne({ _id: decoded.userId, refreshToken });
  if (!user) return res.status(401).json({ error: '유효하지 않은 Refresh Token입니다.' });
  // 새 Access Token 발급 (1시간)
  const accessToken = jwt.sign({ userId: user._id, username: user.username }, SECRET, { expiresIn: '1h' });
  res.json({ success: true, accessToken });
});

// JWT 인증 테스트용 엔드포인트
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: { username: req.user.username, userId: req.user.userId } });
});

module.exports = router; 