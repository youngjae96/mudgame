const express = require('express');
const simpleAuth = require('../middlewares/simpleAuth');
const PlayerRestController = require('../controllers/PlayerRestController');
const router = express.Router();

// 내 정보 조회 (JWT 인증 필요)
router.get('/me', simpleAuth, PlayerRestController.getMyInfo);
// 내 인벤토리 조회 (JWT 인증 필요)
router.get('/inventory', simpleAuth, PlayerRestController.getMyInventory);

module.exports = router; 