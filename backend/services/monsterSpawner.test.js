const { respawnMonster } = require('../monsterSpawner');
const Room = require('../utils/Room');
const Monster = require('../models/Monster');
const { FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS } = require('../data/items');
const { ROOM_TYPE } = require('../data/map');

describe('monsterSpawner.respawnMonster', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  function makeRoom(type = ROOM_TYPE.FIELD) {
    return new Room(1, 2, type, '테스트방', 'desc', 1);
  }

  it('몬스터가 모두 죽었을 때 20초 후 새로운 몬스터가 스폰된다', () => {
    const room = makeRoom(ROOM_TYPE.FIELD);
    room.monsters = [];
    const getRoom = jest.fn(() => room);
    const getPlayersInRoom = jest.fn(() => []);
    const sendRoomInfo = jest.fn();
    const players = {};
    respawnMonster(1, 1, 2, getRoom, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster, getPlayersInRoom, sendRoomInfo, 9, { x: 4, y: 4 }, players);
    expect(room.monsters.length).toBe(0);
    jest.advanceTimersByTime(20000);
    expect(room.monsters.length).toBe(1);
    expect(FIELD_MONSTERS.map(m=>m.name)).toContain(room.monsters[0].name);
  });

  it('몬스터가 남아있으면 추가 스폰이 일어나지 않는다', () => {
    const room = makeRoom(ROOM_TYPE.FIELD);
    room.monsters = [new Monster(FIELD_MONSTERS[0], 1, 2)];
    const getRoom = jest.fn(() => room);
    const getPlayersInRoom = jest.fn(() => []);
    const sendRoomInfo = jest.fn();
    const players = {};
    respawnMonster(1, 1, 2, getRoom, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster, getPlayersInRoom, sendRoomInfo, 9, { x: 4, y: 4 }, players);
    jest.advanceTimersByTime(20000);
    expect(room.monsters.length).toBe(1);
  });

  it('VILLAGE 타입 방에서는 몬스터가 스폰되지 않는다', () => {
    const room = makeRoom(ROOM_TYPE.VILLAGE);
    room.monsters = [];
    const getRoom = jest.fn(() => room);
    const getPlayersInRoom = jest.fn(() => []);
    const sendRoomInfo = jest.fn();
    const players = {};
    respawnMonster(1, 1, 2, getRoom, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster, getPlayersInRoom, sendRoomInfo, 9, { x: 4, y: 4 }, players);
    jest.advanceTimersByTime(20000);
    expect(room.monsters.length).toBe(0);
  });

  it('sendRoomInfo가 방에 있는 모든 플레이어에게 호출된다', () => {
    const room = makeRoom(ROOM_TYPE.FIELD);
    room.monsters = [];
    const getRoom = jest.fn(() => room);
    const getPlayersInRoom = jest.fn(() => ['user1', 'user2']);
    const sendRoomInfo = jest.fn();
    const players = { user1: {}, user2: {} };
    respawnMonster(1, 1, 2, getRoom, FIELD_MONSTERS, FOREST_MONSTERS, CAVE_MONSTERS, Monster, getPlayersInRoom, sendRoomInfo, 9, { x: 4, y: 4 }, players);
    jest.advanceTimersByTime(20000);
    expect(sendRoomInfo).toHaveBeenCalledTimes(2);
    expect(sendRoomInfo).toHaveBeenCalledWith(players['user1'], getRoom, getPlayersInRoom, 9, { x: 4, y: 4 });
    expect(sendRoomInfo).toHaveBeenCalledWith(players['user2'], getRoom, getPlayersInRoom, 9, { x: 4, y: 4 });
  });
}); 