/**
 * PlayerRestController: REST API용 플레이어 정보/인벤토리 컨트롤러
 * - getMyInfo: 내 정보 반환
 * - getMyInventory: 내 인벤토리 반환
 */
const PlayerData = require('../models/PlayerData');

const PlayerRestController = {
  /**
   * 내 정보 반환
   */
  async getMyInfo(req, res, next) {
    try {
      const pdata = await PlayerData.findOne({ userId: req.user.userId });
      if (!pdata) return res.status(404).json({ error: '플레이어 데이터 없음' });
      res.json({
        success: true,
        player: {
          username: pdata.name,
          world: pdata.world,
          position: pdata.position,
          hp: pdata.hp,
          maxHp: pdata.maxHp,
          mp: pdata.mp,
          maxMp: pdata.maxMp,
          str: pdata.str,
          dex: pdata.dex,
          int: pdata.int,
          gold: pdata.gold,
          equipWeapon: pdata.equipWeapon,
          equipArmor: pdata.equipArmor
        }
      });
    } catch (err) {
      next(err);
    }
  },
  /**
   * 내 인벤토리 반환
   */
  async getMyInventory(req, res, next) {
    try {
      const pdata = await PlayerData.findOne({ userId: req.user.userId });
      if (!pdata) return res.status(404).json({ error: '플레이어 데이터 없음' });
      res.json({ success: true, inventory: pdata.inventory });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = PlayerRestController; 