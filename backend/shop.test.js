const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('./server');
const User = require('./models/User');
const PlayerData = require('./models/PlayerData');

const TEST_USER = {
  username: 'testshopuser_' + Date.now(),
  password: 'pw1234'
};

async function clearTestShopUsers() {
  await User.deleteMany({ username: /testshopuser/ });
  await PlayerData.deleteMany({ name: /testshopuser/ });
}

describe('상점 API 통합 테스트', () => {
  let server;
  let token;
  beforeAll((done) => {
    server = app.listen(5002, done);
  });
  afterAll(async () => {
    await clearTestShopUsers();
    await mongoose.connection.close();
    server.close();
  });

  it('회원가입 및 로그인', async () => {
    await request(server)
      .post('/api/auth/register')
      .send(TEST_USER);
    const res = await request(server)
      .post('/api/auth/login')
      .send(TEST_USER);
    expect(res.body.success).toBe(true);
    token = res.body.token;
  });

  it('상점 아이템 목록 조회', async () => {
    const res = await request(server)
      .get('/api/shop/items')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(res.body.items).toBeDefined();
    expect(typeof res.body.items).toBe('object');
  });
}); 