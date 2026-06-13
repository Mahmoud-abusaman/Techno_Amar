import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateServiceUseCase } from '../create-service.use-case';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { ServiceWithTasksEntity } from '@services/domain/entities/service-with-tasks.entity';
import { DepartmentEntity } from '@org/domain/entities/department.entity';
import { SectionEntity } from '@org/domain/entities/section.entity';

const makeServiceWithTasks = (
  overrides: Partial<ServiceWithTasksEntity> = {},
): ServiceWithTasksEntity => ({
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
  workflow_tasks: [
    {
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
    },
  ],
  ...overrides,
});

const makeDept = (
  overrides: Partial<DepartmentEntity> = {},
): DepartmentEntity => ({
  id: 1n,
  name: 'Civil Engineering',
  description: null,
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

const makeDeptRepo = (): jest.Mocked<IDepartmentRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeSectionRepo = (): jest.Mocked<ISectionRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNameInDepartment: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const baseDto = {
  name: 'Building Permit',
  department_id: 1n,
  fee: 50,
  estimated_processing_days: 14,
  workflow_tasks: [
    {
      name: 'Initial Review',
      section_id: 2n,
      estimated_time_hours: 4,
    },
  ],
};

describe('CreateServiceUseCase', () => {
  let useCase: CreateServiceUseCase;
  let serviceRepo: jest.Mocked<IServiceRepository>;
  let deptRepo: jest.Mocked<IDepartmentRepository>;
  let sectionRepo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    serviceRepo = makeServiceRepo();
    deptRepo = makeDeptRepo();
    sectionRepo = makeSectionRepo();
    useCase = new CreateServiceUseCase(serviceRepo, deptRepo, sectionRepo);
  });

  it('creates a service with workflow tasks when validations pass', async () => {
    const service = makeServiceWithTasks();
    serviceRepo.findByName.mockResolvedValue(null);
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findById.mockResolvedValue(makeSection());
    serviceRepo.createWithTasks.mockResolvedValue(service);

    const result = await useCase.execute(baseDto, 1n);

    expect(serviceRepo.createWithTasks).toHaveBeenCalledWith({
      name: 'Building Permit',
      description: null,
      department_id: 1n,
      fee: 50,
      estimated_processing_days: 14,
      created_by: 1n,
      workflow_tasks: [
        {
          section_id: 2n,
          name: 'Initial Review',
          description: null,
          task_order: 1,
          estimated_time_hours: 4,
        },
      ],
    });
    expect(result).toBe(service);
  });

  it('assigns task_order from array position', async () => {
    const service = makeServiceWithTasks();
    serviceRepo.findByName.mockResolvedValue(null);
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findById.mockResolvedValue(makeSection());
    serviceRepo.createWithTasks.mockResolvedValue(service);

    await useCase.execute(
      {
        ...baseDto,
        workflow_tasks: [
          { name: 'Step One', section_id: 2n, estimated_time_hours: 2 },
          { name: 'Step Two', section_id: 2n, estimated_time_hours: 3 },
        ],
      },
      1n,
    );

    expect(serviceRepo.createWithTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow_tasks: [
          expect.objectContaining({ name: 'Step One', task_order: 1 }),
          expect.objectContaining({ name: 'Step Two', task_order: 2 }),
        ],
      }),
    );
  });

  it('throws ConflictException when name already exists', async () => {
    serviceRepo.findByName.mockResolvedValue(makeServiceWithTasks());

    await expect(useCase.execute(baseDto, 1n)).rejects.toThrow(
      new ConflictException('Service "Building Permit" already exists'),
    );
  });

  it('throws NotFoundException when department does not exist', async () => {
    serviceRepo.findByName.mockResolvedValue(null);
    deptRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ...baseDto, department_id: 99n }, 1n),
    ).rejects.toThrow(new NotFoundException('Department 99 not found'));
  });

  it('throws NotFoundException when section does not exist', async () => {
    serviceRepo.findByName.mockResolvedValue(null);
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseDto, 1n)).rejects.toThrow(
      new NotFoundException('Section 2 not found'),
    );
  });

  it('throws ConflictException when section department differs from service', async () => {
    serviceRepo.findByName.mockResolvedValue(null);
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findById.mockResolvedValue(
      makeSection({ department_id: 99n }),
    );

    await expect(useCase.execute(baseDto, 1n)).rejects.toThrow(
      new ConflictException(
        'Task section must belong to the same department as the service',
      ),
    );
  });
});
