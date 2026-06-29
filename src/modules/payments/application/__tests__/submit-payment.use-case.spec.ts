/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SubmitPaymentUseCase } from '../submit-payment.use-case';
import { IPaymentRepository } from '../../domain/repositories/payment-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { RequestPaymentStatus, PaymentStatus } from '@/generated/prisma/enums';
import { PaymentEntity } from '../../domain/entities/payment.entity';

const mockPaymentRepository = (): jest.Mocked<IPaymentRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  findLatestByRequest: jest.fn(),
});

const mockRequestRepository = (): jest.Mocked<IServiceRequestRepository> => ({
  createWithTasks: jest.fn(),
  findById: jest.fn(),
  findByIdWithTasks: jest.fn(),
  findByCitizen: jest.fn(),
  updateStatus: jest.fn(),
  countActiveByServiceId: jest.fn(),
  findActivities: jest.fn(),
  addActivity: jest.fn(),
  findDocuments: jest.fn(),
});

const mockServiceRepository = () => {
  return {
    findById: jest.fn(),
    findByIdWithTasks: jest.fn(),
  } as any;
};

const mockFileValidator = () => {
  return {
    isValidFileUrl: jest.fn(),
    isAllowedImageMimeType: jest.fn(),
  } as any;
};

describe('SubmitPaymentUseCase', () => {
  let useCase: SubmitPaymentUseCase;
  let paymentRepo: jest.Mocked<IPaymentRepository>;
  let requestRepo: jest.Mocked<IServiceRequestRepository>;
  let serviceRepo: any;
  let fileValidator: any;

  beforeEach(() => {
    paymentRepo = mockPaymentRepository();
    requestRepo = mockRequestRepository();
    serviceRepo = mockServiceRepository();
    fileValidator = mockFileValidator();
    useCase = new SubmitPaymentUseCase(
      paymentRepo,
      requestRepo,
      serviceRepo,
      fileValidator,
    );
  });

  const input = {
    serial_number: 'TXN123',
    provider: 'PalPay',
    file_type: 'image/png',
    file_url: 'https://ik.imagekit.io/TechnoAmar/receipts/proof.png',
    file_id: 'file_id',
  };

  it('should successfully submit payment proof', async () => {
    const request = {
      id: 1n,
      citizen_id: 10n,
      service_id: 2n,
      payment_status: RequestPaymentStatus.PENDING_VERIFICATION,
      status: 'SUBMITTED' as any,
    };
    const service = {
      id: 2n,
      fee: 50.0,
    };
    const payment = {
      id: 100n,
      service_request_id: 1n,
      payer_id: 10n,
      amount: 50.0,
      serial_number: 'TXN123',
      provider: 'PalPay',
      receipt_url: 'https://ik.imagekit.io/TechnoAmar/receipts/proof.png',
      receipt_file_id: 'file_id',
      status: PaymentStatus.PENDING_VERIFICATION,
      rejection_reason: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    requestRepo.findById.mockResolvedValue(request as any);
    serviceRepo.findById.mockResolvedValue(service as any);
    fileValidator.isValidFileUrl.mockReturnValue(true);
    fileValidator.isAllowedImageMimeType.mockReturnValue(true);
    paymentRepo.create.mockResolvedValue(payment as PaymentEntity);

    const result = await useCase.execute(10n, 1n, input);

    expect(requestRepo.findById).toHaveBeenCalledWith(1n);
    expect(serviceRepo.findById).toHaveBeenCalledWith(2n);
    expect(fileValidator.isValidFileUrl).toHaveBeenCalledWith(input.file_url);
    expect(fileValidator.isAllowedImageMimeType).toHaveBeenCalledWith(
      input.file_type,
    );
    expect(paymentRepo.create).toHaveBeenCalledWith({
      service_request_id: 1n,
      payer_id: 10n,
      amount: 50.0,
      serial_number: 'TXN123',
      provider: 'PalPay',
      receipt_url: 'https://ik.imagekit.io/TechnoAmar/receipts/proof.png',
      receipt_file_id: 'file_id',
    });
    expect(requestRepo.updateStatus).toHaveBeenCalledWith(1n, {
      payment_status: RequestPaymentStatus.PENDING_VERIFICATION,
    });
    expect(requestRepo.addActivity).toHaveBeenCalled();
    expect(result.id).toBe('100');
    expect(result.status).toBe(PaymentStatus.PENDING_VERIFICATION);
  });

  it('should throw NotFoundException if request does not exist', async () => {
    requestRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(10n, 1n, input)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException if request does not belong to user', async () => {
    const request = {
      id: 1n,
      citizen_id: 99n,
    };
    requestRepo.findById.mockResolvedValue(request as any);

    await expect(useCase.execute(10n, 1n, input)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw BadRequestException if request payment is not required', async () => {
    const request = {
      id: 1n,
      citizen_id: 10n,
      payment_status: RequestPaymentStatus.NOT_REQUIRED,
    };
    requestRepo.findById.mockResolvedValue(request as any);

    await expect(useCase.execute(10n, 1n, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if request payment is already paid', async () => {
    const request = {
      id: 1n,
      citizen_id: 10n,
      payment_status: RequestPaymentStatus.PAID,
    };
    requestRepo.findById.mockResolvedValue(request as any);

    await expect(useCase.execute(10n, 1n, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if service fee is 0', async () => {
    const request = {
      id: 1n,
      citizen_id: 10n,
      service_id: 2n,
      payment_status: RequestPaymentStatus.PENDING_VERIFICATION,
    };
    const service = {
      id: 2n,
      fee: 0,
    };
    requestRepo.findById.mockResolvedValue(request as any);
    serviceRepo.findById.mockResolvedValue(service as any);

    await expect(useCase.execute(10n, 1n, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if receipt file URL is invalid', async () => {
    const request = {
      id: 1n,
      citizen_id: 10n,
      service_id: 2n,
      payment_status: RequestPaymentStatus.PENDING_VERIFICATION,
    };
    const service = {
      id: 2n,
      fee: 50.0,
    };
    requestRepo.findById.mockResolvedValue(request as any);
    serviceRepo.findById.mockResolvedValue(service as any);
    fileValidator.isValidFileUrl.mockReturnValue(false);

    await expect(useCase.execute(10n, 1n, input)).rejects.toThrow(
      new BadRequestException(
        'Payment receipt file URL must be hosted on the configured ImageKit endpoint',
      ),
    );
  });

  it('should throw BadRequestException if receipt file type is not an image', async () => {
    const request = {
      id: 1n,
      citizen_id: 10n,
      service_id: 2n,
      payment_status: RequestPaymentStatus.PENDING_VERIFICATION,
    };
    const service = {
      id: 2n,
      fee: 50.0,
    };
    requestRepo.findById.mockResolvedValue(request as any);
    serviceRepo.findById.mockResolvedValue(service as any);
    fileValidator.isValidFileUrl.mockReturnValue(true);
    fileValidator.isAllowedImageMimeType.mockReturnValue(false);

    await expect(useCase.execute(10n, 1n, input)).rejects.toThrow(
      new BadRequestException(
        'Payment receipt must be an image (JPEG, PNG, WEBP)',
      ),
    );
  });
});
