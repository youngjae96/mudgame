const Player = require('./Player');
const { ITEM_TYPE, ITEM_NAME_MONGHWA } = require('../data/items');

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

  it('gainStrExp/gainDexExp/gainIntExp 기본값(1) 동작', () => {
    player.strExp = 0;
    player.strExpMax = 2;
    player.gainStrExp(); // 0+1=1, 레벨업X
    expect(player.str).toBe(5);
    expect(player.strExp).toBe(1);
    player.gainStrExp(); // 1+1=2, 레벨업
    expect(player.str).toBe(6);
    expect(player.strExp).toBe(0);

    player.dexExp = 0;
    player.dexExpMax = 2;
    player.gainDexExp();
    expect(player.dex).toBe(5);
    expect(player.dexExp).toBe(1);
    player.gainDexExp();
    expect(player.dex).toBe(6);
    expect(player.dexExp).toBe(0);

    player.intExp = 0;
    player.intExpMax = 2;
    player.gainIntExp();
    expect(player.int).toBe(5);
    expect(player.intExp).toBe(1);
    player.gainIntExp();
    expect(player.int).toBe(6);
    expect(player.intExp).toBe(0);
  });

  it('equipItem/unequipItem: else 분기(무효 타입)', () => {
    const item = { name: '이상한돌', type: 'ETC' };
    player.equipItem(item);
    expect(player.equipWeapon).toBeNull();
    expect(player.equipArmor).toBeNull();
    player.unequipItem('ETC');
    expect(player.equipWeapon).toBeNull();
    expect(player.equipArmor).toBeNull();
  });

  it('getAtk: 무공화 무기 장착 시 0, 기본값 분기', () => {
    const monghwa = { name: ITEM_NAME_MONGHWA, type: ITEM_TYPE.WEAPON };
    player.equipItem(monghwa);
    expect(player.getAtk()).toBe(0);
    player.equipWeapon = { type: ITEM_TYPE.WEAPON };
    expect(player.getAtk()).toBe(Math.floor(2 + 5 * 1.5 + 5 * 0.5));
  });

  it('getDef: 장비 없음/기본값 분기', () => {
    player.equipArmor = null;
    expect(player.getDef()).toBe(Math.floor(1 + 5 * 1.2 + 5 * 0.3));
    player.equipArmor = { type: ITEM_TYPE.ARMOR };
    expect(player.getDef()).toBe(Math.floor(1 + 5 * 1.2 + 5 * 0.3));
  });

  it('autoUsePotion: 포션 없음/조건 불충족/빈 포션 제거', () => {
    player.hp = 20;
    player.maxHp = 20;
    player.inventory = [{ name: '중형 물약', type: ITEM_TYPE.CONSUMABLE, perUse: 10, total: 10 }];
    expect(player.autoUsePotion()).toBeNull(); // hp==maxHp
    player.hp = 0;
    expect(player.autoUsePotion()).toBeNull(); // hp==0
    player.hp = 10;
    player.inventory = [{ name: '빈 물약', type: ITEM_TYPE.CONSUMABLE, perUse: 10, total: 0 }];
    expect(player.autoUsePotion()).toBeNull(); // total==0
    expect(player.inventory.length).toBe(0); // 빈 포션 제거됨
  });
}); 