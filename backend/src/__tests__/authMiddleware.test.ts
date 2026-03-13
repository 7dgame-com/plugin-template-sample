import express from 'express';
import request from 'supertest';

jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('../redis', () => ({ scard: jest.fn() }));
jest.mock('../tokenService', () => ({ generateRefreshToken: jest.fn() }));

import axios from 'axios';
import redis from '../redis';
import * as tokenService from '../tokenService';
import { auth } from '../middleware/auth';

const mockedAxios = jest.mocked(axios);
const mockedRedis = jest.mocked(redis);
const mockedTokenService = jest.mocked(tokenService);

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.get('/test', auth, (req, res) => res.json({ user: (req as any).user }));
  return app;
}

describe('auth middleware', () => {
  let app: express.Express;
  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
  });

  it('should set X-Refresh-Token when user has no existing tokens', async () => {
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { code: 0, data: { id: 42, username: 'alice' } } });
    (mockedRedis.scard as jest.Mock).mockResolvedValue(0);
    (mockedTokenService.generateRefreshToken as jest.Mock).mockResolvedValue('new-rt');

    const res = await request(app).get('/test').set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(res.headers['x-refresh-token']).toBe('new-rt');
  });

  it('should NOT set X-Refresh-Token when user already has tokens', async () => {
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { code: 0, data: { id: 42, username: 'alice' } } });
    (mockedRedis.scard as jest.Mock).mockResolvedValue(2);

    const res = await request(app).get('/test').set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(res.headers['x-refresh-token']).toBeUndefined();
  });

  it('should still proceed when refresh token generation fails', async () => {
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { code: 0, data: { id: 5, username: 'bob' } } });
    (mockedRedis.scard as jest.Mock).mockRejectedValue(new Error('Redis down'));
    jest.spyOn(console, 'error').mockImplementation();

    const res = await request(app).get('/test').set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 5, username: 'bob' });
    (console.error as jest.Mock).mockRestore();
  });
});
