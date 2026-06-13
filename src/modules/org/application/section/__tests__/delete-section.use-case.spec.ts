import { NotFoundException } from '@nestjs/common';
import { DeleteSectionUseCase } from '../delete-section.use-case';
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

describe('DeleteSectionUseCase', () => {
  let useCase: DeleteSectionUseCase;
  let repo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteSectionUseCase(repo);
  });

  it('deletes section when it exists', async () => {
    repo.findById.mockResolvedValue(makeSection());

    await useCase.execute(1n);

    expect(repo.delete).toHaveBeenCalledWith(1n);
  });

  it('throws NotFoundException when section does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n)).rejects.toThrow(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
