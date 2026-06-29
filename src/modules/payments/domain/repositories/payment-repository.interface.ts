import { PaymentEntity } from '../entities/payment.entity';
import { PaymentStatus } from '@/generated/prisma/enums';

export const IPaymentRepository = Symbol('IPaymentRepository');

export type CreatePaymentData = {
  service_request_id: bigint;
  payer_id: bigint;
  amount: number;
  serial_number: string;
  provider: string;
  receipt_url: string;
  receipt_file_id: string;
};

export type UpdatePaymentData = {
  status?: PaymentStatus;
  rejection_reason?: string | null;
};

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<PaymentEntity>;
  findById(id: bigint): Promise<PaymentEntity | null>;
  findAll(filter?: { status?: PaymentStatus }): Promise<PaymentEntity[]>;
  update(id: bigint, data: UpdatePaymentData): Promise<PaymentEntity>;
  findLatestByRequest(requestId: bigint): Promise<PaymentEntity | null>;
}
