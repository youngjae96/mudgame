const express = require('express');
const auth = require('../middlewares/auth');
const BattleController = require('../controllers/BattleController');
const router = express.Router();

// 몬스터 공격 (JWT 인증 필요)
router.post('/attack', auth, BattleController.attack);

module.exports = router; 