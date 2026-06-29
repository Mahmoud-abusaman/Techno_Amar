import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateServiceTaskUseCase } from '../create-service-task.use-case';
import { IServiceTaskRepository } from '@service-tasks/domain/repositories/service-task-repository.interface';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { SectionEntity } from '@org/domain/entities/section.entity';
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

const makeSection = (
  overrides: Partial<SectionEntity> = {},
): SectionEntity => ({
  id: 2n,
  department_id: 1n,
  name: 'Review',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeTask = (
  overrides: Partial<ServiceTaskEntity> = {},
): ServiceTaskEntity => ({
  id: 1n,
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

describe('CreateServiceTaskUseCase', () => {
  let useCase: CreateServiceTaskUseCase;
  let taskRepo: jest.Mocked<IServiceTaskRepository>;
  let serviceRepo: jest.Mocked<IServiceRepository>;
  let sectionRepo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    taskRepo = makeTaskRepo();
    serviceRepo = makeServiceRepo();
    sectionRepo = makeSectionRepo();
    useCase = new CreateServiceTaskUseCase(taskRepo, serviceRepo, sectionRepo);
  });

  it('creates a task when section belongs to service department', async () => {
    const task = makeTask();
    serviceRepo.findById.mockResolvedValue(makeService());
    sectionRepo.findById.mockResolvedValue(makeSection());
    taskRepo.getMaxOrder.mockResolvedValue(0);
    taskRepo.create.mockResolvedValue(task);

    const result = await useCase.execute(1n, {
      name: 'Initial Review',
      section_id: 2n,
      estimated_time_hours: 4,
    });

    expect(taskRepo.create).toHaveBeenCalledWith({
      service_id: 1n,
      section_id: 2n,
      name: 'Initial Review',
      description: null,
      task_order: 1,
      estimated_time_hours: 4,
    });
    expect(result).toBe(task);
  });

  it('throws ConflictException when section department differs from service', async () => {
    serviceRepo.findById.mockResolvedValue(makeService({ department_id: 1n }));
    sectionRepo.findById.mockResolvedValue(makeSection({ department_id: 99n }));

    await expect(
      useCase.execute(1n, {
        name: 'Initial Review',
        section_id: 2n,
        estimated_time_hours: 4,
      }),
    ).rejects.toThrow(
      new ConflictException(
        'Task section must belong to the same department as the service',
      ),
    );
  });

  it('throws NotFoundException when service does not exist', async () => {
    serviceRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(1n, {
        name: 'Initial Review',
        section_id: 2n,
        estimated_time_hours: 4,
      }),
    ).rejects.toThrow(new NotFoundException('Service 1 not found'));
  });
});
