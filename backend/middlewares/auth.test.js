const auth = require('./auth');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('auth middleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jwt.verify.mockReset();
  });

  it('토큰이 없으면 401 반환', () => {
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('Bearer 형식이 아니면 401 반환', () => {
    req.headers['authorization'] = 'Basic abc';
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('유효하지 않은 토큰이면 401 반환', () => {
    req.headers['authorization'] = 'Bearer invalidtoken';
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('정상 토큰이면 req.user 세팅 후 next 호출', () => {
    req.headers['authorization'] = 'Bearer validtoken';
    const decoded = { userId: 'u1', username: 'test' };
    jwt.verify.mockReturnValue(decoded);
    auth(req, res, next);
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
}); 