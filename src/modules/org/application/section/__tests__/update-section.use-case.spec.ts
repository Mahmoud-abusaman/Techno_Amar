import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UpdateSectionUseCase } from '../update-section.use-case';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { SectionEntity } from '@org/domain/entities/section.entity';
import { UserRole } from '@/generated/prisma/enums';

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

const adminCtx = { actorRole: UserRole.ADMIN, actorDepartmentId: null };
const managerCtx = {
  actorRole: UserRole.DEPARTMENT_MANAGER,
  actorDepartmentId: 10n,
};

describe('UpdateSectionUseCase', () => {
  let useCase: UpdateSectionUseCase;
  let repo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateSectionUseCase(repo);
  });

  it('updates section when admin provides valid data', async () => {
    const existing = makeSection();
    const updated = makeSection({ name: 'Bridge Inspection' });
    repo.findById.mockResolvedValue(existing);
    repo.findByNameInDepartment.mockResolvedValue(null);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute(
      1n,
      { name: 'Bridge Inspection' },
      adminCtx,
    );

    expect(repo.update).toHaveBeenCalledWith(1n, { name: 'Bridge Inspection' });
    expect(result).toBe(updated);
  });

  it('allows manager to update section in their own department', async () => {
    repo.findById.mockResolvedValue(makeSection());
    repo.findByNameInDepartment.mockResolvedValue(null);
    repo.update.mockResolvedValue(makeSection({ name: 'Updated' }));

    await expect(
      useCase.execute(1n, { name: 'Updated' }, managerCtx),
    ).resolves.toBeDefined();
  });

  it('throws ForbiddenException when manager tries to update section in another department', async () => {
    repo.findById.mockResolvedValue(makeSection({ department_id: 99n }));

    await expect(
      useCase.execute(1n, { name: 'Updated' }, managerCtx),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when section does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(99n, { name: 'Updated' }, adminCtx),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when new name already exists in department', async () => {
    repo.findById.mockResolvedValue(makeSection());
    repo.findByNameInDepartment.mockResolvedValue(
      makeSection({ id: 2n, name: 'Bridge Inspection' }),
    );

    await expect(
      useCase.execute(1n, { name: 'Bridge Inspection' }, adminCtx),
    ).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness when name is unchanged', async () => {
    const existing = makeSection();
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(existing);

    await useCase.execute(1n, { name: 'Road Maintenance' }, adminCtx);

    expect(repo.findByNameInDepartment).not.toHaveBeenCalled();
  });
});
