const PlayerService = require('./PlayerService');
const { ITEM_TYPE } = require('../data/items');

// 테스트용 플레이어, ws, mock 함수 생성 헬퍼
function createTestContext(overrides = {}) {
  const ws = { send: jest.fn() };
  const savePlayerData = jest.fn().mockResolvedValue();
  const sendCharacterInfo = jest.fn().mockResolvedValue();
  const sendInventory = jest.fn().mockResolvedValue();
  const player = {
    name: 'testuser',
    inventory: [
      { name: '나무검', type: ITEM_TYPE.WEAPON },
      { name: '천갑옷', type: ITEM_TYPE.ARMOR }
    ],
    equipWeapon: null,
    equipArmor: null,
    equipItem: function(item) {
      if (item.type === ITEM_TYPE.WEAPON) this.equipWeapon = item;
      if (item.type === ITEM_TYPE.ARMOR) this.equipArmor = item;
    },
    unequipItem: function(type) {
      if (type === ITEM_TYPE.WEAPON) this.equipWeapon = null;
      if (type === ITEM_TYPE.ARMOR) this.equipArmor = null;
    },
    ...overrides.player
  };
  return { ws, savePlayerData, sendCharacterInfo, sendInventory, player };
}

describe('PlayerService', () => {
  let ctx;
  let playerService;
  beforeEach(() => {
    ctx = createTestContext();
    playerService = new PlayerService({
      savePlayerData: ctx.savePlayerData,
      sendCharacterInfo: ctx.sendCharacterInfo,
      sendInventory: ctx.sendInventory
    });
  });

  it('장착 성공: 무기', async () => {
    await playerService.equipItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/장착 나무검',
      players: { testuser: ctx.player }
    });
    expect(ctx.player.equipWeapon).toEqual({ name: '나무검', type: ITEM_TYPE.WEAPON });
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('장착했습니다'));
  });

  it('장착 실패: 없는 아이템', async () => {
    await playerService.equipItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/장착 없는아이템',
      players: { testuser: ctx.player }
    });
    expect(ctx.player.equipWeapon).toBeNull();
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('인벤토리에 해당 아이템이 없습니다'));
  });

  it('해제 성공: 무기', async () => {
    ctx.player.equipWeapon = { name: '나무검', type: ITEM_TYPE.WEAPON };
    await playerService.unequipItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/해제 무기',
      players: { testuser: ctx.player }
    });
    expect(ctx.player.equipWeapon).toBeNull();
    expect(ctx.player.inventory).toContainEqual({ name: '나무검', type: ITEM_TYPE.WEAPON });
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('해제했습니다'));
  });

  it('해제 실패: 장착 안 한 무기', async () => {
    ctx.player.equipWeapon = null;
    await playerService.unequipItem({
      ws: ctx.ws,
      playerName: 'testuser',
      message: '/해제 무기',
      players: { testuser: ctx.player }
    });
    expect(ctx.ws.send).toHaveBeenCalledWith(expect.stringContaining('해제할 수 있는 장비 종류는 무기, 방어구입니다'));
  });
}); 