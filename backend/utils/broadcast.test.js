const { broadcast, sendPlayerList, sendRoomInfo, sendRoomInfoToAllInRoom, sendInventory, sendCharacterInfo } = require('./broadcast');

describe('broadcast utils', () => {
  it('broadcast: readyState 1인 클라이언트에만 메시지 전송', () => {
    const sent = [];
    const wss = {
      clients: [
        { readyState: 1, send: (msg) => sent.push(msg) },
        { readyState: 0, send: jest.fn() }
      ]
    };
    broadcast(wss, { hello: 'world' });
    expect(sent).toHaveLength(1);
    expect(JSON.parse(sent[0])).toEqual({ hello: 'world' });
  });

  it('sendPlayerList: 플레이어 목록 전송', () => {
    const sent = [];
    const wss = { clients: [{ readyState: 1, send: (msg) => sent.push(msg) }] };
    sendPlayerList(wss, { a: {}, b: {} });
    expect(JSON.parse(sent[0])).toEqual(expect.objectContaining({ type: 'players', list: ['a', 'b'] }));
  });

  it('sendRoomInfo: 방 정보/맵/주변/마을 안내 전송', () => {
    const sent = [];
    const player = {
      ws: { send: (msg) => sent.push(msg) },
      position: { x: 1, y: 1 },
      world: 1
    };
    const getRoom = jest.fn(() => ({
      type: 'village', name: '마을', description: 'desc', items: [], monsters: []
    }));
    const getPlayersInRoom = jest.fn(() => ['a', 'b']);
    sendRoomInfo(player, getRoom, getPlayersInRoom, 5, { x: 0, y: 0 });
    expect(sent.some(msg => JSON.parse(msg).type === 'room')).toBe(true);
    expect(sent.some(msg => JSON.parse(msg).type === 'system')).toBe(true);
  });

  it('sendRoomInfoToAllInRoom: 해당 방 플레이어 모두에게 방 정보 전송', () => {
    const sent = [];
    const p1 = { world: 1, position: { x: 1, y: 1 }, ws: { send: (msg) => sent.push('p1:' + msg) } };
    const p2 = { world: 1, position: { x: 1, y: 1 }, ws: { send: (msg) => sent.push('p2:' + msg) } };
    const players = { p1, p2 };
    const getRoom = jest.fn(() => ({ type: 'field', name: '', description: '', items: [], monsters: [] }));
    const getPlayersInRoom = jest.fn(() => ['p1', 'p2']);
    sendRoomInfoToAllInRoom(players, 1, 1, 1, getRoom, getPlayersInRoom, 5, { x: 0, y: 0 });
    expect(sent.filter(s => s.startsWith('p1:')).length).toBeGreaterThan(0);
    expect(sent.filter(s => s.startsWith('p2:')).length).toBeGreaterThan(0);
  });

  it('sendInventory: 인벤토리 정보 전송', () => {
    const sent = [];
    const player = { ws: { send: (msg) => sent.push(msg) }, inventory: [{ name: '포션' }] };
    sendInventory(player);
    expect(JSON.parse(sent[0])).toEqual(expect.objectContaining({ type: 'inventory' }));
  });

  it('sendCharacterInfo: 캐릭터 정보 전송', () => {
    const sent = [];
    const player = {
      ws: { send: (msg) => sent.push(msg) },
      hp: 10, maxHp: 10, mp: 5, maxMp: 5, str: 1, dex: 2, int: 3,
      getAtk: () => 7, getDef: () => 2, strExp: 0, strExpMax: 10, dexExp: 0, dexExpMax: 10, intExp: 0, intExpMax: 10, gold: 100
    };
    sendCharacterInfo(player);
    expect(JSON.parse(sent[0])).toEqual(expect.objectContaining({ type: 'character' }));
  });
}); 