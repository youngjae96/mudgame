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
    // '/구매 아이템명 [갯수]' 파싱
    const args = message.trim().replace('/구매 ', '').trim().split(' ');
    let count = 1;
    let itemName = args[0];
    if (args.length > 1 && !isNaN(Number(args[args.length - 1]))) {
      count = Math.max(1, parseInt(args[args.length - 1], 10));
      itemName = args.slice(0, -1).join(' ');
    } else {
      itemName = args.join(' ');
    }
    let foundItem = null;
    for (const cat of Object.keys(SHOP_ITEMS)) {
      foundItem = SHOP_ITEMS[cat].find((item) => item.name === itemName);
      if (foundItem) break;
    }
    if (!foundItem) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '상점에 없는 아이템입니다.' }));
      return;
    }
    if (count < 1) count = 1;
    if (count > 50) count = 50;
    const totalPrice = foundItem.price * count;
    if (player.gold < totalPrice) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `골드가 부족합니다. (필요: ${totalPrice}G)` }));
      return;
    }
    if (player.inventory.length >= 50) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '인벤토리는 최대 50개까지만 보관할 수 있습니다.' }));
      return;
    }
    // 인벤토리 공간 체크 및 아이템 추가
    let addSuccess = false;
    // 사탕만 별도 처리
    if (itemName === '사탕') {
      const existingItem = player.inventory.find(item => item.name === '사탕');
      let curCount = existingItem ? (existingItem.count || 1) : 0;
      if (curCount + count > 50) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `${itemName}은(는) 최대 50개까지만 보유할 수 있습니다.` }));
        return;
      }
      if (existingItem) {
        addSuccess = true;
        existingItem.count = curCount + count;
        if ('total' in existingItem) delete existingItem.total;
      } else {
        const newCandy = { ...foundItem, count: count };
        if ('total' in newCandy) delete newCandy.total;
        addSuccess = player.addToInventory(newCandy, ws);
      }
    } else if ((foundItem.type && (foundItem.type.toLowerCase() === 'consumable' || foundItem.type === '잡화')) && foundItem.total) {
      const existingItem = player.inventory.find(item =>
        item.name === itemName &&
        (item.type && (item.type.toLowerCase() === 'consumable' || item.type === '잡화'))
      );
      let curCount = existingItem ? (existingItem.count || 1) : 0;
      if (curCount + count > 50) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: `${itemName}은(는) 최대 50개까지만 보유할 수 있습니다.` }));
        return;
      }
      if (existingItem) {
        addSuccess = true;
        existingItem.total += foundItem.total * count;
        existingItem.count = curCount + count;
      } else {
        addSuccess = player.addToInventory({ ...foundItem, count: count, total: foundItem.total * count }, ws);
      }
    } else {
      // 무기/방어구 등은 여러 개 동시 구매 불가(1개만 허용)
      if (count > 1) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '이 아이템은 한 번에 1개만 구매할 수 있습니다.' }));
        return;
      }
      addSuccess = player.addToInventory({ ...foundItem }, ws);
    }
    if (!addSuccess) {
      return;
    }
    player.gold -= totalPrice;
    await this.savePlayerData(playerName).catch(() => {});
    this.sendInventory(player);
    this.sendCharacterInfo(player);
    ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${foundItem.name}을(를) ${count}개 구매했습니다!` }));
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
    // '/판매 아이템명 [갯수]' 파싱
    const args = message.trim().replace('/판매 ', '').trim().split(' ');
    let count = 1;
    let itemName = args[0];
    if (args.length > 1 && !isNaN(Number(args[args.length - 1]))) {
      count = Math.max(1, parseInt(args[args.length - 1], 10));
      itemName = args.slice(0, -1).join(' ');
    } else {
      itemName = args.join(' ');
    }
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
    // SHOP_ITEMS에 없으면 ITEM_POOL에서 shopSell: true인 아이템 허용
    if (!foundItem) {
      const { ITEM_POOL } = require('../data/items');
      foundItem = ITEM_POOL.find(i => i.name === itemName && i.shopSell === true && typeof i.price === 'number');
    }
    // 무인도 드랍템(플레임/서리/용/암흑/천공 시리즈)도 ITEM_POOL에서 찾아 판매 허용
    if (!foundItem) {
      const ISLAND_DROP_ITEMS = [
        '플레임소드', '플레임아머', '서리검', '서리갑옷',
        '용의 검', '용의 갑옷', '암흑검', '암흑갑옷',
        '천공의 갑옷', '천공의 검'
      ];
      if (ISLAND_DROP_ITEMS.includes(itemName)) {
        const { ITEM_POOL } = require('../data/items');
        if (Array.isArray(ITEM_POOL)) {
          foundItem = ITEM_POOL.find(i => i.name === itemName);
        }
      }
    }
    if (!foundItem || !foundItem.price) {
      ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '상점에서 판매할 수 없는 아이템입니다.' }));
      return;
    }
    if (count < 1) count = 1;
    // 소모품(중첩 물약) 판매 로직
    if ((player.inventory[idx].type && (player.inventory[idx].type.toLowerCase() === 'consumable' || player.inventory[idx].type === '잡화')) && player.inventory[idx].count) {
      if (count > player.inventory[idx].count) count = player.inventory[idx].count;
      const sellPrice = Math.floor(foundItem.price * 0.4) * count;
      player.gold += sellPrice;
      player.inventory[idx].count -= count;
      player.inventory[idx].total -= (foundItem.total || player.inventory[idx].perUse || 0) * count;
      if (player.inventory[idx].count <= 0 || player.inventory[idx].total <= 0) {
        player.inventory.splice(idx, 1);
      }
      await this.savePlayerData(playerName).catch(() => {});
      this.sendInventory(player);
      this.sendCharacterInfo(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${itemName}을(를) ${count}개 판매했습니다! (+${sellPrice}G)` }));
      return;
    } else {
      // 무기/방어구 등은 여러 개 동시 판매 불가(1개만 허용)
      if (count > 1) {
        ws.send(JSON.stringify({ type: 'system', subtype: 'error', message: '이 아이템은 한 번에 1개만 판매할 수 있습니다.' }));
        return;
      }
      const sellPrice = Math.floor(foundItem.price * 0.4);
      player.gold += sellPrice;
      player.inventory.splice(idx, 1);
      await this.savePlayerData(playerName).catch(() => {});
      this.sendInventory(player);
      this.sendCharacterInfo(player);
      ws.send(JSON.stringify({ type: 'system', subtype: 'event', message: `${itemName}을(를) 판매했습니다! (+${sellPrice}G)` }));
      return;
    }
  }
}

module.exports = ShopService; 