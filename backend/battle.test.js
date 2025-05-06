const battle = require('./battle');
const BattleService = require('./services/BattleService');
const { ITEM_NAME_MONGHWA } = require('./data/items');

describe('battle.js coverage', () => {
  function makePlayer(overrides = {}) {
    return {
      name: '플레이어',
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
      ...overrides
    };
  }
  function makeMonster(overrides = {}) {
    return {
      id: 'm1',
      name: '슬라임',
      hp: 1,
      maxHp: 5,
      atk: 2,
      def: 1,
      gold: 10,
      dropItems: [],
      dropRates: [],
      ...overrides
    };
  }
  function makeRoom(monsters = []) {
    return { monsters: [...monsters] };
  }
  const VILLAGE_POS = { x: 0, y: 0 };

  it('공격자/수비자 HP 0 이하면 에러 없이 객체 반환', () => {
    const attacker = { hp: 0, getAtk: () => 1, getDef: () => 0, autoUsePotion: () => null };
    const defender = { hp: 10, getDef: () => 0 };
    const result = battle.processBattle?.(attacker, defender, {}, {});
    expect(result).toBeDefined();
  });
  it('정상 전투 시 로그 반환', () => {
    const attacker = { hp: 10, atk: 5, str: 1, dex: 1, getAtk: () => 5, getDef: () => 0, autoUsePotion: () => null };
    const defender = { hp: 10, def: 1, getDef: () => 1 };
    const result = battle.processBattle?.(attacker, defender, {}, {});
    expect(result).toBeDefined();
  });

  it('몬스터를 처치하면 monsterDead, goldDrop, kill 로그', () => {
    const player = makePlayer();
    const monster = makeMonster({ hp: 1 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(result.monsterDead).toBe(true);
    expect(result.goldDrop).toBeGreaterThanOrEqual(0);
    expect(result.log.some(l => l.subtype === 'kill')).toBe(true);
    expect(room.monsters.length).toBe(0);
  });

  it('몬스터가 살아있으면 반격, counter 로그', () => {
    const player = makePlayer();
    const monster = makeMonster({ hp: 100 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(result.monsterDead).toBe(false);
    expect(result.log.some(l => l.subtype === 'counter')).toBe(true);
    expect(player.hp).toBeLessThan(10);
  });

  it('플레이어가 반격으로 죽으면 playerDead, death 로그, 마을 이동', () => {
    const player = makePlayer({ hp: 1 });
    const monster = makeMonster({ hp: 100 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(result.playerDead).toBe(true);
    expect(player.position).toEqual(VILLAGE_POS);
    expect(result.log.some(l => l.subtype === 'death')).toBe(true);
  });

  it('자동 물약 사용 시 event 로그', () => {
    const player = makePlayer({ hp: 2, autoUsePotion: jest.fn(() => ({ name: '중형 물약', healAmount: 20, left: 3 })) });
    const monster = makeMonster({ hp: 100 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(result.log.some(l => l.subtype === 'event' && result.log.find(l2 => l2.action === 'autoPotion'))).toBe(true);
  });

  it('무공화 무기 착용 시 공격력 0', () => {
    const player = makePlayer({ equipWeapon: { name: ITEM_NAME_MONGHWA } });
    const monster = makeMonster({ hp: 10 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(result.playerDmg).toBe(0);
    expect(monster.hp).toBe(10);
  });

  it('몬스터가 아이템을 드랍하면 인벤토리 추가, 로그', () => {
    const itemName = '중형 물약';
    const player = makePlayer();
    const monster = makeMonster({ dropItems: [itemName], dropRates: [1], hp: 1 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(player.inventory.some(i => i.name === itemName)).toBe(true);
    expect(result.log.some(l => l.message && l.message.includes(itemName))).toBe(true);
  });

  it('몬스터 공격력이 0, 플레이어 방어력이 높아도 최소 1 데미지', () => {
    const player = makePlayer({ getDef: () => 100, hp: 10 });
    const monster = makeMonster({ atk: 0, hp: 100 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(player.hp).toBe(9);
    expect(result.log.some(l => l.value === 1)).toBe(true);
  });

  it('몬스터 gold가 undefined여도 에러 없이 동작', () => {
    const player = makePlayer();
    const monster = makeMonster({ gold: undefined });
    const room = makeRoom([monster]);
    expect(() => BattleService.processBattle(player, monster, room, VILLAGE_POS)).not.toThrow();
  });

  it('player.gainStrExp/gainDexExp가 undefined여도 에러 없이 동작', () => {
    const player = makePlayer({ gainStrExp: undefined, gainDexExp: undefined });
    const monster = makeMonster();
    const room = makeRoom([monster]);
    expect(() => BattleService.processBattle(player, monster, room, VILLAGE_POS)).not.toThrow();
  });

  it('몬스터 드랍 아이템이 있으나 dropRates가 undefined/0이면 드랍되지 않는다', () => {
    const itemName = '중형 물약';
    let player = makePlayer();
    let monster = makeMonster({ dropItems: [itemName], dropRates: undefined, hp: 1 });
    let room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(player.inventory.some(i => i.name === itemName)).toBe(false);
    // dropRates가 0이어도 마찬가지
    player = makePlayer();
    monster = makeMonster({ dropItems: [itemName], dropRates: [0], hp: 1 });
    room = makeRoom([monster]);
    const result2 = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(player.inventory.some(i => i.name === itemName)).toBe(false);
  });

  it('몬스터 드랍 아이템이 SHOP_ITEMS에 없으면 드랍되지 않는다', () => {
    const player = makePlayer();
    const monster = makeMonster({ dropItems: ['없는아이템'], dropRates: [1], hp: 1 });
    const room = makeRoom([monster]);
    const result = BattleService.processBattle(player, monster, room, VILLAGE_POS);
    expect(player.inventory.some(i => i.name === '없는아이템')).toBe(false);
    expect(result.log.some(l => l.message && l.message.includes('없는아이템'))).toBe(false);
  });

  it('몬스터 def가 undefined여도 에러 없이 동작', () => {
    const player = makePlayer();
    const monster = makeMonster({ def: undefined });
    const room = makeRoom([monster]);
    expect(() => BattleService.processBattle(player, monster, room, VILLAGE_POS)).not.toThrow();
  });

  it('몬스터 dropItems가 undefined여도 에러 없이 동작', () => {
    const player = makePlayer();
    const monster = makeMonster({ dropItems: undefined, hp: 1 });
    const room = makeRoom([monster]);
    expect(() => BattleService.processBattle(player, monster, room, VILLAGE_POS)).not.toThrow();
  });

  it('room.monsters가 undefined여도 에러 없이 동작', () => {
    const player = makePlayer();
    const monster = makeMonster({ hp: 1 });
    const room = {}; // monsters 없음
    expect(() => BattleService.processBattle(player, monster, room, VILLAGE_POS)).not.toThrow();
  });
});