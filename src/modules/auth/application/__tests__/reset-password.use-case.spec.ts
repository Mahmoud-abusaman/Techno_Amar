import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ResetPasswordUseCase } from '../reset-password.use-case';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { IPasswordResetTokenPort } from '@auth/domain/ports/password-reset-token.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { UserRole, GazaCities } from '@/generated/prisma/enums';

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
  ({
    id: 1n,
    full_name: 'Ahmed Al-Masri',
    email: 'ahmed@example.com',
    password_hash: 'old_hashed_password',
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

const VALID_RESET_TOKEN = 'valid.reset.token.jwt';
const RESET_PAYLOAD = { sub: '1', type: 'password_reset' as const };

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let hashPort: jest.Mocked<IHashPort>;
  let resetTokenPort: jest.Mocked<IPasswordResetTokenPort>;

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

    resetTokenPort = {
      generate: jest.fn(),
      verify: jest.fn(),
    };

    useCase = new ResetPasswordUseCase(userRepo, hashPort, resetTokenPort);
  });

  describe('execute', () => {
    const dto = {
      reset_token: VALID_RESET_TOKEN,
      new_password: 'NewPass@2024',
    };

    it('resets the password and returns a success message', async () => {
      resetTokenPort.verify.mockResolvedValue(RESET_PAYLOAD);
      userRepo.findById.mockResolvedValue(makeUser());
      hashPort.hash.mockResolvedValue('new_hashed_password');
      userRepo.update.mockResolvedValue(
        makeUser({ password_hash: 'new_hashed_password' }),
      );

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        message: 'Password has been reset successfully',
      });
    });

    it('throws UnauthorizedException when the reset token is invalid', async () => {
      resetTokenPort.verify.mockRejectedValue(new Error('jwt malformed'));

      await expect(useCase.execute(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired reset token'),
      );
      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the reset token is expired', async () => {
      resetTokenPort.verify.mockRejectedValue(new Error('jwt expired'));

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      resetTokenPort.verify.mockResolvedValue(RESET_PAYLOAD);
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(hashPort.hash).not.toHaveBeenCalled();
    });

    it('hashes the new password before updating the user', async () => {
      resetTokenPort.verify.mockResolvedValue(RESET_PAYLOAD);
      userRepo.findById.mockResolvedValue(makeUser());
      hashPort.hash.mockResolvedValue('new_hashed_password');
      userRepo.update.mockResolvedValue(makeUser());

      await useCase.execute(dto);

      expect(hashPort.hash).toHaveBeenCalledWith('NewPass@2024');
    });

    it('calls userRepo.update with the new password hash', async () => {
      resetTokenPort.verify.mockResolvedValue(RESET_PAYLOAD);
      userRepo.findById.mockResolvedValue(makeUser({ id: 1n }));
      hashPort.hash.mockResolvedValue('new_hashed_password');
      userRepo.update.mockResolvedValue(makeUser());

      await useCase.execute(dto);

      expect(userRepo.update).toHaveBeenCalledWith(1n, {
        password_hash: 'new_hashed_password',
      });
    });

    it('looks up the user by bigint id parsed from the token subject', async () => {
      resetTokenPort.verify.mockResolvedValue({
        sub: '99',
        type: 'password_reset',
      });
      userRepo.findById.mockResolvedValue(makeUser({ id: 99n }));
      hashPort.hash.mockResolvedValue('new_hashed_password');
      userRepo.update.mockResolvedValue(makeUser());

      await useCase.execute(dto);

      expect(userRepo.findById).toHaveBeenCalledWith(99n);
    });

    it('does not update the user when token verification fails', async () => {
      resetTokenPort.verify.mockRejectedValue(new Error('invalid signature'));

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);

      expect(userRepo.update).not.toHaveBeenCalled();
    });
  });
});
