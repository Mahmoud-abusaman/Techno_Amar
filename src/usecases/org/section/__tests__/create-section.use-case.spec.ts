import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateSectionUseCase } from '../create-section.use-case';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';
import { IDepartmentRepository } from '@domain/repositories/department-repository.interface';
import { SectionEntity } from '@domain/entities/section.entity';
import { DepartmentEntity } from '@domain/entities/department.entity';
import { UserRole } from '@/generated/prisma/enums';

const makeSection = (overrides: Partial<SectionEntity> = {}): SectionEntity => ({
  id: 1n,
  department_id: 10n,
  name: 'Road Maintenance',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeDept = (overrides: Partial<DepartmentEntity> = {}): DepartmentEntity => ({
  id: 10n,
  name: 'Civil Engineering',
  description: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeSectionRepo = (): jest.Mocked<ISectionRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNameInDepartment: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hasDependents: jest.fn(),
});

const makeDeptRepo = (): jest.Mocked<IDepartmentRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hasDependents: jest.fn(),
});

const adminCtx = { actorRole: UserRole.ADMIN, actorDepartmentId: null };
const managerCtx = { actorRole: UserRole.DEPARTMENT_MANAGER, actorDepartmentId: 10n };

describe('CreateSectionUseCase', () => {
  let useCase: CreateSectionUseCase;
  let sectionRepo: jest.Mocked<ISectionRepository>;
  let deptRepo: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    sectionRepo = makeSectionRepo();
    deptRepo = makeDeptRepo();
    useCase = new CreateSectionUseCase(sectionRepo, deptRepo);
  });

  it('creates section when admin provides valid data', async () => {
    const section = makeSection();
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findByNameInDepartment.mockResolvedValue(null);
    sectionRepo.create.mockResolvedValue(section);

    const result = await useCase.execute({ department_id: 10n, name: 'Road Maintenance' }, adminCtx);

    expect(result).toBe(section);
  });

  it('creates section when manager is in the same department', async () => {
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findByNameInDepartment.mockResolvedValue(null);
    sectionRepo.create.mockResolvedValue(makeSection());

    await expect(
      useCase.execute({ department_id: 10n, name: 'Road Maintenance' }, managerCtx),
    ).resolves.toBeDefined();
  });

  it('throws ForbiddenException when manager tries to create section in another department', async () => {
    const otherDeptCtx = { actorRole: UserRole.DEPARTMENT_MANAGER, actorDepartmentId: 99n };

    await expect(
      useCase.execute({ department_id: 10n, name: 'Road Maintenance' }, otherDeptCtx),
    ).rejects.toThrow(ForbiddenException);
    expect(deptRepo.findById).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when manager has no department assigned', async () => {
    const noDeptCtx = { actorRole: UserRole.DEPARTMENT_MANAGER, actorDepartmentId: null };

    await expect(
      useCase.execute({ department_id: 10n, name: 'Road Maintenance' }, noDeptCtx),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when department does not exist', async () => {
    deptRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ department_id: 10n, name: 'Road Maintenance' }, adminCtx),
    ).rejects.toThrow(NotFoundException);
    expect(sectionRepo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when department is inactive', async () => {
    deptRepo.findById.mockResolvedValue(makeDept({ is_active: false }));

    await expect(
      useCase.execute({ department_id: 10n, name: 'Road Maintenance' }, adminCtx),
    ).rejects.toThrow(ConflictException);
    expect(sectionRepo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when section name already exists in department', async () => {
    deptRepo.findById.mockResolvedValue(makeDept());
    sectionRepo.findByNameInDepartment.mockResolvedValue(makeSection());

    await expect(
      useCase.execute({ department_id: 10n, name: 'Road Maintenance' }, adminCtx),
    ).rejects.toThrow(ConflictException);
    expect(sectionRepo.create).not.toHaveBeenCalled();
  });
});
