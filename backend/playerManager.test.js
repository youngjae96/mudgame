const PlayerManager = require('./playerManager');

describe('PlayerManager', () => {
  beforeEach(() => {
    PlayerManager.players = {};
  });

  it('플레이어 추가/조회', () => {
    const player = { name: 'user1', hp: 10 };
    PlayerManager.addPlayer('user1', player);
    expect(PlayerManager.getPlayer('user1')).toBe(player);
  });

  it('플레이어 삭제', () => {
    const player = { name: 'user1', hp: 10 };
    PlayerManager.addPlayer('user1', player);
    PlayerManager.removePlayer('user1');
    expect(PlayerManager.getPlayer('user1')).toBeUndefined();
  });

  it('전체 플레이어 목록 반환', () => {
    PlayerManager.addPlayer('user1', { name: 'user1' });
    PlayerManager.addPlayer('user2', { name: 'user2' });
    const all = PlayerManager.getAllPlayers();
    expect(Object.keys(all)).toContain('user1');
    expect(Object.keys(all)).toContain('user2');
  });
}); 