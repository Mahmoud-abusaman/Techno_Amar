import { Injectable } from '@nestjs/common';
import { OtpType } from '@/generated/prisma/enums';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IOtpRepository,
  CreateOtpData,
  RefreshOtpData,
} from '@auth/domain/repositories/otp-repository.interface';
import { OtpCodeEntity } from '@auth/domain/entities/otp-code.entity';

@Injectable()
export class PrismaOtpRepository implements IOtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLatestByUser(
    userId: bigint,
    type: OtpType,
  ): Promise<OtpCodeEntity | null> {
    return this.prisma.otpCode.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OtpCodeEntity | null>;
  }

  findActiveByUser(
    userId: bigint,
    type: OtpType,
  ): Promise<OtpCodeEntity | null> {
    return this.prisma.otpCode.findFirst({
      where: { userId, type, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OtpCodeEntity | null>;
  }

  async create(data: CreateOtpData): Promise<void> {
    await this.prisma.otpCode.create({ data });
  }

  async refresh(id: bigint, data: RefreshOtpData): Promise<void> {
    await this.prisma.otpCode.update({
      where: { id },
      data: { ...data, attempts: 0 },
    });
  }

  async incrementAttempts(id: bigint): Promise<void> {
    await this.prisma.otpCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async consume(id: bigint): Promise<void> {
    await this.prisma.otpCode.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
