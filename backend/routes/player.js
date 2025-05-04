const express = require('express');
const auth = require('../middlewares/auth');
const PlayerRestController = require('../controllers/PlayerRestController');
const router = express.Router();

// 내 정보 조회 (JWT 인증 필요)
router.get('/me', auth, PlayerRestController.getMyInfo);
// 내 인벤토리 조회 (JWT 인증 필요)
router.get('/inventory', auth, PlayerRestController.getMyInventory);

module.exports = router; 