import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UpdateSectionUseCase } from '../update-section.use-case';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';

const makeSection = (
  overrides: Partial<SectionEntity> = {},
): SectionEntity => ({
  id: 1n,
  department_id: 10n,
  name: 'Road Maintenance',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeRepo = (): jest.Mocked<ISectionRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNameInDepartment: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('UpdateSectionUseCase', () => {
  let useCase: UpdateSectionUseCase;
  let repo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateSectionUseCase(repo);
  });

  it('updates section when valid data is provided', async () => {
    const existing = makeSection();
    const updated = makeSection({ name: 'Bridge Inspection' });
    repo.findById.mockResolvedValue(existing);
    repo.findByNameInDepartment.mockResolvedValue(null);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute(1n, { name: 'Bridge Inspection' });

    expect(repo.update).toHaveBeenCalledWith(1n, { name: 'Bridge Inspection' });
    expect(result).toBe(updated);
  });

  it('throws NotFoundException when section does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(99n, { name: 'Updated' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when new name already exists in department', async () => {
    repo.findById.mockResolvedValue(makeSection());
    repo.findByNameInDepartment.mockResolvedValue(
      makeSection({ id: 2n, name: 'Bridge Inspection' }),
    );

    await expect(
      useCase.execute(1n, { name: 'Bridge Inspection' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness when name is unchanged', async () => {
    const existing = makeSection();
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await useCase.execute(1n, { name: 'Road Maintenance' });

    expect(repo.findByNameInDepartment).not.toHaveBeenCalled();
  });
});
