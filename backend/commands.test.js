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
  return { send: jest.fn() };
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
      player = { name: '유저', world: 1, position: { x: 4, y: 4 } };
      players = { 유저: player };
      getRoom = jest.fn();
      getPlayersInRoom = jest.fn();
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
      expect(player.position).toEqual({ x: 0, y: 4 });
      expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('무인도 해변'));
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
      map.ISLAND_VILLAGE_POS = { x: 2, y: 4 };
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
}); 