const Room = require('./Room');

describe('Room', () => {
  let room;
  beforeEach(() => {
    room = new Room(1, 2, 'field', '테스트방', 'desc', 1);
  });

  it('플레이어 추가/삭제/확인', () => {
    room.addPlayer('user1');
    expect(room.hasPlayer('user1')).toBe(true);
    room.removePlayer('user1');
    expect(room.hasPlayer('user1')).toBe(false);
  });

  it('아이템 추가/삭제', () => {
    room.addItem({ name: '포션' });
    expect(room.items).toHaveLength(1);
    room.removeItem('포션');
    expect(room.items).toHaveLength(0);
  });

  it('몬스터 추가/삭제', () => {
    room.addMonster({ id: 1, name: '슬라임' });
    expect(room.monsters).toHaveLength(1);
    room.removeMonster(1);
    expect(room.monsters).toHaveLength(0);
  });

  it('중복 플레이어 추가 시 Set 유지', () => {
    room.addPlayer('user1');
    room.addPlayer('user1');
    expect([...room.players]).toEqual(['user1']);
  });

  it('없는 아이템/몬스터/플레이어 삭제 시 에러 없이 동작', () => {
    expect(() => room.removePlayer('없는유저')).not.toThrow();
    expect(() => room.removeItem('없는아이템')).not.toThrow();
    expect(() => room.removeMonster(999)).not.toThrow();
  });
}); 