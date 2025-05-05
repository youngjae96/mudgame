const ShopService = require('./ShopService');
const { ITEM_TYPE } = require('../data/items');

// 테스트용 플레이어, ws, mock 함수 생성 헬퍼
function createTestContext(overrides = {}) {
  const ws = { send: jest.fn() };
  const savePlayerData = jest.fn().mockResolvedValue();
  const sendCharacterInfo = jest.fn().mockResolvedValue();
  const sendInventory = jest.fn().mockResolvedValue();
  const player = {
    name: 'testuser',
    gold: 100,
    position: { x: 4, y: 4 },
    world: 1,
    inventory: [],
    ...overrides.player
  };
  const getRoom = jest.fn(() => ({ type: 'village' }));
  const SHOP_ITEMS = {
    [ITEM_TYPE.WEAPON]: [
      { name: '나무검', type: ITEM_TYPE.WEAPON, price: 30, desc: '테스트용' }
    ],
    [ITEM_TYPE.ARMOR]: [
      { name: '천갑옷', type: ITEM_TYPE.ARMOR, price: 25, desc: '테스트용' }
    ]
  };
  return { ws, savePlayerData, sendCharacterInfo, sendInventory, player, getRoom, SHOP_ITEMS };
}

describe('ShopService', () => {
  let ctx;
  let shopService;
  beforeEach(() => {
    ctx = createTestContext();
    shopService = new ShopService({
      savePlayerData: ctx.savePlayerData,
      sendInventory: ctx.sendInventory,
      sendCharacterInfo: ctx.sendCharacterInfo
    });
  });

  it('구매 성공', async () => {
    await shopService.buyItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/구매 나무검',
      players: { testuser: ctx.player },
      getRoom: ctx.getRoom,
      SHOP_ITEMS: ctx.SHOP_ITEMS
    });
    expect(ctx.player.gold).toBe(70);
    expect(ctx.player.inventory).toContainEqual(expect.objectContaining({ name: '나무검' }));
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('구매했습니다'));
  });

  it('구매 실패: 골드 부족', async () => {
    ctx.player.gold = 10;
    await shopService.buyItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/구매 나무검',
      players: { testuser: ctx.player },
      getRoom: ctx.getRoom,
      SHOP_ITEMS: ctx.SHOP_ITEMS
    });
    expect(ctx.player.inventory).toHaveLength(0);
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('골드가 부족합니다'));
  });

  it('판매 성공', async () => {
    ctx.player.inventory.push({ name: '나무검', type: ITEM_TYPE.WEAPON });
    await shopService.sellItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/판매 나무검',
      players: { testuser: ctx.player },
      getRoom: ctx.getRoom,
      SHOP_ITEMS: ctx.SHOP_ITEMS
    });
    expect(ctx.player.gold).toBe(115); // 100 + 30*0.5 = 115
    expect(ctx.player.inventory).toHaveLength(0);
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('판매했습니다'));
  });

  it('판매 실패: 인벤토리에 없음', async () => {
    await shopService.sellItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/판매 나무검',
      players: { testuser: ctx.player },
      getRoom: ctx.getRoom,
      SHOP_ITEMS: ctx.SHOP_ITEMS
    });
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('인벤토리에 해당 아이템이 없습니다'));
  });
}); 