const errorHandler = require('./errorHandler');

describe('errorHandler middleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('개발환경: 에러 메시지와 스택을 반환', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('테스트 에러');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: '테스트 에러', stack: expect.any(String) }));
  });

  it('에러 status가 있으면 해당 코드로 반환', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Not Found');
    err.status = 404;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Not Found' }));
  });

  it('production: 에러 메시지 숨김', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('DB 에러');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: '서버 오류가 발생했습니다.' }));
    expect(res.json.mock.calls[0][0].stack).toBeUndefined();
  });
}); 