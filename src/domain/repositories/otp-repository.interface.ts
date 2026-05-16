import { OtpType } from '@/generated/prisma/enums';
import { OtpCodeEntity } from '../entities/otp-code.entity';

export const IOtpRepository = Symbol('IOtpRepository');

export type CreateOtpData = {
  userId: bigint;
  codeHash: string;
  type: OtpType;
  expiresAt: Date;
};

export type RefreshOtpData = {
  codeHash: string;
  expiresAt: Date;
};

export interface IOtpRepository {
  findLatestByUser(
    userId: bigint,
    type: OtpType,
  ): Promise<OtpCodeEntity | null>;
  findActiveByUser(
    userId: bigint,
    type: OtpType,
  ): Promise<OtpCodeEntity | null>;
  create(data: CreateOtpData): Promise<void>;
  refresh(id: bigint, data: RefreshOtpData): Promise<void>;
  incrementAttempts(id: bigint): Promise<void>;
  consume(id: bigint): Promise<void>;
}
