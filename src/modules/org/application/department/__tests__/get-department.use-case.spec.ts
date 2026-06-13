import { NotFoundException } from '@nestjs/common';
import { GetDepartmentUseCase } from '../get-department.use-case';
import { IDepartmentRepository } from '@org/domain/repositories/department-repository.interface';
import { DepartmentEntity } from '@org/domain/entities/department.entity';

const makeDept = (): DepartmentEntity => ({
  id: 1n,
  name: 'Civil Engineering',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
});

const makeRepo = (): jest.Mocked<IDepartmentRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('GetDepartmentUseCase', () => {
  let useCase: GetDepartmentUseCase;
  let repo: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new GetDepartmentUseCase(repo);
  });

  it('returns the department when found', async () => {
    const dept = makeDept();
    repo.findById.mockResolvedValue(dept);

    const result = await useCase.execute(1n);

    expect(repo.findById).toHaveBeenCalledWith(1n);
    expect(result).toBe(dept);
  });

  it('throws NotFoundException when department does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n)).rejects.toThrow(NotFoundException);
  });
});
