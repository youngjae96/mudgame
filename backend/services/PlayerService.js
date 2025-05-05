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
}

module.exports = PlayerService; 