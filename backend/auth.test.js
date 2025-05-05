const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./server');
const PlayerData = require('./models/PlayerData');
const User = require('./models/User');

const TEST_USER = {
  username: 'testuser_' + Date.now(),
  password: 'pw1234'
};

async function clearTestUsers() {
  await User.deleteMany({ username: /testuser/ });
  await PlayerData.deleteMany({ name: /testuser/ });
}

describe('인증/플레이어 API 통합 테스트', () => {
  let server;
  let token;

  beforeAll((done) => {
    server = app.listen(5001, done);
  });
  afterAll(async () => {
    await clearTestUsers();
    await mongoose.connection.close();
    server.close();
  });

  it('회원가입', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send(TEST_USER);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBeDefined();
  });

  it('로그인', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send(TEST_USER);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('JWT 인증으로 내 정보 조회', async () => {
    const res = await request(server)
      .get('/api/player/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(res.body.player).toBeDefined();
    expect(res.body.player.username).toBe(TEST_USER.username);
  });

  it('JWT 인증으로 내 인벤토리 조회', async () => {
    const res = await request(server)
      .get('/api/player/inventory')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.inventory)).toBe(true);
  });
}); 