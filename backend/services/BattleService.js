/**
 * BattleService: 전투 관련 비즈니스 로직 서비스
 * - processBattle: 플레이어와 몬스터의 전투 처리 및 결과 반환
 */
const { ITEM_NAME_MONGHWA } = require('../data/items');
const { calcExpBonus, calcGoldDrop } = require('../utils/expUtils');

class BattleService {
  /**
   * 플레이어와 몬스터의 전투 처리 및 결과 반환
   */
  static processBattle(player, monster, room, VILLAGE_POS) {
    let log = [];
    let playerDmg;
    if (player.equipWeapon && player.equipWeapon.name === ITEM_NAME_MONGHWA) {
      playerDmg = 0;
    } else {
      playerDmg = Math.max(player.getAtk() - (monster.def || 0), 1);
    }
    monster.hp -= playerDmg;
    log.push({
      type: 'battle',
      subtype: 'attack',
      actor: player.name,
      target: monster.name,
      action: 'attack',
      value: playerDmg,
      monsterHp: Math.max(monster.hp,0),
      monsterMaxHp: monster.maxHp,
      text: `${monster.name}을(를) 공격!`,
    });

    // 골드 기반 expBonus 계산
    let expBonus = 1.0;
    if (monster.gold !== undefined) {
      expBonus = calcExpBonus(monster.gold);
    }

    if (player.gainStrExp) player.gainStrExp(1 * expBonus);
    if (player.gainDexExp) player.gainDexExp(0.5 * expBonus);

    let monsterDead = false;
    let playerDead = false;
    let goldDrop = 0;

    if (monster.hp <= 0 && playerDmg > 0) {
      room.monsters = room.monsters.filter(m => m.id !== monster.id);
      goldDrop = calcGoldDrop(monster);
      player.gold += goldDrop;
      log.push({
        type: 'battle',
        subtype: 'kill',
        actor: player.name,
        target: monster.name,
        action: 'kill',
        gold: goldDrop,
        result: 'monsterDead',
        text: `${monster.name}을(를) 처치!`,
      });
      monsterDead = true;
      // 아이템 드랍 처리
      if (monster.dropItems && monster.dropItems.length > 0) {
        const { SHOP_ITEMS } = require('../data/items');
        monster.dropItems.forEach((itemName, idx) => {
          const rate = monster.dropRates && monster.dropRates[idx] ? monster.dropRates[idx] : 0;
          if (Math.random() < rate) {
            // 아이템 상세 정보 찾기 (무기/방어구/소비)
            let found = null;
            for (const arr of Object.values(SHOP_ITEMS)) {
              found = arr.find(i => i.name === itemName);
              if (found) break;
            }
            if (found) {
              player.inventory.push({ ...found });
              log.push({
                type: 'system',
                subtype: 'event',
                message: `${monster.name}이(가) ${itemName}을(를) 드랍!`
              });
            }
          }
        });
      }
    } else {
      let monsterDmg = Math.max(1, monster.atk - player.getDef());
      player.hp -= monsterDmg;
      log.push({
        type: 'battle',
        subtype: 'counter',
        actor: monster.name,
        target: player.name,
        action: 'counter',
        value: monsterDmg,
        playerHp: Math.max(player.hp,0),
        playerMaxHp: player.maxHp,
        text: `${monster.name}의 반격!`,
      });
      // 자동 물약 사용 (Player 메서드 활용)
      const potionResult = player.autoUsePotion();
      if (potionResult) {
        log.push({
          type: 'battle',
          subtype: 'event',
          actor: player.name,
          action: 'autoPotion',
          value: potionResult.healAmount,
          text: `${potionResult.name}을(를) 자동으로 사용했습니다! (HP +${potionResult.healAmount}, 남은량: ${potionResult.left})`,
        });
      }
      if (player.hp <= 0) {
        player.hp = 1;
        log.push({
          type: 'battle',
          subtype: 'death',
          actor: player.name,
          target: null,
          action: 'death',
          result: 'playerDead',
          text: `당신은 쓰러졌으나 마을에서 깨어났습니다.`,
        });
        player.world = 1;
        player.position = { ...VILLAGE_POS };
        playerDead = true;
      }
    }
    return { log, monsterDead, playerDead, goldDrop, playerDmg };
  }
}

module.exports = BattleService; 