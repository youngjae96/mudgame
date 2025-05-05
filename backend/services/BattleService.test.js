const BattleService = require('./BattleService');

// 테스트용 플레이어, 몬스터, room, VILLAGE_POS 생성 헬퍼
function createTestContext(overrides = {}) {
  const VILLAGE_POS = { x: 0, y: 0 };
  const player = {
    name: 'testuser',
    hp: 10,
    maxHp: 10,
    atk: 5,
    getAtk: function() { return this.atk; },
    getDef: function() { return 1; },
    gold: 0,
    inventory: [],
    gainStrExp: jest.fn(),
    gainDexExp: jest.fn(),
    autoUsePotion: jest.fn(),
    ...overrides.player
  };
  const monster = {
    id: 'm1',
    name: '슬라임',
    hp: 1,
    maxHp: 5,
    atk: 2,
    def: 1,
    gold: 10,
    dropItems: [],
    dropRates: [],
    ...overrides.monster
  };
  const room = { monsters: [monster], ...overrides.room };
  return { player, monster, room, VILLAGE_POS };
}

describe('BattleService', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
  });

  it('플레이어가 몬스터를 공격해서 처치', () => {
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(result.monsterDead).toBe(true);
    expect(result.playerDead).toBe(false);
    expect(result.goldDrop).toBeGreaterThanOrEqual(0);
    expect(result.log.some(l => l.subtype === 'kill')).toBe(true);
    expect(ctx.room.monsters.length).toBe(0);
  });

  it('플레이어가 몬스터를 공격했으나 몬스터가 살아있고 반격', () => {
    ctx.monster.hp = 100;
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(result.monsterDead).toBe(false);
    expect(result.playerDead).toBe(false);
    expect(result.log.some(l => l.subtype === 'counter')).toBe(true);
    expect(ctx.player.hp).toBeLessThan(10);
  });

  it('플레이어가 반격으로 죽으면 마을로 이동', () => {
    ctx.monster.hp = 100;
    ctx.player.hp = 1;
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(result.playerDead).toBe(true);
    expect(ctx.player.position).toEqual(ctx.VILLAGE_POS);
    expect(result.log.some(l => l.subtype === 'death')).toBe(true);
  });

  it('자동 물약 사용이 호출되면 로그에 반영', () => {
    ctx.monster.hp = 100;
    ctx.player.hp = 2;
    ctx.player.autoUsePotion = jest.fn(() => ({ name: '중형 물약', healAmount: 20, left: 3 }));
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(result.log.some(l => l.subtype === 'event' && result.log.find(l2 => l2.action === 'autoPotion'))).toBe(true);
  });

  it('무공화 무기 착용 시 공격력이 0이 된다', () => {
    ctx.player.equipWeapon = { name: require('../data/items').ITEM_NAME_MONGHWA };
    ctx.monster.hp = 10;
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(result.playerDmg).toBe(0);
    expect(ctx.monster.hp).toBe(10);
  });

  it('몬스터가 아이템을 드랍하는 경우', () => {
    const itemName = '중형 물약';
    ctx.monster.dropItems = [itemName];
    ctx.monster.dropRates = [1]; // 100% 드랍
    ctx.monster.hp = 1;
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(ctx.player.inventory.some(i => i.name === itemName)).toBe(true);
    expect(result.log.some(l => l.message && l.message.includes(itemName))).toBe(true);
  });

  it('몬스터 공격력이 0, 플레이어 방어력이 더 높아도 최소 1의 데미지', () => {
    ctx.monster.hp = 100;
    ctx.monster.atk = 0;
    ctx.player.getDef = () => 100;
    ctx.player.hp = 10;
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(ctx.player.hp).toBe(9);
    expect(result.log.some(l => l.value === 1)).toBe(true);
  });

  it('몬스터 gold가 undefined여도 에러 없이 동작', () => {
    ctx.monster.gold = undefined;
    expect(() => {
      BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    }).not.toThrow();
  });

  it('player.gainStrExp/gainDexExp가 undefined여도 에러 없이 동작', () => {
    ctx.player.gainStrExp = undefined;
    ctx.player.gainDexExp = undefined;
    expect(() => {
      BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    }).not.toThrow();
  });

  it('몬스터 드랍 아이템이 있으나 dropRates가 undefined/0이면 드랍되지 않는다', () => {
    const itemName = '중형 물약';
    ctx.monster.dropItems = [itemName];
    ctx.monster.dropRates = undefined; // undefined
    ctx.monster.hp = 1;
    // Math.random() < 0 always false, so 드랍 안 됨
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(ctx.player.inventory.some(i => i.name === itemName)).toBe(false);
    // dropRates가 0이어도 마찬가지
    ctx = createTestContext({
      monster: { dropItems: [itemName], dropRates: [0], hp: 1 }
    });
    const result2 = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(ctx.player.inventory.some(i => i.name === itemName)).toBe(false);
  });

  it('몬스터 드랍 아이템이 SHOP_ITEMS에 없으면 드랍되지 않는다', () => {
    ctx.monster.dropItems = ['없는아이템'];
    ctx.monster.dropRates = [1]; // 100% 드랍
    ctx.monster.hp = 1;
    const result = BattleService.processBattle(ctx.player, ctx.monster, ctx.room, ctx.VILLAGE_POS);
    expect(ctx.player.inventory.some(i => i.name === '없는아이템')).toBe(false);
    expect(result.log.some(l => l.message && l.message.includes('없는아이템'))).toBe(false);
  });
}); 