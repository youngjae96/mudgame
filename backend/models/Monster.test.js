const Monster = require('./Monster');

describe('Monster', () => {
  it('기본 생성: name, maxHp, hp, atk, def, gold, id, desc', () => {
    const base = { name: '슬라임', maxHp: 10, atk: 2, def: 1, gold: 5, desc: '젤리같은 몬스터' };
    const m = new Monster(base, 1, 2);
    expect(m.name).toBe('슬라임');
    expect(m.maxHp).toBe(10);
    expect(m.hp).toBe(10);
    expect(m.atk).toBe(2);
    expect(m.def).toBe(1);
    expect(m.gold).toBe(5);
    expect(m.id).toMatch(/^1,2,m,/);
    expect(m.desc).toBe('젤리같은 몬스터');
  });

  it('atk, def, gold가 없으면 기본값(1,0,0)', () => {
    const base = { name: '고스트', maxHp: 5 };
    const m = new Monster(base, 0, 0);
    expect(m.atk).toBe(1);
    expect(m.def).toBe(0);
    expect(m.gold).toBe(0);
  });

  it('desc가 없으면 desc 속성이 없다', () => {
    const base = { name: '박쥐', maxHp: 3 };
    const m = new Monster(base, 5, 5);
    expect(m.desc).toBeUndefined();
  });

  it('id가 고유하게 생성된다', () => {
    const m1 = new Monster({ name: 'a', maxHp: 1 }, 1, 1);
    const m2 = new Monster({ name: 'a', maxHp: 1 }, 1, 1);
    expect(m1.id).not.toBe(m2.id);
  });
}); 