import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { OtpType } from '@/generated/prisma/enums';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IOtpRepository } from '@domain/repositories/otp-repository.interface';
import { IOtpService } from '@domain/ports/otp.port';
import { SideEffectQueue } from '@infrastructure/http/common/utils/side-effects';
import { ForgotPasswordRequestDto } from '@infrastructure/http/auth/dto/forgot-password.dto';

const OTP_COOLDOWN_SECONDS = 60;
const SAFE_MESSAGE = 'If an account exists with this identifier, an OTP has been sent';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IOtpRepository) private readonly otpRepo: IOtpRepository,
    @Inject(IOtpService) private readonly otpService: IOtpService,
  ) {}

  async execute(dto: ForgotPasswordRequestDto): Promise<{ message: string }> {
    const user =
      (await this.userRepo.findByPhone(dto.identifier)) ??
      (await this.userRepo.findByNationalId(dto.identifier)) ??
      (await this.userRepo.findByEmployeeId(dto.identifier));

    if (!user) return { message: SAFE_MESSAGE };

    // Cooldown check must block the response so the client gets the correct error.
    const latest = await this.otpRepo.findLatestByUser(user.id, OtpType.password_reset);
    if (latest) {
      const secondsSinceLast = Math.floor((Date.now() - latest.createdAt.getTime()) / 1000);
      if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
        throw new BadRequestException(
          `Please wait ${OTP_COOLDOWN_SECONDS - secondsSinceLast} seconds before requesting a new code.`,
        );
      }
    }

    const queue = new SideEffectQueue();

    queue.add('Send OTP', async () => {
      const code = await this.otpService.issue(user.id, OtpType.password_reset);
      // TODO: replace with injected SMS/notification service
      console.log(`[OTP] code for user ${user.id}: ${code}`);
    });

    queue.runAll().catch(console.error);

    return { message: SAFE_MESSAGE };
  }
}
