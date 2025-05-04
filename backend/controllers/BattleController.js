/**
 * BattleController: REST API용 전투 컨트롤러
 * - attack: 플레이어가 몬스터를 공격
 */
const PlayerData = require('../models/PlayerData');
const { getRoom } = require('../data/map');
const { processBattle } = require('../battle');
const { sendCharacterInfo } = require('../utils/broadcast');

const BattleController = {
  /**
   * 플레이어가 몬스터를 공격
   */
  async attack(req, res, next) {
    try {
      const { monsterId, x, y, world } = req.body;
      if (!monsterId || x == null || y == null || world == null) {
        return res.status(400).json({ error: '필수 파라미터 누락' });
      }
      // 플레이어 데이터 불러오기
      const pdata = await PlayerData.findOne({ userId: req.user.userId });
      if (!pdata) return res.status(404).json({ error: '플레이어 데이터 없음' });
      // Room/Monster 찾기 (메모리/DB 상황에 따라 실제 게임과 다를 수 있음)
      const room = getRoom(world, x, y);
      if (!room) return res.status(404).json({ error: '해당 위치에 방이 없음' });
      const mIdx = room.monsters.findIndex((m) => m.id === monsterId);
      if (mIdx === -1) return res.status(404).json({ error: '해당 몬스터가 없음' });
      // 임시 Player/Monster 객체 생성 (실제 게임 서버와 완전 동기화는 아님)
      const player = Object.assign({}, pdata.toObject ? pdata.toObject() : pdata);
      const monster = room.monsters[mIdx];
      // 전투 처리
      const result = processBattle(player, monster, room, { x: 4, y: 4 });
      // 골드 등 변경사항 DB 반영
      pdata.gold = player.gold;
      pdata.hp = player.hp;
      pdata.maxHp = player.maxHp;
      pdata.str = player.str;
      pdata.dex = player.dex;
      pdata.int = player.int;
      pdata.strExp = player.strExp;
      pdata.strExpMax = player.strExpMax;
      pdata.dexExp = player.dexExp;
      pdata.dexExpMax = player.dexExpMax;
      pdata.intExp = player.intExp;
      pdata.intExpMax = player.intExpMax;
      pdata.equipWeapon = player.equipWeapon;
      pdata.equipArmor = player.equipArmor;
      await pdata.save();
      // 결과 반환
      res.json({ success: true, log: result.log, player, monster, result });
      // 클라이언트에 최신 골드/스탯 정보 전송
      if (req.ws && req.ws.readyState === 1) {
        sendCharacterInfo({ ...player, ws: req.ws });
      }
    } catch (err) {
      next(err);
    }
  }
};

module.exports = BattleController; 