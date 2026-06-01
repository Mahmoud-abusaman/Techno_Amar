import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateDepartmentUseCase } from '../update-department.use-case';
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

describe('UpdateDepartmentUseCase', () => {
  let useCase: UpdateDepartmentUseCase;
  let repo: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateDepartmentUseCase(repo);
  });

  it('updates department when it exists and new name is unique', async () => {
    const existing = makeDept();
    const updated = makeDept({ name: 'Urban Planning' });
    repo.findById.mockResolvedValue(existing);
    repo.findByName.mockResolvedValue(null);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute(1n, { name: 'Urban Planning' });

    expect(repo.findByName).toHaveBeenCalledWith('Urban Planning');
    expect(repo.update).toHaveBeenCalledWith(1n, { name: 'Urban Planning' });
    expect(result).toBe(updated);
  });

  it('does not check name uniqueness when name is unchanged', async () => {
    const existing = makeDept();
    const updated = makeDept({ description: 'New description' });
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(updated);

    await useCase.execute(1n, { description: 'New description' });

    expect(repo.findByName).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness when updating to same name', async () => {
    const existing = makeDept();
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await useCase.execute(1n, { name: 'Civil Engineering' });

    expect(repo.findByName).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when department does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n, { name: 'New Name' })).rejects.toThrow(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws ConflictException when new name is already taken', async () => {
    repo.findById.mockResolvedValue(makeDept());
    repo.findByName.mockResolvedValue(makeDept({ id: 2n, name: 'Urban Planning' }));

    await expect(useCase.execute(1n, { name: 'Urban Planning' })).rejects.toThrow(
      new ConflictException('Department "Urban Planning" already exists'),
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
