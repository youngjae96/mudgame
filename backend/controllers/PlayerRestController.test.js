const PlayerRestController = require('./PlayerRestController');
const PlayerData = require('../models/PlayerData');

jest.mock('../models/PlayerData');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('PlayerRestController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { user: { userId: 'u1' } };
    res = createMockRes();
    next = jest.fn();
    PlayerData.findOne.mockReset();
  });

  describe('getMyInfo', () => {
    it('플레이어 데이터 없음 시 404', async () => {
      PlayerData.findOne.mockResolvedValue(null);
      await PlayerRestController.getMyInfo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
    it('정상 반환', async () => {
      const pdata = { name: '유저', world: 1, position: { x: 1, y: 1 }, hp: 10, maxHp: 10, mp: 5, maxMp: 5, str: 1, dex: 2, int: 3, gold: 100, equipWeapon: {}, equipArmor: {} };
      PlayerData.findOne.mockResolvedValue(pdata);
      await PlayerRestController.getMyInfo(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, player: expect.objectContaining({ username: '유저' }) }));
    });
    it('예외 발생 시 next(err) 호출', async () => {
      PlayerData.findOne.mockRejectedValue(new Error('DB 에러'));
      await PlayerRestController.getMyInfo(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMyInventory', () => {
    it('플레이어 데이터 없음 시 404', async () => {
      PlayerData.findOne.mockResolvedValue(null);
      await PlayerRestController.getMyInventory(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
    it('정상 반환', async () => {
      const pdata = { inventory: [{ name: '포션' }] };
      PlayerData.findOne.mockResolvedValue(pdata);
      await PlayerRestController.getMyInventory(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, inventory: [{ name: '포션' }] }));
    });
    it('예외 발생 시 next(err) 호출', async () => {
      PlayerData.findOne.mockRejectedValue(new Error('DB 에러'));
      await PlayerRestController.getMyInventory(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
}); 