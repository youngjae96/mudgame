const express = require('express');
const auth = require('../middlewares/auth');
const { SHOP_ITEMS } = require('../data/items');
const router = express.Router();

// 상점 아이템 목록 조회 (JWT 인증 필요)
router.get('/items', auth, (req, res) => {
  res.json({ success: true, items: SHOP_ITEMS });
});

module.exports = router; 