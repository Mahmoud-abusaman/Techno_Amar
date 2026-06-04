import { OtpType } from '@/generated/prisma/enums';

export const IOtpService = Symbol('IOtpService');

export interface IOtpService {
  issue(userId: bigint, type: OtpType): Promise<string>;
  verify(userId: bigint, code: string, type: OtpType): Promise<void>;
}
