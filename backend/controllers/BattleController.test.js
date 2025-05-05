const BattleController = require('./BattleController');
const PlayerData = require('../models/PlayerData');
const { getRoom } = require('../data/map');
const { processBattle } = require('../battle');

jest.mock('../models/PlayerData');
jest.mock('../data/map');
jest.mock('../battle');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('BattleController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, user: { userId: 'u1' } };
    res = createMockRes();
    next = jest.fn();
    PlayerData.findOne.mockReset();
    getRoom.mockReset();
    processBattle.mockReset();
  });

  it('필수 파라미터 누락 시 400', async () => {
    req.body = { x: 1, y: 1, world: 1 }; // monsterId 없음
    await BattleController.attack(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('플레이어 데이터 없음 시 404', async () => {
    req.body = { monsterId: 1, x: 1, y: 1, world: 1 };
    PlayerData.findOne.mockResolvedValue(null);
    await BattleController.attack(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('방 없음 시 404', async () => {
    req.body = { monsterId: 1, x: 1, y: 1, world: 1 };
    PlayerData.findOne.mockResolvedValue({ toObject: () => ({}) });
    getRoom.mockReturnValue(null);
    await BattleController.attack(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('몬스터 없음 시 404', async () => {
    req.body = { monsterId: 1, x: 1, y: 1, world: 1 };
    PlayerData.findOne.mockResolvedValue({ toObject: () => ({}) });
    getRoom.mockReturnValue({ monsters: [] });
    await BattleController.attack(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('정상 전투 시 결과 반환', async () => {
    req.body = { monsterId: 1, x: 1, y: 1, world: 1 };
    const pdata = { toObject: () => ({ gold: 0 }), save: jest.fn() };
    PlayerData.findOne.mockResolvedValue(pdata);
    getRoom.mockReturnValue({ monsters: [{ id: 1 }], type: 'field' });
    processBattle.mockReturnValue({ log: ['공격!'] });
    await BattleController.attack(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, log: ['공격!'] }));
    expect(pdata.save).toHaveBeenCalled();
  });

  it('예외 발생 시 next(err) 호출', async () => {
    req.body = { monsterId: 1, x: 1, y: 1, world: 1 };
    PlayerData.findOne.mockRejectedValue(new Error('DB 에러'));
    await BattleController.attack(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
}); 