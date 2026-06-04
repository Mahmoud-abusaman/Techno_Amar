import { ConflictException } from '@nestjs/common';
import { SignupUseCase } from '../signup.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IHashPort } from '@domain/ports/hash.port';
import { ITokenPairFactory } from '@domain/ports/token.port';
import { UserEntity } from '@domain/entities/user.entity';
import { TokenPair } from '@domain/ports/token.port';
import { UserRole, GazaCities } from '@/generated/prisma/enums';
import { SignupDto } from '@infrastructure/http/auth/dto/signup.dto';

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
    is_verified: false,
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

const makeSignupDto = (overrides: Partial<SignupDto> = {}): SignupDto =>
  ({
    full_name: 'Ahmed Al-Masri',
    email: 'ahmed@example.com',
    password: 'SecurePass@2024',
    national_id: '123456789',
    phone: '+970591234567',
    address: 'Gaza City',
    city: GazaCities.GAZA,
    ...overrides,
  } as SignupDto);

describe('SignupUseCase', () => {
  let useCase: SignupUseCase;
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

    useCase = new SignupUseCase(userRepo, hashPort, tokenPairFactory);
  });

  describe('execute', () => {
    it('creates a user and returns tokens on valid input', async () => {
      const dto = makeSignupDto();
      const user = makeUser();
      const tokens = makeTokenPair();

      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(user);
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

    it('always creates the user with CITIZEN role regardless of input', async () => {
      const dto = makeSignupDto();
      const user = makeUser();
      const tokens = makeTokenPair();

      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(user);
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      await useCase.execute(dto);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CITIZEN }),
      );
    });

    it('does not pass the plain-text password to the repository', async () => {
      const dto = makeSignupDto();
      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(makeUser());
      tokenPairFactory.createPair.mockResolvedValue(makeTokenPair());

      await useCase.execute(dto);

      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg).not.toHaveProperty('password');
      expect(createArg).toHaveProperty('password_hash', 'hashed_password');
    });

    it('hashes the password before creating the user', async () => {
      const dto = makeSignupDto({ password: 'SecurePass@2024' });
      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(makeUser());
      tokenPairFactory.createPair.mockResolvedValue(makeTokenPair());

      await useCase.execute(dto);

      expect(hashPort.hash).toHaveBeenCalledWith('SecurePass@2024');
    });

    it('throws ConflictException on Prisma P2002 (duplicate national_id)', async () => {
      const dto = makeSignupDto();
      hashPort.hash.mockResolvedValue('hashed_password');
      const prismaError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
        meta: { modelName: 'User', target: ['national_id'] },
      });
      userRepo.create.mockRejectedValue(prismaError);

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ConflictException('A user with this national_id already exists'),
      );
    });

    it('throws ConflictException on Prisma P2002 (duplicate email)', async () => {
      const dto = makeSignupDto();
      hashPort.hash.mockResolvedValue('hashed_password');
      const prismaError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
        meta: { modelName: 'User', target: ['email'] },
      });
      userRepo.create.mockRejectedValue(prismaError);

      await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    });

    it('re-throws unknown errors from the repository', async () => {
      const dto = makeSignupDto();
      hashPort.hash.mockResolvedValue('hashed_password');
      const dbError = new Error('Database connection lost');
      userRepo.create.mockRejectedValue(dbError);

      await expect(useCase.execute(dto)).rejects.toThrow('Database connection lost');
    });

    it('calls tokenPairFactory with the created user', async () => {
      const dto = makeSignupDto();
      const user = makeUser();
      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(user);
      tokenPairFactory.createPair.mockResolvedValue(makeTokenPair());

      await useCase.execute(dto);

      expect(tokenPairFactory.createPair).toHaveBeenCalledWith(user);
    });
  });
});
