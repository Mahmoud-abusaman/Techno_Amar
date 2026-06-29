import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { IPaymentRepository } from '../domain/repositories/payment-repository.interface';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import {
  RequestActivityAction,
  RequestPaymentStatus,
} from '@/generated/prisma/enums';
import { toPublicPayment, PublicPayment } from './payment-response.mapper';

export type SubmitPaymentInput = {
  serial_number: string;
  provider: string;
  file_type: string;
  file_url: string;
  file_id: string;
  file_path?: string;
};

@Injectable()
export class SubmitPaymentUseCase {
  constructor(
    @Inject(IPaymentRepository)
    private readonly paymentRepo: IPaymentRepository,
    @Inject(IServiceRequestRepository)
    private readonly requestRepo: IServiceRequestRepository,
    @Inject(IServiceRepository)
    private readonly serviceRepo: IServiceRepository,
    private readonly fileValidator: ImageKitFileValidator,
  ) {}

  async execute(
    citizenId: bigint,
    requestId: bigint,
    input: SubmitPaymentInput,
  ): Promise<PublicPayment> {
    const request = await this.requestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundException(`Service request #${requestId} not found`);
    }

    if (request.citizen_id !== citizenId) {
      throw new ForbiddenException(
        'You do not have permission to submit payment for this request',
      );
    }

    // Check request status and payment status
    if (request.payment_status === RequestPaymentStatus.NOT_REQUIRED) {
      throw new BadRequestException(
        'Payment is not required for this service request',
      );
    }

    if (request.payment_status === RequestPaymentStatus.PAID) {
      throw new BadRequestException(
        'This request has already been paid and verified',
      );
    }

    const service = await this.serviceRepo.findById(request.service_id);
    if (!service) {
      throw new NotFoundException(`Service #${request.service_id} not found`);
    }

    const fee = Number(service.fee);
    if (fee <= 0) {
      throw new BadRequestException('Payment is not required for this service');
    }

    // Validate receipt image
    if (!this.fileValidator.isValidFileUrl(input.file_url)) {
      throw new BadRequestException(
        'Payment receipt file URL must be hosted on the configured ImageKit endpoint',
      );
    }

    if (!this.fileValidator.isAllowedImageMimeType(input.file_type)) {
      throw new BadRequestException(
        'Payment receipt must be an image (JPEG, PNG, WEBP)',
      );
    }

    // Create payment proof
    const payment = await this.paymentRepo.create({
      service_request_id: requestId,
      payer_id: citizenId,
      amount: fee,
      serial_number: input.serial_number,
      provider: input.provider,
      receipt_url: input.file_url,
      receipt_file_id: input.file_id,
    });

    // Update request payment status to pending verification
    await this.requestRepo.updateStatus(requestId, {
      payment_status: RequestPaymentStatus.PENDING_VERIFICATION,
    });

    // Add activity log
    await this.requestRepo.addActivity({
      request_id: requestId,
      actor_id: citizenId,
      action: RequestActivityAction.SUBMITTED,
      description: `Submitted payment proof of amount ${fee} (Serial: ${input.serial_number})`,
    });

    return toPublicPayment(payment);
  }
}
