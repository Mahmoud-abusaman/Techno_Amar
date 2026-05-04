import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { OtpType } from 'generated/prisma/enums';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IOtpRepository } from 'src/domain/repositories/otp-repository.interface';
import { IHashPort } from 'src/domain/ports/hash.port';
import { SideEffectQueue } from 'src/infrastructure/http/common/utils/side-effects';
import { ForgotPasswordRequestDto } from 'src/infrastructure/http/auth/dto/forgot-password.dto';

const OTP_LENGTH = 4;
const OTP_EXPIRE_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;
const SAFE_MESSAGE = 'If an account exists with this identifier, an OTP has been sent';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IOtpRepository) private readonly otpRepo: IOtpRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
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
      const code = randomInt(10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
      const codeHash = await this.hashPort.hash(code);
      const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

      const active = await this.otpRepo.findActiveByUser(user.id, OtpType.password_reset);
      if (active) {
        await this.otpRepo.refresh(active.id, { codeHash, expiresAt });
      } else {
        await this.otpRepo.create({ userId: user.id, codeHash, type: OtpType.password_reset, expiresAt });
      }

      // TODO: replace with injected SMS/notification service
      console.log(`[OTP] code for user ${user.id}: ${code}`);
    });

    queue.runAll().catch(console.error);

    return { message: SAFE_MESSAGE };
  }
}
