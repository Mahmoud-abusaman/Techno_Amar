import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VerifyOtpUseCase } from '../verify-otp.use-case';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IOtpService } from '@auth/domain/ports/otp.port';
import { IPasswordResetTokenPort } from '@auth/domain/ports/password-reset-token.port';
import { UserEntity } from '@users/domain/entities/user.entity';
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

describe('VerifyOtpUseCase', () => {
  let useCase: VerifyOtpUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let otpService: jest.Mocked<IOtpService>;
  let resetTokenPort: jest.Mocked<IPasswordResetTokenPort>;

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

    otpService = {
      issue: jest.fn(),
      verify: jest.fn(),
    };

    resetTokenPort = {
      generate: jest.fn(),
      verify: jest.fn(),
    };

    useCase = new VerifyOtpUseCase(userRepo, otpService, resetTokenPort);
  });

  describe('execute', () => {
    const dto = { identifier: '+970591234567', code: '1234' };

    it('returns a reset token and success message on valid OTP', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpService.verify.mockResolvedValue(undefined);
      resetTokenPort.generate.mockResolvedValue('reset.token.jwt');

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        resetToken: 'reset.token.jwt',
        message:
          'OTP verified successfully. Use the reset token to change your password.',
      });
    });

    it('throws NotFoundException when user is not found by any identifier', async () => {
      userRepo.findByPhone.mockResolvedValue(null);
      userRepo.findByNationalId.mockResolvedValue(null);
      userRepo.findByEmployeeId.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('propagates BadRequestException from otpService when no active code exists', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpService.verify.mockRejectedValue(
        new BadRequestException('No active code found'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow(
        new BadRequestException('No active code found'),
      );
    });

    it('propagates BadRequestException from otpService when code is expired', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpService.verify.mockRejectedValue(
        new BadRequestException('Code expired'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow(
        new BadRequestException('Code expired'),
      );
    });

    it('propagates BadRequestException from otpService when max attempts reached', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpService.verify.mockRejectedValue(
        new BadRequestException('Too many attempts. Request a new code.'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow(
        new BadRequestException('Too many attempts. Request a new code.'),
      );
    });

    it('propagates BadRequestException from otpService when code is invalid', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpService.verify.mockRejectedValue(
        new BadRequestException('Invalid code'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow(
        new BadRequestException('Invalid code'),
      );
    });

    it('calls otpService.verify with correct userId, code, and type', async () => {
      const user = makeUser({ id: 42n });
      userRepo.findByPhone.mockResolvedValue(user);
      otpService.verify.mockResolvedValue(undefined);
      resetTokenPort.generate.mockResolvedValue('reset.token.jwt');

      await useCase.execute(dto);

      expect(otpService.verify).toHaveBeenCalledWith(
        42n,
        '1234',
        OtpType.password_reset,
      );
    });

    it('generates the reset token with the user id as string', async () => {
      const user = makeUser({ id: 42n });
      userRepo.findByPhone.mockResolvedValue(user);
      otpService.verify.mockResolvedValue(undefined);
      resetTokenPort.generate.mockResolvedValue('reset.token.jwt');

      await useCase.execute(dto);

      expect(resetTokenPort.generate).toHaveBeenCalledWith('42');
    });

    it('does not generate a reset token when OTP verification fails', async () => {
      userRepo.findByPhone.mockResolvedValue(makeUser());
      otpService.verify.mockRejectedValue(
        new BadRequestException('Invalid code'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);

      expect(resetTokenPort.generate).not.toHaveBeenCalled();
    });

    it('resolves user by national ID when phone lookup returns null', async () => {
      userRepo.findByPhone.mockResolvedValue(null);
      userRepo.findByNationalId.mockResolvedValue(makeUser());
      otpService.verify.mockResolvedValue(undefined);
      resetTokenPort.generate.mockResolvedValue('reset.token.jwt');

      await useCase.execute({ identifier: '123456789', code: '1234' });

      expect(userRepo.findByNationalId).toHaveBeenCalledWith('123456789');
      expect(userRepo.findByEmployeeId).not.toHaveBeenCalled();
    });

    it('resolves user by employee ID as last resort', async () => {
      userRepo.findByPhone.mockResolvedValue(null);
      userRepo.findByNationalId.mockResolvedValue(null);
      userRepo.findByEmployeeId.mockResolvedValue(makeUser());
      otpService.verify.mockResolvedValue(undefined);
      resetTokenPort.generate.mockResolvedValue('reset.token.jwt');

      await useCase.execute({ identifier: 'EMP-00142', code: '1234' });

      expect(userRepo.findByEmployeeId).toHaveBeenCalledWith('EMP-00142');
    });
  });
});
