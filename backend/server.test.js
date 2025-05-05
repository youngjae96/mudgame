const server = require('./server');

jest.mock('./playerManager', () => ({
  getAllPlayers: jest.fn(() => ({ 유저: { name: '유저', position: { x: 1, y: 2 } } })),
  getPlayer: jest.fn((name) => name === '유저' ? { name: '유저', world: 1, position: { x: 1, y: 2 } } : undefined),
}));

jest.mock('./models/PlayerData', () => ({
  findOne: jest.fn(),
}));

const PlayerData = require('./models/PlayerData');

jest.mock('./monsterSpawner', () => ({
  respawnMonster: jest.fn(),
}));
const { respawnMonster } = require('./monsterSpawner');

// parseChatCommand 테스트

describe('parseChatCommand', () => {
  const { parseChatCommand } = require('./server');
  it('/우리 명령어', () => {
    const res = parseChatCommand('/우리 파티');
    expect(res.type).toBe('invalid');
  });
  it('/전체 명령어', () => {
    const res = parseChatCommand('/전체 안녕');
    expect(res.type).toBe('global');
    expect(res.message).toBe('안녕');
  });
  it('/전 명령어', () => {
    const res = parseChatCommand('/전 하이');
    expect(res.type).toBe('global');
    expect(res.message).toBe('하이');
  });
  it('/지역 명령어', () => {
    const res = parseChatCommand('/지역 로컬');
    expect(res.type).toBe('local');
    expect(res.message).toBe('로컬');
  });
  it('/지 명령어', () => {
    const res = parseChatCommand('/지 로컬');
    expect(res.type).toBe('local');
    expect(res.message).toBe('로컬');
  });
  it('/동/서/남/북 이동 명령어', () => {
    expect(parseChatCommand('/동')).toEqual({ type: 'move', dx: 1, dy: 0 });
    expect(parseChatCommand('/서')).toEqual({ type: 'move', dx: -1, dy: 0 });
    expect(parseChatCommand('/남')).toEqual({ type: 'move', dx: 0, dy: 1 });
    expect(parseChatCommand('/북')).toEqual({ type: 'move', dx: 0, dy: -1 });
  });
  it('기타 메시지', () => {
    expect(parseChatCommand('그냥 채팅')).toEqual({ type: 'local', message: '그냥 채팅' });
  });
});

// savePlayerData 테스트

describe('savePlayerData', () => {
  const { savePlayerData } = require('./server');
  it('플레이어가 없으면 아무 동작 안함', async () => {
    const PlayerManager = require('./playerManager');
    PlayerManager.getPlayer = jest.fn(() => undefined);
    await expect(savePlayerData('없는유저')).resolves.toBeUndefined();
  });
  it('PlayerData가 없으면 아무 동작 안함', async () => {
    const PlayerManager = require('./playerManager');
    PlayerManager.getPlayer = jest.fn(() => ({ name: '유저' }));
    PlayerData.findOne.mockResolvedValue(null);
    await expect(savePlayerData('유저')).resolves.toBeUndefined();
  });
  it('정상 저장', async () => {
    const PlayerManager = require('./playerManager');
    const player = { name: '유저', world: 1, position: { x: 1, y: 2 }, hp: 10, maxHp: 10, mp: 5, maxMp: 5, str: 1, dex: 2, int: 3, atk: 1, def: 1, gold: 100, inventory: [], strExp: 0, strExpMax: 10, dexExp: 0, dexExpMax: 10, intExp: 0, intExpMax: 10, equipWeapon: {}, equipArmor: {} };
    PlayerManager.getPlayer = jest.fn(() => player);
    const saveMock = jest.fn();
    PlayerData.findOne.mockResolvedValue({ ...player, save: saveMock });
    await savePlayerData('유저');
    expect(saveMock).toHaveBeenCalled();
  });
  it('VersionError 발생 시 경고만 출력', async () => {
    const PlayerManager = require('./playerManager');
    PlayerManager.getPlayer = jest.fn(() => ({ name: '유저' }));
    PlayerData.findOne.mockRejectedValue({ name: 'VersionError', message: '버전 에러' });
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await savePlayerData('유저');
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('VersionError');
    spy.mockRestore();
  });
  it('기타 에러 발생 시 에러 로그', async () => {
    const PlayerManager = require('./playerManager');
    PlayerManager.getPlayer = jest.fn(() => ({ name: '유저' }));
    PlayerData.findOne.mockRejectedValue({ name: 'OtherError', message: 'DB 에러' });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await savePlayerData('유저');
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('PlayerData 저장 실패');
    spy.mockRestore();
  });
});

// respawnMonsterWithDeps 테스트

describe('respawnMonsterWithDeps', () => {
  it('정상적으로 respawnMonster가 호출된다', () => {
    const { respawnMonsterWithDeps } = require('./server');
    respawnMonster.mockClear();
    respawnMonsterWithDeps(1, 2, 3);
    expect(respawnMonster).toHaveBeenCalled();
  });
}); 