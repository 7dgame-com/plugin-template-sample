import express from 'express';
import request from 'supertest';

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

import axios from 'axios';
import redis from '../redis';
import * as tokenService from '../tokenService';
import authRoutes from '../routes/auth';

const mockedAxios = jest.mocked(axios);
const mockedRedis = jest.mocked(redis);
const mockedTokenService = jest.mocked(tokenService);

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('POST /api/auth/refresh', () => {
  let app: express.Express;
  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
    (mockedRedis.incr as jest.Mock).mockResolvedValue(1);
  });

  it('should return 400 when refreshToken missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('should return 401 on replay attack', async () => {
    (mockedTokenService.isTokenUsed as jest.Mock).mockResolvedValue(true);
    (mockedTokenService.getUserIdFromUsedToken as jest.Mock).mockResolvedValue('42');
    (mockedTokenService.revokeAllUserTokens as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation();

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'reused' });
    expect(res.status).toBe(401);
    expect(mockedTokenService.revokeAllUserTokens).toHaveBeenCalledWith('42');
    (console.warn as jest.Mock).mockRestore();
  });

  it('should return 401 for invalid refresh token', async () => {
    (mockedTokenService.isTokenUsed as jest.Mock).mockResolvedValue(false);
    (mockedTokenService.verifyRefreshToken as jest.Mock).mockResolvedValue(null);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'bad' });
    expect(res.status).toBe(401);
  });

  it('should return 429 when rate limited', async () => {
    (mockedTokenService.isTokenUsed as jest.Mock).mockResolvedValue(false);
    (mockedTokenService.verifyRefreshToken as jest.Mock).mockResolvedValue('42');
    (mockedRedis.incr as jest.Mock).mockResolvedValue(999);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'ok' });
    expect(res.status).toBe(429);
  });

  it('should return 502 when main backend fails', async () => {
    (mockedTokenService.isTokenUsed as jest.Mock).mockResolvedValue(false);
    (mockedTokenService.verifyRefreshToken as jest.Mock).mockResolvedValue('42');
    (mockedAxios.post as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
    jest.spyOn(console, 'error').mockImplementation();

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'ok' });
    expect(res.status).toBe(502);
    (console.error as jest.Mock).mockRestore();
  });

  it('should return new tokens on success', async () => {
    (mockedTokenService.isTokenUsed as jest.Mock).mockResolvedValue(false);
    (mockedTokenService.verifyRefreshToken as jest.Mock).mockResolvedValue('42');
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { code: 0, data: { accessToken: 'new-jwt' } } });
    (mockedTokenService.rotateRefreshToken as jest.Mock).mockResolvedValue('new-refresh');

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ accessToken: 'new-jwt', refreshToken: 'new-refresh' });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/v1/plugin/refresh-token'),
      { userId: '42' }
    );
  });
});

describe('POST /api/auth/logout', () => {
  let app: express.Express;
  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('should revoke tokens on success', async () => {
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { code: 0, data: { id: 42, username: 'alice' } } });
    (mockedRedis.scard as jest.Mock).mockResolvedValue(1);
    (mockedTokenService.revokeAllUserTokens as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(mockedTokenService.revokeAllUserTokens).toHaveBeenCalledWith('42');
  });
});
