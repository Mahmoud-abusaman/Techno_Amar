import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeleteServiceUseCase } from '../delete-service.use-case';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { IServiceRequestRepository } from '@service-requests/domain/repositories/service-request-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';

const makeService = (
  overrides: Partial<ServiceEntity> = {},
): ServiceEntity => ({
  id: 1n,
  name: 'Building Permit',
  description: null,
  department_id: 1n,
  fee: 0,
  estimated_processing_days: 14,
  status: 'PUBLISHED',
  created_by: 1n,
  published_at: new Date(),
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeServiceRepo = (): jest.Mocked<IServiceRepository> => ({
  create: jest.fn(),
  createWithTasks: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdWithTasks: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  countActiveTasks: jest.fn(),
});

const makeRequestRepo = (): jest.Mocked<IServiceRequestRepository> => ({
  createWithTasks: jest.fn(),
  findById: jest.fn(),
  findByIdWithTasks: jest.fn(),
  findByCitizen: jest.fn(),
  updateStatus: jest.fn(),
  countActiveByServiceId: jest.fn(),
  findActivities: jest.fn(),
  addActivity: jest.fn(),
});

describe('DeleteServiceUseCase', () => {
  let useCase: DeleteServiceUseCase;
  let serviceRepo: jest.Mocked<IServiceRepository>;
  let requestRepo: jest.Mocked<IServiceRequestRepository>;

  beforeEach(() => {
    serviceRepo = makeServiceRepo();
    requestRepo = makeRequestRepo();
    useCase = new DeleteServiceUseCase(serviceRepo, requestRepo);
  });

  it('soft-deletes service when no active requests exist', async () => {
    serviceRepo.findById.mockResolvedValue(makeService());
    requestRepo.countActiveByServiceId.mockResolvedValue(0);

    await useCase.execute(1n);

    expect(serviceRepo.delete).toHaveBeenCalledWith(1n);
  });

  it('throws when active requests exist', async () => {
    serviceRepo.findById.mockResolvedValue(makeService());
    requestRepo.countActiveByServiceId.mockResolvedValue(2);

    await expect(useCase.execute(1n)).rejects.toThrow(ConflictException);
    expect(serviceRepo.delete).not.toHaveBeenCalled();
  });

  it('throws when service not found', async () => {
    serviceRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(1n)).rejects.toThrow(NotFoundException);
  });
});
