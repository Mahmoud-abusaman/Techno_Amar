import { NotFoundException } from '@nestjs/common';
import { UpdateServiceTaskUseCase } from '../update-service-task.use-case';
import { IServiceTaskRepository } from '@service-tasks/domain/repositories/service-task-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { ServiceTaskEntity } from '@service-tasks/domain/entities/service-task.entity';

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

const makeTask = (
  overrides: Partial<ServiceTaskEntity> = {},
): ServiceTaskEntity => ({
  id: 10n,
  service_id: 1n,
  section_id: 2n,
  name: 'Initial Review',
  description: null,
  task_order: 1,
  estimated_time_hours: 4,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeTaskRepo = (): jest.Mocked<IServiceTaskRepository> => ({
  create: jest.fn(),
  findByServiceId: jest.fn(),
  findById: jest.fn(),
  findByIdAndServiceId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  countActiveByServiceId: jest.fn(),
  getMaxOrder: jest.fn(),
  incrementOrdersFrom: jest.fn(),
  reorderTask: jest.fn(),
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

const makeSectionRepo = (): jest.Mocked<ISectionRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNameInDepartment: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('UpdateServiceTaskUseCase', () => {
  let useCase: UpdateServiceTaskUseCase;
  let taskRepo: jest.Mocked<IServiceTaskRepository>;
  let serviceRepo: jest.Mocked<IServiceRepository>;
  let sectionRepo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    taskRepo = makeTaskRepo();
    serviceRepo = makeServiceRepo();
    sectionRepo = makeSectionRepo();
    useCase = new UpdateServiceTaskUseCase(taskRepo, serviceRepo, sectionRepo);
  });

  it('returns existing task when update payload is empty', async () => {
    const task = makeTask();
    serviceRepo.findById.mockResolvedValue(makeService());
    taskRepo.findByIdAndServiceId.mockResolvedValue(task);

    const result = await useCase.execute(1n, 10n, {});

    expect(result).toBe(task);
    expect(taskRepo.findById).not.toHaveBeenCalled();
    expect(taskRepo.update).not.toHaveBeenCalled();
  });

  it('refetches task after reorder-only update', async () => {
    const task = makeTask({ task_order: 1 });
    const reordered = makeTask({ task_order: 2 });
    serviceRepo.findById.mockResolvedValue(makeService());
    taskRepo.findByIdAndServiceId.mockResolvedValue(task);
    taskRepo.findById.mockResolvedValue(reordered);

    const result = await useCase.execute(1n, 10n, { task_order: 2 });

    expect(taskRepo.reorderTask).toHaveBeenCalledWith(1n, 10n, 1, 2);
    expect(taskRepo.findById).toHaveBeenCalledWith(10n);
    expect(result).toBe(reordered);
  });

  it('throws NotFoundException when task disappears after reorder', async () => {
    const task = makeTask({ task_order: 1 });
    serviceRepo.findById.mockResolvedValue(makeService());
    taskRepo.findByIdAndServiceId.mockResolvedValue(task);
    taskRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(1n, 10n, { task_order: 2 })).rejects.toThrow(
      new NotFoundException('Workflow task 10 not found for service 1'),
    );
  });
});
