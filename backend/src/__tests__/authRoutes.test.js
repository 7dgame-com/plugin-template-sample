const express = require('express');
const request = require('supertest');

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('../redis', () => ({ incr: jest.fn(), expire: jest.fn(), scard: jest.fn() }));
jest.mock('../tokenService', () => ({
  isTokenUsed: jest.fn(),
  getUserIdFromUsedToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  rotateRefreshToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

const axios = require('axios');
const redis = require('../redis');
const tokenService = require('../tokenService');
const authRoutes = require('../routes/auth');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('POST /api/auth/refresh', () => {
  let app;
  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
    redis.incr.mockResolvedValue(1);
  });

  it('should return 400 when refreshToken missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('should return 401 on replay attack', async () => {
    tokenService.isTokenUsed.mockResolvedValue(true);
    tokenService.getUserIdFromUsedToken.mockResolvedValue('42');
    tokenService.revokeAllUserTokens.mockResolvedValue();
    jest.spyOn(console, 'warn').mockImplementation();

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'reused' });
    expect(res.status).toBe(401);
    expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith('42');
    console.warn.mockRestore();
  });

  it('should return 401 for invalid refresh token', async () => {
    tokenService.isTokenUsed.mockResolvedValue(false);
    tokenService.verifyRefreshToken.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'bad' });
    expect(res.status).toBe(401);
  });

  it('should return 429 when rate limited', async () => {
    tokenService.isTokenUsed.mockResolvedValue(false);
    tokenService.verifyRefreshToken.mockResolvedValue('42');
    redis.incr.mockResolvedValue(999);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'ok' });
    expect(res.status).toBe(429);
  });

  it('should return 502 when main backend fails', async () => {
    tokenService.isTokenUsed.mockResolvedValue(false);
    tokenService.verifyRefreshToken.mockResolvedValue('42');
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'));
    jest.spyOn(console, 'error').mockImplementation();

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'ok' });
    expect(res.status).toBe(502);
    console.error.mockRestore();
  });

  it('should return new tokens on success', async () => {
    tokenService.isTokenUsed.mockResolvedValue(false);
    tokenService.verifyRefreshToken.mockResolvedValue('42');
    axios.post.mockResolvedValue({ data: { code: 0, data: { accessToken: 'new-jwt' } } });
    tokenService.rotateRefreshToken.mockResolvedValue('new-refresh');

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ accessToken: 'new-jwt', refreshToken: 'new-refresh' });
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/v1/plugin/refresh-token'),
      { userId: '42' }
    );
  });
});

describe('POST /api/auth/logout', () => {
  let app;
  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('should revoke tokens on success', async () => {
    axios.get.mockResolvedValue({ data: { code: 0, data: { id: 42, username: 'alice' } } });
    redis.scard.mockResolvedValue(1);
    tokenService.revokeAllUserTokens.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith('42');
  });
});
