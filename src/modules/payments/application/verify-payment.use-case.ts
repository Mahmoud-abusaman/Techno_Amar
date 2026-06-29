import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IPaymentRepository } from '../domain/repositories/payment-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import {
  PaymentStatus,
  RequestActivityAction,
  RequestPaymentStatus,
} from '@/generated/prisma/enums';
import { PaymentEntity } from '../domain/entities/payment.entity';
import { toPublicPayment, PublicPayment } from './payment-response.mapper';

export type VerifyPaymentInput = {
  approve: boolean;
  rejection_reason?: string;
};

@Injectable()
export class VerifyPaymentUseCase {
  constructor(
    @Inject(IPaymentRepository)
    private readonly paymentRepo: IPaymentRepository,
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
  ) {}

  async execute(
    paymentId: bigint,
    adminId: bigint,
    input: VerifyPaymentInput,
  ): Promise<PublicPayment> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment #${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Payment has already been processed');
    }

    const request = await this.requestRepo.findById(payment.service_request_id);
    if (!request) {
      throw new NotFoundException(
        `Service request #${payment.service_request_id} not found`,
      );
    }

    let updatedPayment: PaymentEntity;

    if (input.approve) {
      // Approve payment
      updatedPayment = await this.paymentRepo.update(paymentId, {
        status: PaymentStatus.APPROVED,
        rejection_reason: null,
      });

      // Update service request payment status
      await this.requestRepo.updateStatus(payment.service_request_id, {
        payment_status: RequestPaymentStatus.PAID,
      });

      // Add activity log
      await this.requestRepo.addActivity({
        request_id: payment.service_request_id,
        actor_id: adminId,
        action: RequestActivityAction.SUBMITTED,
        description: `Payment approved and verified by Admin`,
      });
    } else {
      // Reject payment
      if (!input.rejection_reason || !input.rejection_reason.trim()) {
        throw new BadRequestException(
          'Rejection reason is required for rejecting payments',
        );
      }

      updatedPayment = await this.paymentRepo.update(paymentId, {
        status: PaymentStatus.REJECTED,
        rejection_reason: input.rejection_reason,
      });

      // Update service request payment status
      await this.requestRepo.updateStatus(payment.service_request_id, {
        payment_status: RequestPaymentStatus.FAILED,
      });

      // Add activity log
      await this.requestRepo.addActivity({
        request_id: payment.service_request_id,
        actor_id: adminId,
        action: RequestActivityAction.SUBMITTED,
        description: `Payment verification rejected by Admin. Reason: ${input.rejection_reason}`,
      });
    }

    return toPublicPayment(updatedPayment);
  }
}
