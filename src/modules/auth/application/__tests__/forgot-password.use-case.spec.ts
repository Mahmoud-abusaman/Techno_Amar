import { BadRequestException } from '@nestjs/common';
import { ForgotPasswordUseCase } from '../forgot-password.use-case';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IOtpRepository } from '@auth/domain/repositories/otp-repository.interface';
import { IOtpService } from '@auth/domain/ports/otp.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { OtpCodeEntity } from '@auth/domain/entities/otp-code.entity';
import { UserRole, GazaCities, OtpType } from '@/generated/prisma/enums';

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
  }) as UserEntity;

const makeOtp = (overrides: Partial<OtpCodeEntity> = {}): OtpCodeEntity =>
  ({
    id: 10n,
    userId: 1n,
    codeHash: 'hashed_code',
    type: OtpType.password_reset,
    attempts: 0,
    expiresAt: new Date(Date.now() + 600_000),
    consumedAt: null,
    createdAt: new Date(),
    ...overrides,
  }) as OtpCodeEntity;

const SAFE_MESSAGE =
  'If an account exists with this identifier, an OTP has been sent';
const OTP_COOLDOWN_SECONDS = 60;

const flushAsync = () => new Promise<void>((r) => setImmediate(r));

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let otpRepo: jest.Mocked<IOtpRepository>;
  let otpService: jest.Mocked<IOtpService>;

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

    otpRepo = {
      findLatestByUser: jest.fn(),
      findActiveByUser: jest.fn(),
      create: jest.fn(),
      refresh: jest.fn(),
      incrementAttempts: jest.fn(),
      consume: jest.fn(),
    };

    otpService = {
      issue: jest.fn(),
      verify: jest.fn(),
    };

    useCase = new ForgotPasswordUseCase(userRepo, otpRepo, otpService);
  });

  describe('execute', () => {
    const dto = { identifier: '+970591234567' };

    it('returns the safe message when user is not found', async () => {
      userRepo.findByPhone.mockResolvedValue(null);
      userRepo.findByNationalId.mockResolvedValue(null);
      userRepo.findByEmployeeId.mockResolvedValue(null);

      const result = await useCase.execute(dto);

      expect(result).toEqual({ message: SAFE_MESSAGE });
      expect(otpRepo.findLatestByUser).not.toHaveBeenCalled();
    });

    it('returns the safe message when user is found and no previous OTP exists', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpRepo.findLatestByUser.mockResolvedValue(null);
      otpService.issue.mockResolvedValue('1234');

      const result = await useCase.execute(dto);
      await flushAsync();

      expect(result).toEqual({ message: SAFE_MESSAGE });
    });

    it('throws BadRequestException when the OTP cooldown is still active', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      const recentOtp = makeOtp({ createdAt: new Date(Date.now() - 10_000) });
      otpRepo.findLatestByUser.mockResolvedValue(recentOtp);

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        /Please wait \d+ seconds/,
      );
    });

    it('allows a new OTP request after the cooldown period has elapsed', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      const oldOtp = makeOtp({ createdAt: new Date(Date.now() - 90_000) });
      otpRepo.findLatestByUser.mockResolvedValue(oldOtp);
      otpService.issue.mockResolvedValue('1234');

      const result = await useCase.execute(dto);
      await flushAsync();

      expect(result).toEqual({ message: SAFE_MESSAGE });
    });

    it('looks up the user by phone, then national ID, then employee ID in order', async () => {
      userRepo.findByPhone.mockResolvedValue(null);
      userRepo.findByNationalId.mockResolvedValue(null);
      userRepo.findByEmployeeId.mockResolvedValue(null);

      await useCase.execute({ identifier: 'EMP-00142' });

      expect(userRepo.findByPhone).toHaveBeenCalledWith('EMP-00142');
      expect(userRepo.findByNationalId).toHaveBeenCalledWith('EMP-00142');
      expect(userRepo.findByEmployeeId).toHaveBeenCalledWith('EMP-00142');
    });

    it('stops lookup chain as soon as a user is found by phone', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpRepo.findLatestByUser.mockResolvedValue(null);
      otpService.issue.mockResolvedValue('1234');

      await useCase.execute(dto);
      await flushAsync();

      expect(userRepo.findByNationalId).not.toHaveBeenCalled();
      expect(userRepo.findByEmployeeId).not.toHaveBeenCalled();
    });

    it('calls otpService.issue with correct userId and OTP type', async () => {
      const user = makeUser({ id: 42n });
      userRepo.findByPhone.mockResolvedValue(user);
      otpRepo.findLatestByUser.mockResolvedValue(null);
      otpService.issue.mockResolvedValue('1234');

      await useCase.execute(dto);
      await flushAsync();

      expect(otpService.issue).toHaveBeenCalledWith(
        42n,
        OtpType.password_reset,
      );
    });

    it('includes the remaining cooldown seconds in the error message', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      const secondsAgo = 30;
      const recentOtp = makeOtp({
        createdAt: new Date(Date.now() - secondsAgo * 1000),
      });
      otpRepo.findLatestByUser.mockResolvedValue(recentOtp);

      const expectedRemaining = OTP_COOLDOWN_SECONDS - secondsAgo;

      await expect(useCase.execute(dto)).rejects.toThrow(
        new BadRequestException(
          `Please wait ${expectedRemaining} seconds before requesting a new code.`,
        ),
      );
    });

    it('returns the safe message immediately without waiting for OTP generation', async () => {
      jest.useFakeTimers();
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpRepo.findLatestByUser.mockResolvedValue(null);

      let resolved = false;
      otpService.issue.mockImplementation(
        () =>
          new Promise((r) =>
            setTimeout(() => {
              resolved = true;
              r('1234');
            }, 500),
          ),
      );

      const result = await useCase.execute(dto);

      expect(result).toEqual({ message: SAFE_MESSAGE });
      expect(resolved).toBe(false);

      jest.runAllTimers();
      jest.useRealTimers();
    });
  });
});
