import { NotFoundException } from '@nestjs/common';
import { DeleteDepartmentUseCase } from '../delete-department.use-case';
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

describe('DeleteDepartmentUseCase', () => {
  let useCase: DeleteDepartmentUseCase;
  let repo: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteDepartmentUseCase(repo);
  });

  it('soft-deletes department when it exists', async () => {
    repo.findById.mockResolvedValue(makeDept());

    await useCase.execute(1n);

    expect(repo.delete).toHaveBeenCalledWith(1n);
  });

  it('throws NotFoundException when department does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n)).rejects.toThrow(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
