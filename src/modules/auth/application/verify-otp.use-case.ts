import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { OtpType } from '@/generated/prisma/enums';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IOtpService } from '@auth/domain/ports/otp.port';
import { IPasswordResetTokenPort } from '@auth/domain/ports/password-reset-token.port';

export interface VerifyOtpInput {
  identifier: string;
  code: string;
}

export interface VerifyOtpResult {
  resetToken: string;
  message: string;
}

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IOtpService) private readonly otpService: IOtpService,
    @Inject(IPasswordResetTokenPort)
    private readonly resetTokenPort: IPasswordResetTokenPort,
  ) {}

  async execute(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const user =
      (await this.userRepo.findByPhone(input.identifier)) ??
      (await this.userRepo.findByNationalId(input.identifier)) ??
      (await this.userRepo.findByEmployeeId(input.identifier));

    if (!user) throw new NotFoundException('User not found');

    await this.otpService.verify(user.id, input.code, OtpType.password_reset);

    const resetToken = await this.resetTokenPort.generate(user.id.toString());

    return {
      resetToken,
      message:
        'OTP verified successfully. Use the reset token to change your password.',
    };
  }
}
