const Player = require('./Player');
const { ITEM_TYPE } = require('../data/items');

// 테스트용 플레이어, 아이템 생성 헬퍼
function createTestPlayer(overrides = {}) {
  const player = new Player('testuser', null);
  player.str = 5;
  player.dex = 5;
  player.int = 5;
  player.hp = 10;
  player.maxHp = 20;
  player.inventory = [];
  Object.assign(player, overrides);
  return player;
}

describe('Player 모델', () => {
  let player;
  beforeEach(() => {
    player = createTestPlayer();
  });

  it('힘 경험치로 레벨업', () => {
    player.strExp = 9;
    player.strExpMax = 10;
    player.gainStrExp(2); // 9+2=11, 레벨업
    expect(player.str).toBe(6);
    expect(player.strExp).toBe(1);
    expect(player.strExpMax).toBeGreaterThan(10);
    expect(player.maxHp).toBe(22);
  });

  it('민첩 경험치로 레벨업', () => {
    player.dexExp = 9;
    player.dexExpMax = 10;
    player.gainDexExp(2);
    expect(player.dex).toBe(6);
    expect(player.dexExp).toBe(1);
    expect(player.dexExpMax).toBeGreaterThan(10);
    expect(player.maxHp).toBe(21);
  });

  it('지능 경험치로 레벨업', () => {
    player.intExp = 9;
    player.intExpMax = 10;
    player.gainIntExp(2);
    expect(player.int).toBe(6);
    expect(player.intExp).toBe(1);
    expect(player.intExpMax).toBeGreaterThan(10);
    expect(player.maxMp).toBe(12);
  });

  it('장비 장착/해제', () => {
    const weapon = { name: '나무검', type: ITEM_TYPE.WEAPON, atk: 3 };
    const armor = { name: '천갑옷', type: ITEM_TYPE.ARMOR, def: 2 };
    player.equipItem(weapon);
    expect(player.equipWeapon).toBe(weapon);
    player.equipItem(armor);
    expect(player.equipArmor).toBe(armor);
    player.unequipItem(ITEM_TYPE.WEAPON);
    expect(player.equipWeapon).toBeNull();
    player.unequipItem(ITEM_TYPE.ARMOR);
    expect(player.equipArmor).toBeNull();
  });

  it('공격력/방어력 계산', () => {
    player.str = 10;
    player.dex = 4;
    const weapon = { name: '강철검', type: ITEM_TYPE.WEAPON, atk: 5, str: 2, dex: 1 };
    const armor = { name: '강철갑옷', type: ITEM_TYPE.ARMOR, def: 3, str: 1, dex: 2 };
    player.equipItem(weapon);
    player.equipItem(armor);
    expect(player.getAtk()).toBeGreaterThan(0);
    expect(player.getDef()).toBeGreaterThan(0);
  });

  it('자동 물약 사용', () => {
    player.hp = 5;
    player.maxHp = 20;
    player.inventory = [{ name: '중형 물약', type: ITEM_TYPE.CONSUMABLE, perUse: 10, total: 15 }];
    const result = player.autoUsePotion();
    expect(result).toEqual({ name: '중형 물약', healAmount: 10, left: 5 });
    expect(player.hp).toBe(15);
    expect(player.inventory[0].total).toBe(5);
  });

  it('자동 물약 사용 후 포션 소진 시 인벤토리에서 제거', () => {
    player.hp = 10;
    player.maxHp = 20;
    player.inventory = [{ name: '중형 물약', type: ITEM_TYPE.CONSUMABLE, perUse: 10, total: 10 }];
    player.autoUsePotion(); // 10->20, total 0
    expect(player.hp).toBe(20);
    expect(player.inventory.length).toBe(0);
  });
}); 