/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VerifyPaymentUseCase } from '../verify-payment.use-case';
import { IPaymentRepository } from '../../domain/repositories/payment-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { PaymentStatus, RequestPaymentStatus } from '@/generated/prisma/enums';
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

describe('VerifyPaymentUseCase', () => {
  let useCase: VerifyPaymentUseCase;
  let paymentRepo: jest.Mocked<IPaymentRepository>;
  let requestRepo: jest.Mocked<IServiceRequestRepository>;

  beforeEach(() => {
    paymentRepo = mockPaymentRepository();
    requestRepo = mockRequestRepository();
    useCase = new VerifyPaymentUseCase(paymentRepo, requestRepo);
  });

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

  const request = {
    id: 1n,
    citizen_id: 10n,
    service_id: 2n,
    payment_status: RequestPaymentStatus.PENDING_VERIFICATION,
    status: 'SUBMITTED' as any,
  };

  it('should successfully approve payment', async () => {
    paymentRepo.findById.mockResolvedValue(payment as PaymentEntity);
    requestRepo.findById.mockResolvedValue(request as any);
    paymentRepo.update.mockResolvedValue({
      ...payment,
      status: PaymentStatus.APPROVED,
    } as PaymentEntity);

    const result = await useCase.execute(100n, 2n, { approve: true });

    expect(paymentRepo.findById).toHaveBeenCalledWith(100n);
    expect(requestRepo.findById).toHaveBeenCalledWith(1n);
    expect(paymentRepo.update).toHaveBeenCalledWith(100n, {
      status: PaymentStatus.APPROVED,
      rejection_reason: null,
    });
    expect(requestRepo.updateStatus).toHaveBeenCalledWith(1n, {
      payment_status: RequestPaymentStatus.PAID,
    });
    expect(requestRepo.addActivity).toHaveBeenCalled();
    expect(result.status).toBe(PaymentStatus.APPROVED);
  });

  it('should successfully reject payment with a rejection reason', async () => {
    paymentRepo.findById.mockResolvedValue(payment as PaymentEntity);
    requestRepo.findById.mockResolvedValue(request as any);
    paymentRepo.update.mockResolvedValue({
      ...payment,
      status: PaymentStatus.REJECTED,
      rejection_reason: 'Proof image blurry',
    } as PaymentEntity);

    const result = await useCase.execute(100n, 2n, {
      approve: false,
      rejection_reason: 'Proof image blurry',
    });

    expect(paymentRepo.update).toHaveBeenCalledWith(100n, {
      status: PaymentStatus.REJECTED,
      rejection_reason: 'Proof image blurry',
    });
    expect(requestRepo.updateStatus).toHaveBeenCalledWith(1n, {
      payment_status: RequestPaymentStatus.FAILED,
    });
    expect(requestRepo.addActivity).toHaveBeenCalled();
    expect(result.status).toBe(PaymentStatus.REJECTED);
    expect(result.rejection_reason).toBe('Proof image blurry');
  });

  it('should throw NotFoundException if payment is not found', async () => {
    paymentRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(100n, 2n, { approve: true })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if payment has already been verified', async () => {
    paymentRepo.findById.mockResolvedValue({
      ...payment,
      status: PaymentStatus.APPROVED,
    } as PaymentEntity);

    await expect(useCase.execute(100n, 2n, { approve: true })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException if request is not found', async () => {
    paymentRepo.findById.mockResolvedValue(payment as PaymentEntity);
    requestRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(100n, 2n, { approve: true })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if rejection reason is missing during rejection', async () => {
    paymentRepo.findById.mockResolvedValue(payment as PaymentEntity);
    requestRepo.findById.mockResolvedValue(request as any);

    await expect(useCase.execute(100n, 2n, { approve: false })).rejects.toThrow(
      new BadRequestException(
        'Rejection reason is required for rejecting payments',
      ),
    );
  });
});
