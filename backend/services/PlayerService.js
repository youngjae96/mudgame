/**
 * PlayerService: 플레이어 관련 비즈니스 로직 서비스
 * - equipItem: 아이템 장착
 * - unequipItem: 장비 해제
 */
const { ITEM_TYPE } = require('../data/items');

class PlayerService {
  constructor({ savePlayerData, sendCharacterInfo, sendInventory }) {
    this.savePlayerData = savePlayerData;
    this.sendCharacterInfo = sendCharacterInfo;
    this.sendInventory = sendInventory;
  }

  /**
   * 아이템 장착
   */
  async equipItem({ ws, playerName, message, players }) {
    const player = players[playerName];
    if (!player) return;
    const itemName = message.trim().replace('/장착 ', '').trim();
    const idx = player.inventory.findIndex((item) => item.name === itemName);
    if (idx === -1) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '인벤토리에 해당 아이템이 없습니다.' }));
      return;
    }
    const item = player.inventory[idx];
    if (item.type === ITEM_TYPE.WEAPON || item.type === ITEM_TYPE.ARMOR) {
      if (item.type === ITEM_TYPE.WEAPON && player.equipWeapon) player.inventory.push(player.equipWeapon);
      if (item.type === ITEM_TYPE.ARMOR && player.equipArmor) player.inventory.push(player.equipArmor);
      player.inventory.splice(idx, 1);
      player.equipItem(item);
      await this.savePlayerData(playerName).catch(() => {});
      this.sendCharacterInfo(player);
      this.sendInventory(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${item.name}을(를) 장착했습니다.` }));
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '장착할 수 없는 아이템입니다.' }));
    }
  }

  /**
   * 장비 해제
   */
  async unequipItem({ ws, playerName, message, players }) {
    const player = players[playerName];
    if (!player) return;
    const typeStr = message.trim().replace('/해제 ', '').trim();
    let type = null;
    if (typeStr === '무기') type = ITEM_TYPE.WEAPON;
    if (typeStr === '방어구') type = ITEM_TYPE.ARMOR;
    if (type === ITEM_TYPE.WEAPON && player.equipWeapon) {
      player.inventory.push(player.equipWeapon);
      player.unequipItem(type);
      await this.savePlayerData(playerName).catch(() => {});
      this.sendCharacterInfo(player);
      this.sendInventory(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${typeStr}를 해제했습니다.` }));
    } else if (type === ITEM_TYPE.ARMOR && player.equipArmor) {
      player.inventory.push(player.equipArmor);
      player.unequipItem(type);
      await this.savePlayerData(playerName).catch(() => {});
      this.sendCharacterInfo(player);
      this.sendInventory(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${typeStr}를 해제했습니다.` }));
    } else {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '해제할 수 있는 장비 종류는 무기, 방어구입니다.' }));
    }
  }

  /**
   * 달콤한 사탕 사용 (경험치 버프)
   */
  async useCandyItem({ ws, playerName, players }) {
    const player = players[playerName];
    if (!player) return;
    const candy = player.inventory.find(item => item.name === '사탕');
    if (!candy || (candy.count || 1) < 1) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '인벤토리에 사탕이 없습니다.' }));
      return;
    }
    // 사탕 1개 차감
    candy.count = (candy.count || 1) - 1;
    if (candy.count <= 0) {
      player.inventory = player.inventory.filter(item => item !== candy);
    }
    // 현재 버프 만료시간과 비교하여 30분 연장(최대 12시간)
    const maxBuff = 12 * 60 * 60 * 1000; // 12시간
    const addBuff = 30 * 60 * 1000; // 30분
    const now = Date.now();
    const left = player.expCandyBuffUntil - now;
    if (left >= maxBuff - addBuff) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '사탕 버프가 최대치(12시간)에 가깝게 남아 있어 사용할 수 없습니다. (30분 이하만 연장 가능)' }));
      return;
    }
    let newUntil = Math.max(player.expCandyBuffUntil || 0, now) + addBuff;
    if (newUntil - now > maxBuff) newUntil = now + maxBuff;
    player.expCandyBuffUntil = newUntil;
    await this.savePlayerData(playerName).catch(() => {});
    this.sendCharacterInfo(player);
    this.sendInventory(player);
    const leftSec = Math.floor((player.expCandyBuffUntil - now) / 1000);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `달콤한 사탕을 사용했습니다! 경험치 +20% (${leftSec}초 남음)` }));
  }
}

module.exports = PlayerService; 