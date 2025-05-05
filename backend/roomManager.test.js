const RoomManager = require('./roomManager');

describe('RoomManager', () => {
  beforeEach(() => {
    // RoomManager의 내부 rooms를 초기화
    RoomManager.rooms = {};
  });

  it('방 생성 및 getRoom', () => {
    const room = RoomManager.getRoom(1, 2, 3);
    expect(room).toBeDefined();
    expect(room.x).toBe(2);
    expect(room.y).toBe(3);
    expect(room.world).toBe(1);
  });

  it('방에 플레이어 추가/삭제', () => {
    RoomManager.addPlayerToRoom('user1', 1, 2, 3);
    RoomManager.addPlayerToRoom('user2', 1, 2, 3);
    let players = RoomManager.getPlayersInRoom(1, 2, 3);
    expect(players).toContain('user1');
    expect(players).toContain('user2');
    RoomManager.removePlayerFromRoom('user1', 1, 2, 3);
    players = RoomManager.getPlayersInRoom(1, 2, 3);
    expect(players).not.toContain('user1');
    expect(players).toContain('user2');
  });

  it('다른 방은 독립적으로 관리됨', () => {
    RoomManager.addPlayerToRoom('user1', 1, 2, 3);
    RoomManager.addPlayerToRoom('user2', 1, 5, 6);
    expect(RoomManager.getPlayersInRoom(1, 2, 3)).toContain('user1');
    expect(RoomManager.getPlayersInRoom(1, 5, 6)).toContain('user2');
    expect(RoomManager.getPlayersInRoom(1, 2, 3)).not.toContain('user2');
  });
}); 