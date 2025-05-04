// battle.js
const { ITEM_NAME_MONGHWA } = require('./data/items');
const { calcExpBonus, calcGoldDrop } = require('./utils/expUtils');
const BattleService = require('./services/BattleService');

function processBattle(player, monster, room, VILLAGE_POS) {
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
      player.position = { ...VILLAGE_POS };
      playerDead = true;
    }
  }
  return { log, monsterDead, playerDead, goldDrop, playerDmg };
}

module.exports = {
  processBattle: BattleService.processBattle
}; 