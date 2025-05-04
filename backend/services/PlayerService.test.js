const PlayerService = require('./PlayerService');
const { ITEM_TYPE } = require('../data/items');

describe('PlayerService', () => {
  let player, ws, savePlayerData, sendCharacterInfo, sendInventory;

  beforeEach(() => {
    ws = { send: jest.fn() };
    savePlayerData = jest.fn();
    sendCharacterInfo = jest.fn();
    sendInventory = jest.fn();
    player = {
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
      }
    };
  });

  it('장착 성공: 무기', () => {
    PlayerService.equipItem({
      ws,
      playerName: 'testuser',
      message: '/장착 나무검',
      players: { testuser: player },
      savePlayerData,
      sendCharacterInfo,
      sendInventory
    });
    expect(player.equipWeapon).toEqual({ name: '나무검', type: ITEM_TYPE.WEAPON });
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('장착했습니다'));
  });

  it('장착 실패: 없는 아이템', () => {
    PlayerService.equipItem({
      ws,
      playerName: 'testuser',
      message: '/장착 없는아이템',
      players: { testuser: player },
      savePlayerData,
      sendCharacterInfo,
      sendInventory
    });
    expect(player.equipWeapon).toBeNull();
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('인벤토리에 해당 아이템이 없습니다'));
  });

  it('해제 성공: 무기', () => {
    player.equipWeapon = { name: '나무검', type: ITEM_TYPE.WEAPON };
    PlayerService.unequipItem({
      ws,
      playerName: 'testuser',
      message: '/해제 무기',
      players: { testuser: player },
      savePlayerData,
      sendCharacterInfo,
      sendInventory
    });
    expect(player.equipWeapon).toBeNull();
    expect(player.inventory).toContainEqual({ name: '나무검', type: ITEM_TYPE.WEAPON });
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('해제했습니다'));
  });

  it('해제 실패: 장착 안 한 무기', () => {
    player.equipWeapon = null;
    PlayerService.unequipItem({
      ws,
      playerName: 'testuser',
      message: '/해제 무기',
      players: { testuser: player },
      savePlayerData,
      sendCharacterInfo,
      sendInventory
    });
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('해제할 수 있는 장비 종류는 무기, 방어구입니다'));
  });
}); 