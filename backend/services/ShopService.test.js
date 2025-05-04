const ShopService = require('./ShopService');
const { ITEM_TYPE } = require('../data/items');

describe('ShopService', () => {
  let player, ws, savePlayerData, sendCharacterInfo, sendInventory, getRoom, SHOP_ITEMS;

  beforeEach(() => {
    ws = { send: jest.fn() };
    savePlayerData = jest.fn();
    sendCharacterInfo = jest.fn();
    sendInventory = jest.fn();
    player = {
      name: 'testuser',
      gold: 100,
      position: { x: 4, y: 4 },
      world: 1,
      inventory: [],
    };
    getRoom = jest.fn(() => ({ type: 'village' }));
    SHOP_ITEMS = {
      [ITEM_TYPE.WEAPON]: [
        { name: '나무검', type: ITEM_TYPE.WEAPON, price: 30, desc: '테스트용' }
      ],
      [ITEM_TYPE.ARMOR]: [
        { name: '천갑옷', type: ITEM_TYPE.ARMOR, price: 25, desc: '테스트용' }
      ]
    };
  });

  it('구매 성공', () => {
    ShopService.buyItem({
      ws,
      playerName: 'testuser',
      message: '/구매 나무검',
      players: { testuser: player },
      getRoom,
      SHOP_ITEMS,
      savePlayerData,
      sendInventory,
      sendCharacterInfo
    });
    expect(player.gold).toBe(70);
    expect(player.inventory).toContainEqual(expect.objectContaining({ name: '나무검' }));
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('구매했습니다'));
  });

  it('구매 실패: 골드 부족', () => {
    player.gold = 10;
    ShopService.buyItem({
      ws,
      playerName: 'testuser',
      message: '/구매 나무검',
      players: { testuser: player },
      getRoom,
      SHOP_ITEMS,
      savePlayerData,
      sendInventory,
      sendCharacterInfo
    });
    expect(player.inventory).toHaveLength(0);
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('골드가 부족합니다'));
  });

  it('판매 성공', () => {
    player.inventory.push({ name: '나무검', type: ITEM_TYPE.WEAPON });
    ShopService.sellItem({
      ws,
      playerName: 'testuser',
      message: '/판매 나무검',
      players: { testuser: player },
      getRoom,
      SHOP_ITEMS,
      savePlayerData,
      sendInventory,
      sendCharacterInfo
    });
    expect(player.gold).toBe(115); // 100 + 30*0.5 = 115
    expect(player.inventory).toHaveLength(0);
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('판매했습니다'));
  });

  it('판매 실패: 인벤토리에 없음', () => {
    ShopService.sellItem({
      ws,
      playerName: 'testuser',
      message: '/판매 나무검',
      players: { testuser: player },
      getRoom,
      SHOP_ITEMS,
      savePlayerData,
      sendInventory,
      sendCharacterInfo
    });
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('인벤토리에 해당 아이템이 없습니다'));
  });
}); 