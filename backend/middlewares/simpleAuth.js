const User = require('../models/User');
const bcrypt = require('bcrypt');

module.exports = async (req, res, next) => {
  // POST/PUT: req.body, GET: req.query
  const { username, password } = req.body.username ? req.body : req.query;
  if (!username || !password) return res.status(401).json({ error: '닉네임/비번 필요' });
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: '존재하지 않는 계정' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: '비번 불일치' });
  req.user = user;
  next();
}; 