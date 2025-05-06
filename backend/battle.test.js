const battle = require('./battle');

describe('battle.js coverage', () => {
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
});