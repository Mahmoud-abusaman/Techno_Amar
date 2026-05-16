import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { OtpType } from '@/generated/prisma/enums';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IOtpService } from '@domain/ports/otp.port';
import { IPasswordResetTokenPort } from '@domain/ports/password-reset-token.port';
import { VerifyOtpDto } from '@infrastructure/http/auth/dto/forgot-password.dto';

export interface VerifyOtpResult {
  resetToken: string;
  message: string;
}

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IOtpService) private readonly otpService: IOtpService,
    @Inject(IPasswordResetTokenPort) private readonly resetTokenPort: IPasswordResetTokenPort,
  ) {}

  async execute(dto: VerifyOtpDto): Promise<VerifyOtpResult> {
    const user =
      (await this.userRepo.findByPhone(dto.identifier)) ??
      (await this.userRepo.findByNationalId(dto.identifier)) ??
      (await this.userRepo.findByEmployeeId(dto.identifier));

    if (!user) throw new NotFoundException('User not found');

    await this.otpService.verify(user.id, dto.code, OtpType.password_reset);

    const resetToken = await this.resetTokenPort.generate(user.id.toString());

    return {
      resetToken,
      message: 'OTP verified successfully. Use the reset token to change your password.',
    };
  }
}
