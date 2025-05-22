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
      let pdata = await PlayerData.findOne({ userId: req.user._id });
      // userId로 못 찾으면 name(=username)으로 찾고, userId가 다르면 맞춰줌
      if (!pdata) {
        pdata = await PlayerData.findOne({ name: req.user.username });
        if (pdata && pdata.userId != req.user._id) {
          pdata.userId = req.user._id;
          await pdata.save();
        }
      }
      if (!pdata) {
        // PlayerData가 아예 없으면 새로 생성
        pdata = await PlayerData.create({
          userId: req.user._id,
          name: req.user.username,
          world: 1,
          position: { x: 4, y: 4 },
          hp: 30, maxHp: 30, mp: 10, maxMp: 10,
          str: 5, dex: 5, int: 5, atk: 3, def: 1, gold: 100,
          inventory: [],
        });
      }
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
      let pdata = await PlayerData.findOne({ userId: req.user._id });
      if (!pdata) {
        pdata = await PlayerData.findOne({ name: req.user.username });
        if (pdata && pdata.userId != req.user._id) {
          pdata.userId = req.user._id;
          await pdata.save();
        }
      }
      if (!pdata) {
        pdata = await PlayerData.create({
          userId: req.user._id,
          name: req.user.username,
          world: 1,
          position: { x: 4, y: 4 },
          hp: 30, maxHp: 30, mp: 10, maxMp: 10,
          str: 5, dex: 5, int: 5, atk: 3, def: 1, gold: 100,
          inventory: [],
        });
      }
      res.json({ success: true, inventory: pdata.inventory });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = PlayerRestController; 