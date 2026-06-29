import { PaymentStatus } from '@/generated/prisma/enums';

export class PaymentEntity {
  id: bigint;
  service_request_id: bigint;
  payer_id: bigint;
  amount: number;
  serial_number: string;
  provider: string;
  receipt_url: string;
  receipt_file_id: string;
  status: PaymentStatus;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}
