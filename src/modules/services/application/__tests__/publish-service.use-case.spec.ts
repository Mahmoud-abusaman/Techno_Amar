import { ConflictException, NotFoundException } from '@nestjs/common';
import { PublishServiceUseCase } from '../publish-service.use-case';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { ServiceStatus } from '@/generated/prisma/enums';

const makeService = (
  overrides: Partial<ServiceEntity> = {},
): ServiceEntity => ({
  id: 1n,
  name: 'Building Permit',
  description: null,
  department_id: 1n,
  fee: 50,
  estimated_processing_days: 14,
  status: 'DRAFT',
  created_by: 1n,
  published_at: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeRepo = (): jest.Mocked<IServiceRepository> => ({
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

describe('PublishServiceUseCase', () => {
  let useCase: PublishServiceUseCase;
  let repo: jest.Mocked<IServiceRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new PublishServiceUseCase(repo);
  });

  it('publishes service when it has active tasks', async () => {
    const published = makeService({
      status: ServiceStatus.PUBLISHED,
      published_at: new Date(),
    });
    repo.findById.mockResolvedValue(makeService());
    repo.countActiveTasks.mockResolvedValue(2);
    repo.update.mockResolvedValue(published);

    const result = await useCase.execute(1n);

    expect(repo.update).toHaveBeenCalledWith(1n, {
      status: ServiceStatus.PUBLISHED,
      published_at: expect.any(Date),
    });
    expect(result).toBe(published);
  });

  it('throws ConflictException when no active tasks exist', async () => {
    repo.findById.mockResolvedValue(makeService());
    repo.countActiveTasks.mockResolvedValue(0);

    await expect(useCase.execute(1n)).rejects.toThrow(
      new ConflictException(
        'Service must have at least one active workflow task before publishing',
      ),
    );
  });

  it('throws NotFoundException when service does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(1n)).rejects.toThrow(
      new NotFoundException('Service 1 not found'),
    );
  });
});
