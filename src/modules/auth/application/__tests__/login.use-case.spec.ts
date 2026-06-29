import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../login.use-case';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { ITokenPairFactory } from '@auth/domain/ports/token.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { TokenPair } from '@auth/domain/ports/token.port';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

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
    account_status: AccountStatus.ACTIVE,
    section_id: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as UserEntity;

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
  let sectionRepo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    userRepo = {
      create: jest.fn(),
      createCitizenProfile: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIdWithProfile: jest.fn(),
      updateCitizenProfile: jest.fn(),
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

    sectionRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByNameInDepartment: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new LoginUseCase(
      userRepo,
      hashPort,
      tokenPairFactory,
      sectionRepo,
    );
  });

  describe('execute', () => {
    const citizenDto = { identifier: '123456789', password: 'SecurePass@2024' };
    const employeeDto = { identifier: 'EMP-001', password: 'SecurePass@2024' };

    it('returns tokens and user when citizen logs in with national_id', async () => {
      const user = makeUser();
      const tokens = makeTokenPair();
      userRepo.findByNationalId.mockResolvedValue(user);
      hashPort.compare.mockResolvedValue(true);
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      const result = await useCase.execute(citizenDto);

      expect(result.tokens).toBe(tokens);
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department_id: null,
      });
    });

    it('returns tokens and user when employee logs in with employee_id', async () => {
      const user = makeUser({
        employee_id: 'EMP-001',
        national_id: null,
        role: UserRole.EMPLOYEE,
      });
      const tokens = makeTokenPair();
      userRepo.findByNationalId.mockResolvedValue(null);
      userRepo.findByEmployeeId.mockResolvedValue(user);
      hashPort.compare.mockResolvedValue(true);
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      const result = await useCase.execute(employeeDto);

      expect(userRepo.findByNationalId).toHaveBeenCalledWith(
        employeeDto.identifier,
      );
      expect(userRepo.findByEmployeeId).toHaveBeenCalledWith(
        employeeDto.identifier,
      );
      expect(result.tokens).toBe(tokens);
    });

    it('throws UnauthorizedException when identifier matches no user', async () => {
      userRepo.findByNationalId.mockResolvedValue(null);
      userRepo.findByEmployeeId.mockResolvedValue(null);

      await expect(useCase.execute(citizenDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(hashPort.compare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      userRepo.findByNationalId.mockResolvedValue(makeUser());
      hashPort.compare.mockResolvedValue(false);

      await expect(useCase.execute(citizenDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(tokenPairFactory.createPair).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when account is disabled', async () => {
      userRepo.findByNationalId.mockResolvedValue(
        makeUser({ is_active: false }),
      );
      hashPort.compare.mockResolvedValue(true);

      await expect(useCase.execute(citizenDto)).rejects.toThrow(
        new UnauthorizedException('Account is disabled'),
      );
      expect(tokenPairFactory.createPair).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when account is pending verification', async () => {
      userRepo.findByNationalId.mockResolvedValue(
        makeUser({ account_status: AccountStatus.PENDING_VERIFICATION }),
      );
      hashPort.compare.mockResolvedValue(true);

      await expect(useCase.execute(citizenDto)).rejects.toThrow(
        new UnauthorizedException('Account is pending admin verification'),
      );
    });

    it('throws UnauthorizedException when account is rejected', async () => {
      userRepo.findByNationalId.mockResolvedValue(
        makeUser({ account_status: AccountStatus.REJECTED, is_active: false }),
      );
      hashPort.compare.mockResolvedValue(true);

      await expect(useCase.execute(citizenDto)).rejects.toThrow(
        new UnauthorizedException('Account registration was rejected'),
      );
    });

    it('throws UnauthorizedException when citizen is not verified', async () => {
      userRepo.findByNationalId.mockResolvedValue(
        makeUser({ is_verified: false }),
      );
      hashPort.compare.mockResolvedValue(true);

      await expect(useCase.execute(citizenDto)).rejects.toThrow(
        new UnauthorizedException('Account is not verified'),
      );
    });

    it('calls tokenPairFactory.createPair with the user', async () => {
      const user = makeUser();
      const tokens = makeTokenPair();
      userRepo.findByNationalId.mockResolvedValue(user);
      hashPort.compare.mockResolvedValue(true);
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      await useCase.execute(citizenDto);

      expect(tokenPairFactory.createPair).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        role: user.role,
        department_id: null,
      });
    });

    it('derives department_id from section for employees', async () => {
      const user = makeUser({
        employee_id: 'EMP-001',
        national_id: null,
        role: UserRole.EMPLOYEE,
        section_id: 5n,
      });
      const tokens = makeTokenPair();
      userRepo.findByEmployeeId.mockResolvedValue(user);
      hashPort.compare.mockResolvedValue(true);
      sectionRepo.findById.mockResolvedValue({
        id: 5n,
        department_id: 10n,
        name: 'Ops',
        description: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      tokenPairFactory.createPair.mockResolvedValue(tokens);

      await useCase.execute(employeeDto);

      expect(tokenPairFactory.createPair).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        role: user.role,
        department_id: 10n,
      });
    });

    it('calls hashPort.compare with plain password and stored hash', async () => {
      userRepo.findByNationalId.mockResolvedValue(makeUser());
      hashPort.compare.mockResolvedValue(false);

      await expect(useCase.execute(citizenDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(hashPort.compare).toHaveBeenCalledWith(
        citizenDto.password,
        'hashed_password',
      );
    });
  });
});
