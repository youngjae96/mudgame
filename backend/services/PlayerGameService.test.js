const PlayerGameService = require('./PlayerGameService');

// 공통 mock context 생성 함수
function createMockContext(overrides = {}) {
  return {
    ws: { send: jest.fn() },
    playerName: 'testuser',
    player: { inventory: [], position: { x: 1, y: 2 }, world: 1 },
    PlayerManager: {
      getPlayer: jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
        ...overrides.player
      })),
      getAllPlayers: jest.fn(() => ({ testuser: {} }))
    },
    RoomManager: {},
    getRoom: jest.fn(() => ({ items: [], monsters: [], type: 'normal' })),
    getPlayersInRoom: jest.fn(() => []),
    sendRoomInfoToAllInRoom: jest.fn(),
    sendRoomInfo: jest.fn(),
    savePlayerData: jest.fn(),
    sendInventory: jest.fn(),
    sendCharacterInfo: jest.fn(),
    broadcast: jest.fn(),
    processBattle: jest.fn(() => ({ log: [], monsterDead: false, playerDead: false })),
    respawnMonsterWithDeps: jest.fn(),
    SHOP_ITEMS: {},
    MAP_SIZE: 10,
    VILLAGE_POS: { x: 0, y: 0 },
    battleIntervals: {},
    parseChatCommand: jest.fn(() => ({ type: 'local', message: 'hi' })),
    commandHandlers: { '/장착': jest.fn() },
    ...overrides
  };
}

describe('PlayerGameService', () => {
  let ctx;
  beforeEach(() => {
    ctx = createMockContext();
  });

  describe('handleMove', () => {
    it('정상 이동 시 좌표 변경 및 저장 호출', async () => {
      await PlayerGameService.handleMove({ ...ctx, dx: 1, dy: 0, getPlayersInRoom: ctx.getPlayersInRoom });
      expect(ctx.savePlayerData).toHaveBeenCalled();
    });
    it('플레이어가 없으면 아무 동작도 하지 않음', async () => {
      ctx.PlayerManager.getPlayer = jest.fn(() => null);
      await PlayerGameService.handleMove({ ...ctx, dx: 1, dy: 0, getPlayersInRoom: ctx.getPlayersInRoom });
      expect(ctx.savePlayerData).not.toHaveBeenCalled();
    });
    it('잘못된 좌표면 에러 메시지 전송', async () => {
      await PlayerGameService.handleMove({ ...ctx, dx: -100, dy: 0, getPlayersInRoom: ctx.getPlayersInRoom });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: expect.stringContaining('잘못된 좌표') }));
    });
    it('월드가 3이면 maxSize가 30으로 적용된다', async () => {
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 3,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.getRoom = jest.fn(() => ({ type: 'normal' }));
      await PlayerGameService.handleMove({ ...ctx, dx: 1, dy: 0, getPlayersInRoom: ctx.getPlayersInRoom });
      expect(ctx.savePlayerData).toHaveBeenCalled();
    });
    it('cave_wall 방이면 에러 메시지 전송', async () => {
      ctx.getRoom = jest.fn(() => ({ type: 'cave_wall' }));
      await PlayerGameService.handleMove({ ...ctx, dx: 1, dy: 0, getPlayersInRoom: ctx.getPlayersInRoom });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: expect.stringContaining('암벽') }));
    });
    it('자동전투 중 이동 시 자동전투 중단 메시지 전송', async () => {
      ctx.battleIntervals['testuser'] = setInterval(() => {}, 1000);
      await PlayerGameService.handleMove({ ...ctx, dx: 1, dy: 0, getPlayersInRoom: ctx.getPlayersInRoom });
      const found = ctx.ws.send.mock.calls.some(call => JSON.parse(call[0]).message && call[0].includes('자동전투가 중단'));
      expect(found).toBe(true);
      clearInterval(ctx.battleIntervals['testuser']);
    });
    it('포션 자동사용 시 메시지 전송', async () => {
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(() => ({ name: '포션', healAmount: 10, left: 1 })),
        inventory: [],
      }));
      await PlayerGameService.handleMove({ ...ctx, dx: 1, dy: 0, getPlayersInRoom: ctx.getPlayersInRoom });
      const found = ctx.ws.send.mock.calls.some(call => JSON.parse(call[0]).message && call[0].includes('자동으로 사용'));
      expect(found).toBe(true);
    });
  });

  describe('handleChat', () => {
    it('글로벌 채팅 메시지 전송', async () => {
      ctx.parseChatCommand = jest.fn(() => ({ type: 'global', message: 'hello' }));
      await PlayerGameService.handleChat({ ...ctx, message: 'hello' });
      expect(ctx.broadcast).toHaveBeenCalled();
    });
    it('플레이어가 없으면 아무 동작도 하지 않음', async () => {
      ctx.PlayerManager.getPlayer = jest.fn(() => null);
      await PlayerGameService.handleChat({ ...ctx, message: 'hi' });
      expect(ctx.broadcast).not.toHaveBeenCalled();
    });
    it('invalid 명령어면 에러 메시지 전송', async () => {
      ctx.parseChatCommand = jest.fn(() => ({ type: 'invalid', message: '에러' }));
      await PlayerGameService.handleChat({ ...ctx, message: 'hi' });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: '에러' }));
    });
    it('지역채팅: 같은 방 플레이어 모두에게 메시지 전송', async () => {
      const p1 = { position: { x: 0, y: 0 }, ws: { send: jest.fn() } };
      const p2 = { position: { x: 0, y: 0 }, ws: { send: jest.fn() } };
      ctx.PlayerManager.getAllPlayers = jest.fn(() => ({ p1, p2 }));
      ctx.PlayerManager.getPlayer = jest.fn(() => ({ name: 'p1', position: { x: 0, y: 0 } }));
      ctx.parseChatCommand = jest.fn(() => ({ type: 'local', message: 'hi' }));
      await PlayerGameService.handleChat({ ...ctx, message: 'hi' });
      expect(p1.ws.send).toHaveBeenCalled();
      expect(p2.ws.send).toHaveBeenCalled();
    });
    it('move 명령어면 handleMove가 호출된다', async () => {
      ctx.parseChatCommand = jest.fn(() => ({ type: 'move', dx: 1, dy: 0 }));
      const spy = jest.spyOn(PlayerGameService, 'handleMove').mockResolvedValue();
      await PlayerGameService.handleChat({ ...ctx, message: '/이동' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('handleCommand', () => {
    it('명령어 핸들러 위임', async () => {
      ctx.commandHandlers['/장착'] = jest.fn();
      await PlayerGameService.handleCommand({ ...ctx, command: '/장착', args: ['나무검'], sendRoomInfo: ctx.sendRoomInfo });
      expect(ctx.commandHandlers['/장착']).toHaveBeenCalled();
    });
    it('없는 명령어면 에러 메시지 전송', async () => {
      await PlayerGameService.handleCommand({ ...ctx, command: '/없는명령', args: [], sendRoomInfo: ctx.sendRoomInfo });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: expect.stringContaining('알 수 없는 명령어') }));
    });
  });

  describe('handlePickup', () => {
    it('아이템 획득 성공 시 인벤토리 추가 및 저장 호출', async () => {
      ctx.getRoom = jest.fn(() => ({ items: [{ id: 1, name: '포션' }], monsters: [], type: 'normal' }));
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      await PlayerGameService.handlePickup({ ...ctx, itemId: 1, getPlayersInRoom: ctx.getPlayersInRoom });
      expect(ctx.savePlayerData).toHaveBeenCalled();
    });
    it('플레이어가 없으면 아무 동작도 하지 않음', async () => {
      ctx.PlayerManager.getPlayer = jest.fn(() => null);
      await PlayerGameService.handlePickup({ ...ctx, itemId: 1, getPlayersInRoom: ctx.getPlayersInRoom });
      expect(ctx.savePlayerData).not.toHaveBeenCalled();
    });
    it('없는 아이템이면 에러 메시지 전송', async () => {
      ctx.getRoom = jest.fn(() => ({ items: [], monsters: [], type: 'normal' }));
      await PlayerGameService.handlePickup({ ...ctx, itemId: 999, getPlayersInRoom: ctx.getPlayersInRoom });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: expect.stringContaining('해당 아이템이 없습니다') }));
    });
  });

  describe('handleAttack', () => {
    it('공격 성공 시 processBattle 호출 및 결과 전송', async () => {
      ctx.getRoom = jest.fn(() => ({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' }));
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.processBattle = jest.fn(() => ({ log: [], monsterDead: false, playerDead: false }));
      await PlayerGameService.handleAttack({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      expect(ctx.savePlayerData).toHaveBeenCalled();
    });
    it('플레이어가 없으면 아무 동작도 하지 않음', async () => {
      ctx.PlayerManager.getPlayer = jest.fn(() => null);
      await PlayerGameService.handleAttack({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      expect(ctx.savePlayerData).not.toHaveBeenCalled();
    });
    it('없는 몬스터면 에러 메시지 전송', async () => {
      ctx.getRoom = jest.fn(() => ({ monsters: [], items: [], type: 'normal' }));
      await PlayerGameService.handleAttack({ ...ctx, monsterId: 999, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: expect.stringContaining('해당 몬스터가 없습니다') }));
    });
    it('몬스터 처치 시 전체 플레이어에게 메시지 전송 및 respawn 호출', async () => {
      ctx.getRoom = jest.fn(() => ({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' }));
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.processBattle = jest.fn(() => ({ log: [], monsterDead: true, playerDead: false }));
      const p1ws = { send: jest.fn() };
      ctx.PlayerManager.getAllPlayers = jest.fn(() => ({
        testuser: { position: { x: 0, y: 0 }, ws: p1ws, world: 1 }
      }));
      await PlayerGameService.handleAttack({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      expect(ctx.respawnMonsterWithDeps).toHaveBeenCalled();
      expect(p1ws.send).toHaveBeenCalled();
    });
    it('플레이어 사망 시 sendRoomInfoToAllInRoom 호출', async () => {
      ctx.getRoom = jest.fn(() => ({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' }));
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.processBattle = jest.fn(() => ({ log: [], monsterDead: false, playerDead: true }));
      await PlayerGameService.handleAttack({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      expect(ctx.sendRoomInfoToAllInRoom).toHaveBeenCalled();
    });
  });

  describe('handleAutoBattle', () => {
    it('자동전투 시작 시 battleIntervals에 등록', async () => {
      ctx.getRoom = jest.fn(() => ({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' }));
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.battleIntervals = {};
      await PlayerGameService.handleAutoBattle({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      expect(ctx.battleIntervals['testuser']).toBeDefined();
      clearInterval(ctx.battleIntervals['testuser']);
    });
    it('플레이어가 없으면 아무 동작도 하지 않음', async () => {
      ctx.PlayerManager.getPlayer = jest.fn(() => null);
      await PlayerGameService.handleAutoBattle({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      expect(ctx.battleIntervals['testuser']).toBeUndefined();
    });
    it('없는 몬스터면 에러 메시지 전송', async () => {
      ctx.getRoom = jest.fn(() => ({ monsters: [], items: [], type: 'normal' }));
      await PlayerGameService.handleAutoBattle({ ...ctx, monsterId: 999, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: expect.stringContaining('해당 몬스터가 없습니다') }));
    });
    it('이미 자동전투 중이면 에러 메시지 전송', async () => {
      ctx.getRoom = jest.fn(() => ({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' }));
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.battleIntervals = { testuser: setTimeout(() => {}, 1000) };
      await PlayerGameService.handleAutoBattle({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg)).toEqual(expect.objectContaining({ message: expect.stringContaining('이미 자동전투 중입니다') }));
      clearTimeout(ctx.battleIntervals['testuser']);
    });
    it('자동전투 중 몬스터가 사라지면 자동전투 중단 메시지 전송', async () => {
      jest.useFakeTimers();
      ctx.getRoom = jest.fn()
        .mockReturnValueOnce({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' })
        .mockReturnValueOnce({ monsters: [], items: [], type: 'normal' });
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.battleIntervals = {};
      await PlayerGameService.handleAutoBattle({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      jest.runOnlyPendingTimers();
      const found = ctx.ws.send.mock.calls.some(call => JSON.parse(call[0]).message && call[0].includes('자동전투가 중단'));
      expect(found).toBe(true);
      jest.useRealTimers();
    });
    it('자동전투 중 몬스터 처치 시 respawn 호출', async () => {
      jest.useFakeTimers();
      ctx.getRoom = jest.fn()
        .mockReturnValue({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' });
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.battleIntervals = {};
      ctx.processBattle = jest.fn(() => ({ log: [], monsterDead: true, playerDead: false }));
      const p1ws = { send: jest.fn() };
      ctx.PlayerManager.getAllPlayers = jest.fn(() => ({ testuser: { position: { x: 0, y: 0 }, ws: p1ws, world: 1 } }));
      await PlayerGameService.handleAutoBattle({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      jest.runOnlyPendingTimers();
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
      expect(ctx.respawnMonsterWithDeps).toHaveBeenCalled();
      jest.useRealTimers();
    });
    it('자동전투 중 플레이어 사망 시 sendRoomInfoToAllInRoom 호출', async () => {
      jest.useFakeTimers();
      ctx.getRoom = jest.fn()
        .mockReturnValue({ monsters: [{ id: 1, name: '슬라임', hp: 10 }], items: [], type: 'normal' });
      ctx.PlayerManager.getPlayer = jest.fn(() => ({
        name: 'testuser',
        position: { x: 0, y: 0 },
        world: 1,
        autoUsePotion: jest.fn(),
        inventory: [],
      }));
      ctx.battleIntervals = {};
      ctx.processBattle = jest.fn(() => ({ log: [], monsterDead: false, playerDead: true }));
      await PlayerGameService.handleAutoBattle({ ...ctx, monsterId: 1, getPlayersInRoom: ctx.getPlayersInRoom, sendInventory: ctx.sendInventory });
      jest.runOnlyPendingTimers();
      await Promise.resolve(); // flush microtasks
      expect(ctx.sendRoomInfoToAllInRoom).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('handleShop', () => {
    it('카테고리 안내 메시지 출력', async () => {
      const ctx = createMockContext({
        getRoom: jest.fn(() => ({ type: 'village' })),
        SHOP_ITEMS: { 무기: [{ name: '나무검', price: 10, desc: '테스트' }] }
      });
      await PlayerGameService.handleShop({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('상점 카테고리');
      expect(msg).toContain('/상점 무기 1');
    });
    it('카테고리/페이지별 아이템 목록 출력', async () => {
      const ctx = createMockContext({
        getRoom: jest.fn(() => ({ type: 'village' })),
        SHOP_ITEMS: { 무기: [
          { name: '나무검', price: 10, desc: '테스트' },
          { name: '철검', price: 20, desc: '테스트2' }
        ] }
      });
      await PlayerGameService.handleShop({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점 무기 1', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('무기 상점 1페이지');
      expect(msg).toContain('나무검');
      expect(msg).toContain('철검');
    });
    it('마을이 아니면 안내', async () => {
      const ctx = createMockContext({ getRoom: jest.fn(() => ({ type: 'field' })), SHOP_ITEMS: { 무기: [] } });
      await PlayerGameService.handleShop({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('상점은 마을에서만');
    });
    it('없는 카테고리 입력 시 안내', async () => {
      const ctx = createMockContext({ getRoom: jest.fn(() => ({ type: 'village' })), SHOP_ITEMS: { 무기: [] } });
      await PlayerGameService.handleShop({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점 없는카테고리', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('상점 카테고리');
    });
    it('페이지 초과 시 빈 목록', async () => {
      const ctx = createMockContext({ getRoom: jest.fn(() => ({ type: 'village' })), SHOP_ITEMS: { 무기: [{ name: '나무검', price: 10, desc: '테스트' }] } });
      await PlayerGameService.handleShop({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점 무기 99', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('무기 상점');
    });
  });

  describe('handleShopSell', () => {
    it('판매 가능한 아이템 목록 출력', async () => {
      const ctx = createMockContext({
        getRoom: jest.fn(() => ({ type: 'village' })),
        SHOP_ITEMS: { 무기: [{ name: '나무검', price: 10, desc: '테스트' }] },
        player: { inventory: [{ name: '나무검' }, { name: '없는아이템' }] }
      });
      await PlayerGameService.handleShopSell({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점판매', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('판매 가능한 아이템');
      expect(msg).toContain('나무검');
      expect(msg).not.toContain('없는아이템');
    });
    it('마을이 아니면 안내', async () => {
      const ctx = createMockContext({ getRoom: jest.fn(() => ({ type: 'field' })), SHOP_ITEMS: { 무기: [] } });
      await PlayerGameService.handleShopSell({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점판매', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('상점은 마을에서만');
    });
    it('판매 가능한 아이템이 없으면 안내', async () => {
      const ctx = createMockContext({ getRoom: jest.fn(() => ({ type: 'village' })), SHOP_ITEMS: { 무기: [] }, player: { inventory: [] } });
      await PlayerGameService.handleShopSell({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/상점판매', PlayerManager: ctx.PlayerManager, getRoom: ctx.getRoom, SHOP_ITEMS: ctx.SHOP_ITEMS });
      const msg = ctx.ws.send.mock.calls[0][0];
      expect(msg).toContain('판매 가능한 아이템이 없습니다');
    });
  });

  describe('handleMove (coverage)', () => {
    it('잘못된 좌표면 에러 메시지', async () => {
      const ctx = createMockContext();
      await PlayerGameService.handleMove({ ...ctx, dx: -999, dy: -999, getPlayersInRoom: ctx.getPlayersInRoom });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg).message).toContain('잘못된 좌표');
    });
  });

  describe('handleCommand (coverage)', () => {
    it('명령어 핸들러가 정의되어 있지 않으면 에러', async () => {
      const ctx = createMockContext();
      await PlayerGameService.handleCommand({ ...ctx, command: '/없는명령', args: [], commandHandlers: null, sendRoomInfo: ctx.sendRoomInfo });
      const callArg = ctx.ws.send.mock.calls[0][0];
      expect(JSON.parse(callArg).message).toContain('명령어 핸들러가 정의되어 있지 않습니다');
    });
  });
});

describe('PlayerGameService coverage', () => {
  it('잘못된 명령어 입력 시 에러 없이 처리', async () => {
    const ctx = createMockContext();
    await expect(PlayerGameService.handleCommand({ ...ctx, command: '/없는명령', args: [], commandHandlers: null, sendRoomInfo: ctx.sendRoomInfo })).resolves.not.toThrow();
  });
  it('잘못된 이동(맵 밖) 시 안내', async () => {
    const ctx = createMockContext();
    await PlayerGameService.handleMove({ ...ctx, dx: 999, dy: 999, getPlayersInRoom: ctx.getPlayersInRoom });
    const callArg = ctx.ws.send.mock.calls[0][0];
    expect(JSON.parse(callArg).message).toContain('잘못된 좌표');
  });
  // it('인벤토리 없는 아이템 사용 시 안내', async () => {
  //   const ctx = createMockContext();
  //   ctx.player = { inventory: [], position: { x: 1, y: 2 }, world: 1 };
  //   await PlayerGameService.handleUseItem({ ...ctx, ws: ctx.ws, playerName: 'testuser', message: '/사용 없는아이템', PlayerManager: ctx.PlayerManager });
  //   const callArg = ctx.ws.send.mock.calls[0][0];
  //   expect(callArg).toContain('아이템이 없습니다');
  // });
}); 