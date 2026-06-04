import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteSectionUseCase } from '../delete-section.use-case';
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

describe('DeleteSectionUseCase', () => {
  let useCase: DeleteSectionUseCase;
  let repo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteSectionUseCase(repo);
  });

  it('soft-deletes section when admin requests', async () => {
    repo.findById.mockResolvedValue(makeSection());

    await useCase.execute(1n, adminCtx);

    expect(repo.delete).toHaveBeenCalledWith(1n);
  });

  it('allows manager to delete section in their own department', async () => {
    repo.findById.mockResolvedValue(makeSection());

    await expect(useCase.execute(1n, managerCtx)).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith(1n);
  });

  it('throws ForbiddenException when manager tries to delete section in another department', async () => {
    repo.findById.mockResolvedValue(makeSection({ department_id: 99n }));

    await expect(useCase.execute(1n, managerCtx)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when section does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n, adminCtx)).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

});
