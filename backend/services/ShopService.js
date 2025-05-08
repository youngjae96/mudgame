/**
 * ShopService: 상점 관련 비즈니스 로직 서비스
 * - buyItem: 아이템 구매
 * - sellItem: 아이템 판매
 */
class ShopService {
  constructor({ savePlayerData, sendInventory, sendCharacterInfo }) {
    this.savePlayerData = savePlayerData;
    this.sendInventory = sendInventory;
    this.sendCharacterInfo = sendCharacterInfo;
  }

  /**
   * 아이템 구매
   */
  async buyItem({ ws, playerName, message, players, getRoom, SHOP_ITEMS }) {
    const player = players[playerName];
    if (!player) { console.log('[구매명령] 플레이어 없음'); return; }
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    if (room.type !== 'village') {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '상점은 마을에서만 이용할 수 있습니다.' }));
      return;
    }
    const itemName = message.trim().replace('/구매 ', '').trim();
    let foundItem = null;
    for (const cat of Object.keys(SHOP_ITEMS)) {
      foundItem = SHOP_ITEMS[cat].find((item) => item.name === itemName);
      if (foundItem) break;
    }
    if (!foundItem) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '상점에 없는 아이템입니다.' }));
      return;
    }
    if (player.gold < foundItem.price) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '골드가 부족합니다.' }));
      return;
    }
    if (player.inventory.length >= 50) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '인벤토리는 최대 50개까지만 보관할 수 있습니다.' }));
      return;
    }
    player.gold -= foundItem.price;
    // 소모품(중첩 물약) 구매 로직
    if ((foundItem.type && (foundItem.type.toLowerCase() === 'consumable' || foundItem.type === '잡화')) && foundItem.total) {
      const existingItem = player.inventory.find(item =>
        item.name === itemName &&
        (item.type && (item.type.toLowerCase() === 'consumable' || item.type === '잡화'))
      );
      if (existingItem) {
        existingItem.total += foundItem.total;
        existingItem.count = (existingItem.count || 1) + 1;
      } else {
        player.inventory.push({ ...foundItem, count: 1 });
      }
    } else {
      player.inventory.push({ ...foundItem });
    }
    await this.savePlayerData(playerName).catch(() => {});
    this.sendInventory(player);
    this.sendCharacterInfo(player);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${foundItem.name}을(를) 구매했습니다!` }));
  }

  /**
   * 아이템 판매
   */
  async sellItem({ ws, playerName, message, players, getRoom, SHOP_ITEMS }) {
    const player = players[playerName];
    if (!player) return;
    const { x, y } = player.position;
    const room = getRoom(player.world, x, y);
    if (room.type !== 'village') {
      ws.send(JSON.stringify({ type: 'system', subtype: 'guide', message: '상점은 마을에서만 이용할 수 있습니다.' }));
      return;
    }
    const itemName = message.trim().replace('/판매 ', '').trim();
    const idx = player.inventory.findIndex((item) => item.name === itemName);
    if (idx === -1) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '인벤토리에 해당 아이템이 없습니다.' }));
      return;
    }
    let foundItem = null;
    for (const cat of Object.keys(SHOP_ITEMS)) {
      foundItem = SHOP_ITEMS[cat].find((item) => item.name === itemName);
      if (foundItem) break;
    }
    if (!foundItem) {
      const { ITEM_POOL } = require('../data/items');
      if (Array.isArray(ITEM_POOL)) {
        foundItem = ITEM_POOL.find(i => i.name === itemName);
      }
    }
    if (!foundItem || !foundItem.price) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '상점에서 판매할 수 없는 아이템입니다.' }));
      return;
    }
    const sellPrice = Math.floor(foundItem.price * 0.5);
    player.gold += sellPrice;
    // 소모품(중첩 물약) 판매 로직
    if ((player.inventory[idx].type && (player.inventory[idx].type.toLowerCase() === 'consumable' || player.inventory[idx].type === '잡화')) && player.inventory[idx].count) {
      player.inventory[idx].count -= 1;
      player.inventory[idx].total -= foundItem.total || player.inventory[idx].perUse || 0;
      if (player.inventory[idx].count <= 0 || player.inventory[idx].total <= 0) {
        player.inventory.splice(idx, 1);
      }
    } else {
      player.inventory.splice(idx, 1);
    }
    await this.savePlayerData(playerName).catch(() => {});
    this.sendInventory(player);
    this.sendCharacterInfo(player);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${itemName}을(를) 판매했습니다! (+${sellPrice}G)` }));
  }
}

module.exports = ShopService; 