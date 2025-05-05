const commands = require('./commands');

// Mock ShopService and PlayerService
const mockShopService = {
  buyItem: jest.fn(),
  sellItem: jest.fn(),
};
const mockPlayerService = {};

// Mock PlayerController methods
jest.mock('./controllers/PlayerController', () => ({
  setPlayerServiceInstance: jest.fn(),
  handleEquipCommand: jest.fn(),
  handleUnequipCommand: jest.fn(),
}));

// Helper to create a mock ws
function createMockWs() {
  return { send: jest.fn(), readyState: 1 };
}

describe('commands.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    commands.setupCommands({ shopService: mockShopService, playerService: mockPlayerService });
  });

  describe('handleBuyCommand', () => {
    it('buyItem을 호출한다', () => {
      mockShopService.buyItem.mockReturnValue('구매결과');
      const result = commands.handleBuyCommand({ item: '포션' });
      expect(mockShopService.buyItem).toHaveBeenCalledWith({ item: '포션' });
      expect(result).toBe('구매결과');
    });
  });

  describe('handleSellCommand', () => {
    it('sellItem을 호출한다', () => {
      mockShopService.sellItem.mockReturnValue('판매결과');
      const result = commands.handleSellCommand({ item: '포션' });
      expect(mockShopService.sellItem).toHaveBeenCalledWith({ item: '포션' });
      expect(result).toBe('판매결과');
    });
  });

  describe('handleTeleportCommand', () => {
    let ws, player, players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo;
    beforeEach(() => {
      ws = createMockWs();
      player = { name: '유저', world: 1, position: { x: 4, y: 4 }, ws };
      players = { 유저: player };
      getRoom = jest.fn((world, x, y) => ({ type: (world === 1 && x === 4 && y === 4) ? 'village' : (world === 2 && x === 4 && y === 7) ? 'village' : 'field', name: (world === 1 && x === 4 && y === 4) ? '마을 광장' : (world === 2 && x === 4 && y === 7) ? '무인도 오두막' : '필드', description: '', items: [], monsters: [] }));
      getPlayersInRoom = jest.fn(() => []);
      MAP_SIZE = 10;
      VILLAGE_POS = { x: 0, y: 0 };
      sendRoomInfo = jest.fn();
      sendInventory = jest.fn();
      sendCharacterInfo = jest.fn();
    });

    it('플레이어가 없으면 아무 동작 안함', () => {
      commands.handleTeleportCommand({ ws, playerName: '없는유저', message: '/텔포 무인도', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(ws.send).not.toHaveBeenCalled();
    });

    it('인자가 부족하면 가이드 메시지', () => {
      commands.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('사용법'));
    });

    it('무인도 이동 성공', () => {
      commands.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포 무인도', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(player.world).toBe(2);
      expect(player.position).toEqual({ x: 4, y: 7 });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('무인도 오두막'));
      expect(sendRoomInfo).toHaveBeenCalled();
      expect(sendInventory).toHaveBeenCalled();
      expect(sendCharacterInfo).toHaveBeenCalled();
    });

    it('무인도 이동 실패(마을 광장 아님)', () => {
      player.position = { x: 1, y: 1 };
      commands.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포 무인도', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('마을 광장에서만'));
    });

    it('마을 이동 성공', () => {
      player.world = 2;
      const map = require('./data/map');
      const old = map.ISLAND_VILLAGE_POS;
      map.ISLAND_VILLAGE_POS = { x: 4, y: 7 };
      player.position = map.ISLAND_VILLAGE_POS;
      const commandsReloaded = require('./commands');
      commandsReloaded.setupCommands({ shopService: mockShopService, playerService: mockPlayerService });
      commandsReloaded.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포 마을', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(player.world).toBe(1);
      expect(player.position).toEqual({ x: 4, y: 4 });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('마을 광장'));
      map.ISLAND_VILLAGE_POS = old;
    });

    it('마을 이동 실패(무인도 오두막 아님)', () => {
      player.world = 2;
      player.position = { x: 1, y: 1 };
      commands.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포 마을', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('무인도 오두막'));
    });

    it('동굴 이동 성공', () => {
      player.world = 2;
      player.position = { x: 2, y: 6 };
      commands.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포 동굴', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(player.world).toBe(3);
      expect(player.position).toEqual({ x: 0, y: 0 });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('동굴로 들어갑니다'));
    });

    it('동굴 이동 실패(동굴 입구 아님)', () => {
      player.world = 2;
      player.position = { x: 1, y: 1 };
      commands.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포 동굴', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('동굴 입구'));
    });

    it('지원하지 않는 지역', () => {
      commands.handleTeleportCommand({ ws, playerName: '유저', message: '/텔포 바다', players, getRoom, getPlayersInRoom, MAP_SIZE, VILLAGE_POS, sendRoomInfo, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('지원하지 않는 지역'));
    });
  });

  describe('handleInnCommand', () => {
    let player, players, getRoom, ws, savePlayerData, sendInventory, sendCharacterInfo;
    beforeEach(() => {
      players = {};
      player = { name: '유저', world: 1, position: { x: 4, y: 4 }, hp: 10, maxHp: 20, mp: 5, maxMp: 10, gold: 100 };
      players['유저'] = player;
      getRoom = jest.fn();
      ws = createMockWs();
      savePlayerData = jest.fn().mockResolvedValue();
      sendInventory = jest.fn();
      sendCharacterInfo = jest.fn();
      getRoom.mockReturnValue({ type: 'village' });
    });
    it('마을에서 HP/MP 회복, 골드 차감', () => {
      commands.handleInnCommand({ ws, playerName: '유저', players, getRoom, savePlayerData, sendInventory, sendCharacterInfo });
      expect(player.hp).toBe(20);
      expect(player.mp).toBe(10);
      expect(player.gold).toBe(50);
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('회복'));
    });
    it('마을이 아니면 안내', () => {
      getRoom.mockReturnValue({ type: 'field' });
      commands.handleInnCommand({ ws, playerName: '유저', players, getRoom, savePlayerData, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('마을에서만'));
    });
    it('골드 부족 시 에러', () => {
      player.gold = 10;
      commands.handleInnCommand({ ws, playerName: '유저', players, getRoom, savePlayerData, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('골드가 부족'));
    });
    it('이미 풀피/풀마면 안내', () => {
      player.hp = 20; player.mp = 10;
      commands.handleInnCommand({ ws, playerName: '유저', players, getRoom, savePlayerData, sendInventory, sendCharacterInfo });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('가득'));
    });
  });

  describe('handleAdminCommand', () => {
    let ws, admin, target, players, sendInventory, sendCharacterInfo, getRoom;
    beforeEach(() => {
      ws = createMockWs();
      admin = { name: '운영자', ws, world: 1, position: { x: 1, y: 1 }, inventory: [], gold: 0 };
      target = { name: '유저', ws: createMockWs(), world: 2, position: { x: 2, y: 2 }, inventory: [], gold: 100 };
      players = { 운영자: admin, 유저: target };
      sendInventory = jest.fn();
      sendCharacterInfo = jest.fn();
      getRoom = jest.fn();
      global.wss = { clients: [{ readyState: 1, send: jest.fn() }] };
    });
    afterEach(() => { delete global.wss; });

    it('공지: 전체 공지 브로드캐스트', () => {
      commands.handleAdminCommand({ ws, playerName: '운영자', message: '/운영자 공지 테스트공지', players, getRoom, sendInventory, sendCharacterInfo });
      expect(global.wss.clients[0].send).toHaveBeenCalledWith(expect.stringContaining('테스트공지'));
    });

    it('골드지급: 대상에게 골드 지급', () => {
      commands.handleAdminCommand({ ws, playerName: '운영자', message: '/운영자 골드지급 유저 500', players, getRoom, sendInventory, sendCharacterInfo });
      expect(target.gold).toBe(600);
      expect(sendInventory).toHaveBeenCalledWith(target);
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('지급 완료'));
      // JSON 메시지 허용
      const calls = target.ws.send.mock.calls;
      const found = calls.some(call => {
        try {
          const msg = JSON.parse(call[0]);
          return msg.message && msg.message.includes('지급되었습니다');
        } catch (e) {
          return typeof call[0] === 'string' && call[0].includes('지급되었습니다');
        }
      });
      expect(found).toBe(true);
    });

    it('아이템지급: 대상에게 아이템 지급', () => {
      commands.handleAdminCommand({ ws, playerName: '운영자', message: '/운영자 아이템지급 유저 황금 열쇠', players, getRoom, sendInventory, sendCharacterInfo });
      expect(target.inventory.some(i => i.name === '황금 열쇠')).toBe(true);
      expect(sendInventory).toHaveBeenCalledWith(target);
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('지급 완료'));
      // JSON 메시지 허용
      const calls = target.ws.send.mock.calls;
      const found = calls.some(call => {
        try {
          const msg = JSON.parse(call[0]);
          return msg.message && msg.message.includes('지급되었습니다');
        } catch (e) {
          return typeof call[0] === 'string' && call[0].includes('지급되었습니다');
        }
      });
      expect(found).toBe(true);
    });

    it('텔포: 운영자가 대상 위치로 이동', () => {
      admin.world = 1; admin.position = { x: 1, y: 1 };
      target.world = 2; target.position = { x: 5, y: 5 };
      global.getRoom = jest.fn();
      global.getPlayersInRoom = jest.fn();
      const { MAP_SIZE, VILLAGE_POS } = require('./data/map');
      const { sendRoomInfo } = require('./utils/broadcast');
      jest.spyOn(require('./utils/broadcast'), 'sendRoomInfo').mockImplementation(() => {});
      commands.handleAdminCommand({ ws, playerName: '운영자', message: '/운영자 텔포 유저', players, getRoom, sendInventory, sendCharacterInfo });
      expect(admin.world).toBe(2);
      expect(admin.position).toEqual({ x: 5, y: 5 });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('텔레포트 완료'));
      // JSON 메시지 허용
      const calls = admin.ws.send.mock.calls;
      const found = calls.some(call => {
        try {
          const msg = JSON.parse(call[0]);
          return msg.message && msg.message.includes('텔레포트 되었습니다');
        } catch (e) {
          return typeof call[0] === 'string' && call[0].includes('텔레포트 되었습니다');
        }
      });
      expect(found).toBe(true);
      require('./utils/broadcast').sendRoomInfo.mockRestore();
      delete global.getRoom;
      delete global.getPlayersInRoom;
    });
  });
}); 