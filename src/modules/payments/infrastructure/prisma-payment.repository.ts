import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { PaymentStatus } from '@/generated/prisma/enums';
import {
  IPaymentRepository,
  CreatePaymentData,
  UpdatePaymentData,
} from '../domain/repositories/payment-repository.interface';
import { PaymentEntity } from '../domain/entities/payment.entity';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentData): Promise<PaymentEntity> {
    const row = await this.prisma.payment.create({
      data: {
        service_request_id: data.service_request_id,
        payer_id: data.payer_id,
        amount: data.amount,
        serial_number: data.serial_number,
        provider: data.provider,
        receipt_url: data.receipt_url,
        receipt_file_id: data.receipt_file_id,
        status: 'PENDING_VERIFICATION',
      },
    });
    return this.toEntity(row);
  }

  async findById(id: bigint): Promise<PaymentEntity | null> {
    const row = await this.prisma.payment.findUnique({
      where: { id },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(filter?: { status?: PaymentStatus }): Promise<PaymentEntity[]> {
    const rows = await this.prisma.payment.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { created_at: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async update(id: bigint, data: UpdatePaymentData): Promise<PaymentEntity> {
    const row = await this.prisma.payment.update({
      where: { id },
      data,
    });
    return this.toEntity(row);
  }

  async findLatestByRequest(requestId: bigint): Promise<PaymentEntity | null> {
    const row = await this.prisma.payment.findFirst({
      where: { service_request_id: requestId },
      orderBy: { created_at: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: {
    id: bigint;
    service_request_id: bigint;
    payer_id: bigint;
    amount: any;
    serial_number: string;
    provider: string;
    receipt_url: string;
    receipt_file_id: string;
    status: PaymentStatus;
    rejection_reason: string | null;
    created_at: Date;
    updated_at: Date;
  }): PaymentEntity {
    return {
      id: row.id,
      service_request_id: row.service_request_id,
      payer_id: row.payer_id,
      amount: Number(row.amount),
      serial_number: row.serial_number,
      provider: row.provider,
      receipt_url: row.receipt_url,
      receipt_file_id: row.receipt_file_id,
      status: row.status,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
