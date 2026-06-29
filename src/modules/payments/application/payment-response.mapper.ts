import { PaymentEntity } from '../domain/entities/payment.entity';
import { PaymentStatus } from '@/generated/prisma/enums';

export type PublicPayment = {
  id: string;
  service_request_id: string;
  payer_id: string;
  amount: number;
  serial_number: string;
  provider: string;
  receipt_url: string;
  receipt_file_id: string;
  status: PaymentStatus;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
};

export function toPublicPayment(payment: PaymentEntity): PublicPayment {
  return {
    id: payment.id.toString(),
    service_request_id: payment.service_request_id.toString(),
    payer_id: payment.payer_id.toString(),
    amount: payment.amount,
    serial_number: payment.serial_number,
    provider: payment.provider,
    receipt_url: payment.receipt_url,
    receipt_file_id: payment.receipt_file_id,
    status: payment.status,
    rejection_reason: payment.rejection_reason,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
}
