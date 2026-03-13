const express = require('express');
const request = require('supertest');

jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('../redis', () => ({ scard: jest.fn() }));
jest.mock('../tokenService', () => ({ generateRefreshToken: jest.fn() }));

const axios = require('axios');
const redis = require('../redis');
const tokenService = require('../tokenService');
const { auth } = require('../middleware/auth');

function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/test', auth, (req, res) => res.json({ user: req.user }));
  return app;
}

describe('auth middleware', () => {
  let app;
  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
  });

  it('should set X-Refresh-Token when user has no existing tokens', async () => {
    axios.get.mockResolvedValue({ data: { code: 0, data: { id: 42, username: 'alice' } } });
    redis.scard.mockResolvedValue(0);
    tokenService.generateRefreshToken.mockResolvedValue('new-rt');

    const res = await request(app).get('/test').set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(res.headers['x-refresh-token']).toBe('new-rt');
  });

  it('should NOT set X-Refresh-Token when user already has tokens', async () => {
    axios.get.mockResolvedValue({ data: { code: 0, data: { id: 42, username: 'alice' } } });
    redis.scard.mockResolvedValue(2);

    const res = await request(app).get('/test').set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(res.headers['x-refresh-token']).toBeUndefined();
  });

  it('should still proceed when refresh token generation fails', async () => {
    axios.get.mockResolvedValue({ data: { code: 0, data: { id: 5, username: 'bob' } } });
    redis.scard.mockRejectedValue(new Error('Redis down'));
    jest.spyOn(console, 'error').mockImplementation();

    const res = await request(app).get('/test').set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 5, username: 'bob' });
    console.error.mockRestore();
  });
});
