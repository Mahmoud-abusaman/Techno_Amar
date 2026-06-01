import { ConflictException } from '@nestjs/common';
import { CreateDepartmentUseCase } from '../create-department.use-case';
import { IDepartmentRepository } from '@domain/repositories/department-repository.interface';
import { DepartmentEntity } from '@domain/entities/department.entity';

const makeDept = (overrides: Partial<DepartmentEntity> = {}): DepartmentEntity => ({
  id: 1n,
  name: 'Civil Engineering',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeRepo = (): jest.Mocked<IDepartmentRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hasDependents: jest.fn(),
});

describe('CreateDepartmentUseCase', () => {
  let useCase: CreateDepartmentUseCase;
  let repo: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new CreateDepartmentUseCase(repo);
  });

  it('creates and returns a department when name is unique', async () => {
    const dept = makeDept();
    repo.findByName.mockResolvedValue(null);
    repo.create.mockResolvedValue(dept);

    const result = await useCase.execute({ name: 'Civil Engineering' });

    expect(repo.findByName).toHaveBeenCalledWith('Civil Engineering');
    expect(repo.create).toHaveBeenCalledWith({ name: 'Civil Engineering' });
    expect(result).toBe(dept);
  });

  it('throws ConflictException when name already exists', async () => {
    repo.findByName.mockResolvedValue(makeDept());

    await expect(useCase.execute({ name: 'Civil Engineering' })).rejects.toThrow(
      new ConflictException('Department "Civil Engineering" already exists'),
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('passes description through to repo', async () => {
    const dept = makeDept({ description: 'Roads and bridges' });
    repo.findByName.mockResolvedValue(null);
    repo.create.mockResolvedValue(dept);

    await useCase.execute({ name: 'Civil Engineering', description: 'Roads and bridges' });

    expect(repo.create).toHaveBeenCalledWith({ name: 'Civil Engineering', description: 'Roads and bridges' });
  });
});
