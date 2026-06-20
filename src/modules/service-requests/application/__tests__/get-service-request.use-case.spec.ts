import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetServiceRequestUseCase } from '../get-service-request.use-case';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { ServiceRequestDetailEntity } from '@service-requests/domain/entities/service-request-detail.entity';

const makeDetail = (
  overrides: Partial<ServiceRequestDetailEntity> = {},
): ServiceRequestDetailEntity => ({
  id: 100n,
  citizen_id: 1n,
  service_id: 2n,
  status: 'SUBMITTED',
  payment_status: 'NOT_REQUIRED',
  current_task_id: 200n,
  submitted_at: new Date(),
  completed_at: null,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
  service_name: 'Permit',
  tasks: [],
  documents: [],
  ...overrides,
});

describe('GetServiceRequestUseCase', () => {
  let useCase: GetServiceRequestUseCase;
  let requestRepo: jest.Mocked<IServiceRequestRepository>;

  beforeEach(() => {
    requestRepo = {
      createWithTasks: jest.fn(),
      findById: jest.fn(),
      findByIdWithTasks: jest.fn(),
      findByCitizen: jest.fn(),
      updateStatus: jest.fn(),
      countActiveByServiceId: jest.fn(),
      findActivities: jest.fn(),
      addActivity: jest.fn(),
      findDocuments: jest.fn(),
    };
    useCase = new GetServiceRequestUseCase(requestRepo);
  });

  it('returns request for owning citizen', async () => {
    requestRepo.findByIdWithTasks.mockResolvedValue(makeDetail());

    const result = await useCase.execute(1n, 100n);

    expect(result.id).toBe('100');
    expect(result.service_name).toBe('Permit');
  });

  it('throws when citizen does not own request', async () => {
    requestRepo.findByIdWithTasks.mockResolvedValue(
      makeDetail({ citizen_id: 99n }),
    );

    await expect(useCase.execute(1n, 100n)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws when request not found', async () => {
    requestRepo.findByIdWithTasks.mockResolvedValue(null);

    await expect(useCase.execute(1n, 100n)).rejects.toThrow(NotFoundException);
  });
});
