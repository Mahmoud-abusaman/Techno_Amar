import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { type ConfigType } from '@nestjs/config';
import { OtpType } from '@/generated/prisma/enums';
import { IOtpService } from '@auth/domain/ports/otp.port';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { IOtpRepository } from '@auth/domain/repositories/otp-repository.interface';
import appConfiguration from '@shared/config/app.configuration';

const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class OtpAdapter implements IOtpService {
  constructor(
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(IOtpRepository) private readonly otpRepo: IOtpRepository,
    @Inject(appConfiguration.KEY)
    private readonly config: ConfigType<typeof appConfiguration>,
  ) {}

  async issue(userId: bigint, type: OtpType): Promise<string> {
    const { length, expireMinutes } = this.config.otp;
    // const code = randomInt(10 ** length).toString().padStart(length, '0');
    // for dev purposes, we can use a fixed code
    const code = '1234'.slice(0, length);
    const codeHash = await this.hashPort.hash(code);
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    const active = await this.otpRepo.findActiveByUser(userId, type);
    if (active) {
      await this.otpRepo.refresh(active.id, { codeHash, expiresAt });
    } else {
      await this.otpRepo.create({ userId, codeHash, type, expiresAt });
    }

    return code;
  }

  async verify(userId: bigint, code: string, type: OtpType): Promise<void> {
    const record = await this.otpRepo.findActiveByUser(userId, type);

    if (!record) throw new BadRequestException('No active code found');
    if (record.expiresAt.getTime() < Date.now())
      throw new BadRequestException('Code expired');
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    const isValid = await this.hashPort.compare(code, record.codeHash);
    if (!isValid) {
      await this.otpRepo.incrementAttempts(record.id);
      throw new BadRequestException('Invalid code');
    }

    await this.otpRepo.consume(record.id);
  }
}
