import { Injectable, Inject } from '@nestjs/common';
import { IPaymentRepository } from '../domain/repositories/payment-repository.interface';
import { PaymentStatus } from '@/generated/prisma/enums';
import { toPublicPayment, PublicPayment } from './payment-response.mapper';

export type GetAllPaymentsFilter = {
  status?: PaymentStatus;
};

@Injectable()
export class GetAllPaymentsUseCase {
  constructor(
    @Inject(IPaymentRepository)
    private readonly paymentRepo: IPaymentRepository,
  ) {}

  async execute(filter?: GetAllPaymentsFilter): Promise<PublicPayment[]> {
    const payments = await this.paymentRepo.findAll(filter);
    return payments.map((p) => toPublicPayment(p));
  }
}
