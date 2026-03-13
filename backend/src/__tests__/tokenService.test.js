const crypto = require('crypto');

jest.mock('../redis', () => {
  const pipeline = {
    sadd: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    hset: jest.fn().mockReturnThis(),
    srem: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return {
    pipeline: jest.fn(() => pipeline),
    hgetall: jest.fn(),
    sismember: jest.fn(),
    exists: jest.fn(),
    get: jest.fn(),
    smembers: jest.fn(),
    __pipeline: pipeline,
  };
});

const redis = require('../redis');
const tokenService = require('../tokenService');

describe('tokenService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('hashToken', () => {
    it('should return a SHA-256 hex hash', () => {
      const hash = tokenService.hashToken('test');
      const expected = crypto.createHash('sha256').update('test').digest('hex');
      expect(hash).toBe(expected);
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a 64-char hex string and store in Redis', async () => {
      const token = await tokenService.generateRefreshToken('42');
      expect(token).toHaveLength(64);
      const pl = redis.__pipeline;
      expect(pl.sadd).toHaveBeenCalledWith('refresh_token:42', expect.any(String));
      expect(pl.hset).toHaveBeenCalled();
      expect(pl.exec).toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return userId for valid token', async () => {
      const now = Math.floor(Date.now() / 1000);
      redis.hgetall.mockResolvedValue({ userId: '42', expiresAt: String(now + 3600) });
      redis.sismember.mockResolvedValue(1);
      expect(await tokenService.verifyRefreshToken('valid')).toBe('42');
    });

    it('should return null for empty/expired/missing token', async () => {
      expect(await tokenService.verifyRefreshToken(null)).toBeNull();
      redis.hgetall.mockResolvedValue({});
      expect(await tokenService.verifyRefreshToken('x')).toBeNull();
    });
  });

  describe('rotateRefreshToken', () => {
    it('should revoke old and generate new', async () => {
      const result = await tokenService.rotateRefreshToken('old', '42');
      expect(result).toHaveLength(64);
      const pl = redis.__pipeline;
      expect(pl.srem).toHaveBeenCalled();
      expect(pl.set).toHaveBeenCalled();
    });
  });

  describe('isTokenUsed', () => {
    it('should detect used tokens', async () => {
      redis.exists.mockResolvedValue(1);
      expect(await tokenService.isTokenUsed('used')).toBe(true);
      redis.exists.mockResolvedValue(0);
      expect(await tokenService.isTokenUsed('fresh')).toBe(false);
      expect(await tokenService.isTokenUsed(null)).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should delete all token data', async () => {
      redis.smembers.mockResolvedValue(['h1', 'h2']);
      await tokenService.revokeAllUserTokens('42');
      const pl = redis.__pipeline;
      expect(pl.del).toHaveBeenCalledWith('refresh_token_data:h1');
      expect(pl.del).toHaveBeenCalledWith('refresh_token_data:h2');
      expect(pl.del).toHaveBeenCalledWith('refresh_token:42');
    });
  });

  describe('getUserIdFromUsedToken', () => {
    it('should return userId or null', async () => {
      redis.get.mockResolvedValue('42');
      expect(await tokenService.getUserIdFromUsedToken('t')).toBe('42');
      redis.get.mockResolvedValue('1');
      expect(await tokenService.getUserIdFromUsedToken('t')).toBeNull();
      expect(await tokenService.getUserIdFromUsedToken(null)).toBeNull();
    });
  });
});
