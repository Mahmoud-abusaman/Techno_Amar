import { OtpType } from '@/generated/prisma/enums';

export class OtpCodeEntity {
  id: bigint;
  userId: bigint;
  codeHash: string;
  type: OtpType;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}
