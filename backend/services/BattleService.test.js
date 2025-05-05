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
}); 