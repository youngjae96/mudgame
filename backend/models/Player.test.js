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
    expect(player.getRealMaxHp()).toBeGreaterThan(20);
  });

  it('민첩 경험치로 레벨업', () => {
    player.dexExp = 9;
    player.dexExpMax = 10;
    player.gainDexExp(2);
    expect(player.dex).toBe(6);
    expect(player.dexExp).toBe(1);
    expect(player.dexExpMax).toBeGreaterThan(10);
    expect(player.getRealMaxHp()).toBeGreaterThan(20);
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
    expect(player.getAtk()).toBe(Math.floor(2 + 5 * 1.5 + 5 * 0.5 + 5 * 0.3));
  });

  it('getDef: 장비 없음/기본값 분기', () => {
    player.equipArmor = null;
    expect(player.getDef()).toBe(Math.floor(1 + 5 * 1.2 + 5 * 0.3 + 5 * 0.2));
    player.equipArmor = { type: ITEM_TYPE.ARMOR };
    expect(player.getDef()).toBe(Math.floor(1 + 5 * 1.2 + 5 * 0.3 + 5 * 0.2));
  });

  it('autoUsePotion: 포션 없음/조건 불충족/빈 포션 제거', () => {
    player.hp = 19;
    player.maxHp = 20;
    player.inventory = [{ name: '중형 물약', type: ITEM_TYPE.CONSUMABLE, perUse: 10, total: 10 }];
    expect(player.autoUsePotion()).not.toBeNull();
    player.hp = 20;
    expect(player.autoUsePotion()).toBeNull();
    player.hp = 0;
    expect(player.autoUsePotion()).toBeNull();
    player.hp = 10;
    player.inventory = [{ name: '빈 물약', type: ITEM_TYPE.CONSUMABLE, perUse: 10, total: 0 }];
    expect(player.autoUsePotion()).toBeNull();
    expect(player.inventory.length).toBe(0);
  });
});

describe('경험치 보너스 곱셈', () => {
  let player;
  beforeEach(() => {
    player = createTestPlayer();
    global.EVENT_EXP_BONUS = undefined;
  });

  afterEach(() => {
    global.EVENT_EXP_BONUS = undefined;
  });

  it('기본 보너스(무기X, 이벤트X, extraX)', () => {
    expect(player.getExpBonus('str')).toBe(1);
  });

  it('무기 보너스만 적용', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 2 };
    expect(player.getExpBonus('str')).toBe(2);
  });

  it('글로벌 이벤트 보너스만 적용', () => {
    global.EVENT_EXP_BONUS = 3;
    expect(player.getExpBonus('str')).toBe(3);
  });

  it('무기+글로벌+임시 보너스 모두 곱', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 2 };
    global.EVENT_EXP_BONUS = 3;
    expect(player.getExpBonus('str', 4)).toBe(2 * 3 * 4);
  });

  it('gainStatExp로 실제 경험치 증가량 확인', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 2 };
    global.EVENT_EXP_BONUS = 3;
    player.strExp = 0;
    player.strExpMax = 100;
    player.gainStatExp('str', 5, 4);
    expect(player.strExp).toBe(149);
  });
});

describe('스탯 경험치 보너스 조합별 적용', () => {
  let player;
  beforeEach(() => {
    player = createTestPlayer();
    global.EVENT_EXP_BONUS = undefined;
  });
  afterEach(() => {
    global.EVENT_EXP_BONUS = undefined;
  });

  it('힘: 무기 보너스만', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 1.5 };
    player.strExp = 0;
    player.strExpMax = 100;
    player.gainStrExp(10);
    expect(player.strExp).toBe(15);
  });

  it('민첩: 글로벌 이벤트만', () => {
    global.EVENT_EXP_BONUS = 2;
    player.dexExp = 0;
    player.dexExpMax = 100;
    player.gainDexExp(10);
    expect(player.dexExp).toBe(20);
  });

  it('지능: extra만', () => {
    player.intExp = 0;
    player.intExpMax = 100;
    player.gainIntExp(10, 3);
    expect(player.intExp).toBe(30);
  });

  it('힘: 무기+글로벌+extra 모두 곱', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 2 };
    global.EVENT_EXP_BONUS = 3;
    player.strExp = 0;
    player.strExpMax = 100;
    player.gainStrExp(5, 4); // 5*2*3*4 = 120, 레벨업 발생 후 남은 경험치 20
    expect(player.strExp).toBe(20);
  });

  it('민첩: 무기+글로벌+extra 모두 곱', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 1.2 };
    global.EVENT_EXP_BONUS = 2.5;
    player.dexExp = 0;
    player.dexExpMax = 100;
    player.gainDexExp(4, 2);
    // 4*1.2*2.5*2 = 24
    expect(player.dexExp).toBe(24);
  });

  it('지능: 무기+글로벌+extra 모두 곱', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 1.1 };
    global.EVENT_EXP_BONUS = 1.5;
    player.intExp = 0;
    player.intExpMax = 100;
    player.gainIntExp(8, 2);
    // 8*1.1*1.5*2 = 26.4
    expect(player.intExp).toBeCloseTo(26.4);
  });

  it('gainStatExp: type별로 보너스 적용', () => {
    player.equipWeapon = { type: ITEM_TYPE.WEAPON, expBonus: 2 };
    global.EVENT_EXP_BONUS = 2;
    player.strExp = 0;
    player.dexExp = 0;
    player.intExp = 0;
    player.strExpMax = 100;
    player.dexExpMax = 100;
    player.intExpMax = 100;
    player.gainStatExp('str', 3, 2);
    player.gainStatExp('dex', 4, 2);
    player.gainStatExp('int', 5, 2);
    expect(player.strExp).toBe(96);
    expect(player.dexExp).toBe(28);
    expect(player.intExp).toBe(60);
  });
}); 