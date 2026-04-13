import { BadRequestException, Injectable } from '@nestjs/common';
import { OtpType } from 'generated/prisma/enums';
import { PrismaService } from 'src/db/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  readonly OTP_LENGTH = 4;
  readonly OTP_EXPIRE_MINUTES = 10;
  readonly OTP_MAX_ATTEMPTS = 5;

  constructor(private readonly prisma: PrismaService) {}

  private generateOtp(length: number = this.OTP_LENGTH): string {
    const max = 10 ** length;
    //TODO: use crypto.randomInt is better
    const n = Math.floor(Math.random() * max);
    return n.toString().padStart(length, '0');
  }

  async createOtpRecord(userId: bigint, type: OtpType) {
    const COOLDOWN_SECONDS = 60;

    // 1. Check for recent attempts before doing any heavy hashing
    const recentOtp = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        type,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const secondsSinceLast = Math.floor(
        (Date.now() - recentOtp.createdAt.getTime()) / 1000,
      );

      if (secondsSinceLast < COOLDOWN_SECONDS) {
        throw new BadRequestException(
          `Please wait ${COOLDOWN_SECONDS - secondsSinceLast} seconds before requesting a new code.`,
        );
      }
    }
    // const code = this.generateOtp();
    const code = '0000';
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(
      Date.now() + this.OTP_EXPIRE_MINUTES * 60 * 1000,
    );

    // Use a transaction to ensure data consistency
    await this.prisma.$transaction(async (tx) => {
      // 1. Find the most recent unconsumed OTP of this type
      const activeOtp = await tx.otpCode.findFirst({
        where: { userId, type, consumedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      if (activeOtp) {
        // 2. Refresh existing OTP
        await tx.otpCode.update({
          where: { id: activeOtp.id },
          data: { codeHash, expiresAt, attempts: 0, createdAt: new Date() },
        });
      } else {
        // 3. Create new if none active
        await tx.otpCode.create({
          data: { userId, codeHash, expiresAt, type },
        });
      }
    });

    return code;
  }

  async validateOtp(
    userId: bigint,
    code: string,
    type: OtpType,
  ): Promise<{ valid: boolean; reason?: string }> {
    const record = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        type,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return { valid: false, reason: 'No active code found' };

    if (record.expiresAt.getTime() < Date.now()) {
      return { valid: false, reason: 'Code expired' };
    }

    if (record.attempts >= this.OTP_MAX_ATTEMPTS) {
      return { valid: false, reason: 'Too many attempts. Request a new code.' };
    }

    const isValid = await bcrypt.compare(code, record.codeHash);

    if (!isValid) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return { valid: false, reason: 'Invalid code' };
    }

    // Consume code
    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    return { valid: true };
  }
}
