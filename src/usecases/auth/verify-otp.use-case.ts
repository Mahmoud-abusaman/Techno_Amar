import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { OtpType } from 'generated/prisma/enums';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IOtpRepository } from 'src/domain/repositories/otp-repository.interface';
import { IHashPort } from 'src/domain/ports/hash.port';
import { IPasswordResetTokenPort } from 'src/domain/ports/password-reset-token.port';
import { VerifyOtpDto } from 'src/infrastructure/http/auth/dto/forgot-password.dto';

const OTP_MAX_ATTEMPTS = 5;

export interface VerifyOtpResult {
  resetToken: string;
  message: string;
}

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IOtpRepository) private readonly otpRepo: IOtpRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(IPasswordResetTokenPort) private readonly resetTokenPort: IPasswordResetTokenPort,
  ) {}

  async execute(dto: VerifyOtpDto): Promise<VerifyOtpResult> {
    const user =
      (await this.userRepo.findByPhone(dto.identifier)) ??
      (await this.userRepo.findByNationalId(dto.identifier)) ??
      (await this.userRepo.findByEmployeeId(dto.identifier));

    if (!user) throw new NotFoundException('User not found');

    const record = await this.otpRepo.findActiveByUser(user.id, OtpType.password_reset);

    if (!record) throw new BadRequestException('No active code found');
    if (record.expiresAt.getTime() < Date.now()) throw new BadRequestException('Code expired');
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    const isValid = await this.hashPort.compare(dto.code, record.codeHash);

    if (!isValid) {
      await this.otpRepo.incrementAttempts(record.id);
      throw new BadRequestException('Invalid code');
    }

    await this.otpRepo.consume(record.id);

    const resetToken = await this.resetTokenPort.generate(user.id.toString());

    return {
      resetToken,
      message: 'OTP verified successfully. Use the reset token to change your password.',
    };
  }
}
