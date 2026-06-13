import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateServiceUseCase } from '../create-service.use-case';
import { IServiceRepository } from '@services/domain/repositories/service-repository.interface';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { ServiceEntity } from '@services/domain/entities/service.entity';
import { DepartmentEntity } from '@org/domain/entities/department.entity';

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

const makeServiceRepo = (): jest.Mocked<IServiceRepository> => ({
  create: jest.fn(),
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

describe('CreateServiceUseCase', () => {
  let useCase: CreateServiceUseCase;
  let serviceRepo: jest.Mocked<IServiceRepository>;
  let deptRepo: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    serviceRepo = makeServiceRepo();
    deptRepo = makeDeptRepo();
    useCase = new CreateServiceUseCase(serviceRepo, deptRepo);
  });

  it('creates a service when name is unique and department is active', async () => {
    const service = makeService();
    serviceRepo.findByName.mockResolvedValue(null);
    deptRepo.findById.mockResolvedValue(makeDept());
    serviceRepo.create.mockResolvedValue(service);

    const result = await useCase.execute(
      {
        name: 'Building Permit',
        department_id: 1n,
        fee: 50,
        estimated_processing_days: 14,
      },
      1n,
    );

    expect(serviceRepo.create).toHaveBeenCalledWith({
      name: 'Building Permit',
      description: null,
      department_id: 1n,
      fee: 50,
      estimated_processing_days: 14,
      created_by: 1n,
    });
    expect(result).toBe(service);
  });

  it('throws ConflictException when name already exists', async () => {
    serviceRepo.findByName.mockResolvedValue(makeService());

    await expect(
      useCase.execute(
        {
          name: 'Building Permit',
          department_id: 1n,
          fee: 50,
          estimated_processing_days: 14,
        },
        1n,
      ),
    ).rejects.toThrow(
      new ConflictException('Service "Building Permit" already exists'),
    );
  });

  it('throws NotFoundException when department does not exist', async () => {
    serviceRepo.findByName.mockResolvedValue(null);
    deptRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        {
          name: 'Building Permit',
          department_id: 99n,
          fee: 50,
          estimated_processing_days: 14,
        },
        1n,
      ),
    ).rejects.toThrow(new NotFoundException('Department 99 not found'));
  });
});
