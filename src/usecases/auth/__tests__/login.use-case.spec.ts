import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../login.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IHashPort } from '@domain/ports/hash.port';
import { ITokenPairFactory } from '@domain/ports/token.port';
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
    address: 'Gaza',
    city: GazaCities.GAZA,
    is_verified: true,
    role: UserRole.CITIZEN,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as UserEntity);

const makeTokenPair = (): TokenPair => ({
  accessToken: 'access.token.jwt',
  refreshToken: 'refresh.token.jwt',
  expiresAt: new Date(Date.now() + 900_000),
});

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let hashPort: jest.Mocked<IHashPort>;
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

    hashPort = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    tokenPairFactory = {
      createPair: jest.fn(),
    };

    useCase = new LoginUseCase(userRepo, hashPort, tokenPairFactory);
  });

  describe('execute', () => {
    const dto = { email: 'ahmed@example.com', password: 'SecurePass@2024' };

    it('returns tokens and user on valid credentials', async () => {
      const user = makeUser();
      const tokens = makeTokenPair();
      userRepo.findByEmail.mockResolvedValue(user);
      hashPort.compare.mockResolvedValue(true);
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      const result = await useCase.execute(dto);

      expect(result.tokens).toBe(tokens);
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      });
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(hashPort.compare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser());
      hashPort.compare.mockResolvedValue(false);

      await expect(useCase.execute(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(tokenPairFactory.createPair).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when account is disabled', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser({ is_active: false }));
      hashPort.compare.mockResolvedValue(true);

      await expect(useCase.execute(dto)).rejects.toThrow(
        new UnauthorizedException('Account is disabled'),
      );
      expect(tokenPairFactory.createPair).not.toHaveBeenCalled();
    });

    it('calls findByEmail with the provided email', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(dto.email);
    });

    it('calls hashPort.compare with plain password and stored hash', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser());
      hashPort.compare.mockResolvedValue(false);

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);

      expect(hashPort.compare).toHaveBeenCalledWith(dto.password, 'hashed_password');
    });

    it('calls tokenPairFactory.createPair with the user', async () => {
      const user = makeUser();
      const tokens = makeTokenPair();
      userRepo.findByEmail.mockResolvedValue(user);
      hashPort.compare.mockResolvedValue(true);
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      await useCase.execute(dto);

      expect(tokenPairFactory.createPair).toHaveBeenCalledWith(user);
    });
  });
});
