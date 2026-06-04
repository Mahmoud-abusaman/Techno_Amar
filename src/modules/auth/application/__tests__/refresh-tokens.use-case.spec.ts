import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokensUseCase } from '../refresh-tokens.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IRefreshTokenPort, ITokenPairFactory } from '@domain/ports/token.port';
import { UserEntity } from '@domain/entities/user.entity';
import { TokenPair } from '@domain/ports/token.port';
import { UserRole, GazaCities } from '@/generated/prisma/enums';

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
  ({
    id: 1n,
    full_name: 'Ahmed Al-Masri',
    email: 'ahmed@example.com',
    password_hash: 'hashed_password',
    national_id: '123456789',
    employee_id: null,
    phone: '+970591234567',
    address: 'Gaza City',
    city: GazaCities.GAZA,
    is_verified: true,
    role: UserRole.CITIZEN,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as UserEntity);

const makeTokenPair = (): TokenPair => ({
  accessToken: 'new.access.token',
  refreshToken: 'new.refresh.token',
  expiresAt: new Date(Date.now() + 900_000),
});

const REFRESH_TOKEN = 'valid.refresh.token.jwt';
const REFRESH_PAYLOAD = { sub: '1', tokenId: 'token-uuid-1234' };

describe('RefreshTokensUseCase', () => {
  let useCase: RefreshTokensUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let refreshTokenPort: jest.Mocked<IRefreshTokenPort>;
  let tokenPairFactory: jest.Mocked<ITokenPairFactory>;

  beforeEach(() => {
    userRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByNationalId: jest.fn(),
      findByEmployeeId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    refreshTokenPort = {
      generate: jest.fn(),
      verify: jest.fn(),
      revoke: jest.fn(),
    };

    tokenPairFactory = {
      createPair: jest.fn(),
    };

    useCase = new RefreshTokensUseCase(userRepo, refreshTokenPort, tokenPairFactory);
  });

  describe('execute', () => {
    it('returns new tokens and user on a valid refresh token', async () => {
      const user = makeUser();
      const tokens = makeTokenPair();

      refreshTokenPort.verify.mockResolvedValue(REFRESH_PAYLOAD);
      userRepo.findById.mockResolvedValue(user);
      refreshTokenPort.revoke.mockResolvedValue(undefined);
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      const result = await useCase.execute(REFRESH_TOKEN);

      expect(result.tokens).toBe(tokens);
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      });
    });

    it('throws UnauthorizedException when refresh token verification fails', async () => {
      refreshTokenPort.verify.mockRejectedValue(new Error('jwt expired'));

      await expect(useCase.execute(REFRESH_TOKEN)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      refreshTokenPort.verify.mockResolvedValue(REFRESH_PAYLOAD);
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(REFRESH_TOKEN)).rejects.toThrow(
        new UnauthorizedException('User not found or inactive'),
      );
      expect(refreshTokenPort.revoke).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user account is inactive', async () => {
      refreshTokenPort.verify.mockResolvedValue(REFRESH_PAYLOAD);
      userRepo.findById.mockResolvedValue(makeUser({ is_active: false }));

      await expect(useCase.execute(REFRESH_TOKEN)).rejects.toThrow(
        new UnauthorizedException('User not found or inactive'),
      );
      expect(refreshTokenPort.revoke).not.toHaveBeenCalled();
    });

    it('revokes the old token before issuing a new pair', async () => {
      refreshTokenPort.verify.mockResolvedValue(REFRESH_PAYLOAD);
      userRepo.findById.mockResolvedValue(makeUser());
      refreshTokenPort.revoke.mockResolvedValue(undefined);
      tokenPairFactory.createPair.mockResolvedValue(makeTokenPair());

      await useCase.execute(REFRESH_TOKEN);

      expect(refreshTokenPort.revoke).toHaveBeenCalledWith(REFRESH_PAYLOAD.tokenId);
      expect(refreshTokenPort.revoke.mock.invocationCallOrder[0]).toBeLessThan(
        tokenPairFactory.createPair.mock.invocationCallOrder[0],
      );
    });

    it('looks up user by bigint id parsed from the token subject', async () => {
      refreshTokenPort.verify.mockResolvedValue({ sub: '42', tokenId: 'tid' });
      userRepo.findById.mockResolvedValue(makeUser({ id: 42n }));
      refreshTokenPort.revoke.mockResolvedValue(undefined);
      tokenPairFactory.createPair.mockResolvedValue(makeTokenPair());

      await useCase.execute(REFRESH_TOKEN);

      expect(userRepo.findById).toHaveBeenCalledWith(42n);
    });
  });
});
