import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UpdateEmployeeUseCase } from '../update-employee.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { SectionEntity } from '@domain/entities/section.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

const makeEmployee = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 1n, full_name: 'Ali', email: 'ali@mun.gov', password_hash: 'hash',
  national_id: null, employee_id: 'EMP-001', phone: null, address: null,
  city: GazaCities.GAZA, is_verified: true, role: UserRole.EMPLOYEE,
  account_status: AccountStatus.ACTIVE, department_id: 10n, section_id: 1n,
  is_active: true, created_at: new Date(), updated_at: new Date(), ...overrides,
});

const makeSection = (overrides: Partial<SectionEntity> = {}): SectionEntity => ({
  id: 2n, department_id: 10n, name: 'HR', description: null,
  is_active: true, created_at: new Date(), updated_at: new Date(), ...overrides,
});

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByEmail: jest.fn(),
  findByPhone: jest.fn(), findByNationalId: jest.fn(), findByEmployeeId: jest.fn(),
  update: jest.fn(), delete: jest.fn(),
});

const makeSectionRepo = (): jest.Mocked<ISectionRepository> => ({
  create: jest.fn(), findAll: jest.fn(), findById: jest.fn(),
  findByNameInDepartment: jest.fn(), update: jest.fn(), delete: jest.fn(), hasDependents: jest.fn(),
});

const adminCtx = { actorRole: UserRole.ADMIN, actorDepartmentId: null };
const managerCtx = { actorRole: UserRole.DEPARTMENT_MANAGER, actorDepartmentId: 10n };

describe('UpdateEmployeeUseCase', () => {
  let useCase: UpdateEmployeeUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let sectionRepo: jest.Mocked<ISectionRepository>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    sectionRepo = makeSectionRepo();
    useCase = new UpdateEmployeeUseCase(userRepo, sectionRepo);
  });

  it('admin updates employee full_name', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    userRepo.update.mockResolvedValue(makeEmployee({ full_name: 'Sami' }));

    const result = await useCase.execute(1n, { full_name: 'Sami' }, adminCtx);

    expect(userRepo.update).toHaveBeenCalledWith(1n, expect.objectContaining({ full_name: 'Sami' }));
    expect(result.full_name).toBe('Sami');
  });

  it('updates employee section and derives department from section', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    sectionRepo.findById.mockResolvedValue(makeSection({ id: 2n, department_id: 10n }));
    userRepo.update.mockResolvedValue(makeEmployee({ section_id: 2n }));

    await useCase.execute(1n, { section_id: 2n }, adminCtx);

    expect(userRepo.update).toHaveBeenCalledWith(1n, expect.objectContaining({ section_id: 2n, department_id: 10n }));
  });

  it('throws ForbiddenException when manager updates employee in another department', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee({ department_id: 99n }));

    await expect(useCase.execute(1n, { full_name: 'X' }, managerCtx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when manager tries to change employee role', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee({ department_id: 10n }));

    await expect(useCase.execute(1n, { role: UserRole.DEPARTMENT_MANAGER }, managerCtx)).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when employee does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n, { full_name: 'X' }, adminCtx)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when target section does not exist', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    sectionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(1n, { section_id: 999n }, adminCtx)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when target section is inactive', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    sectionRepo.findById.mockResolvedValue(makeSection({ is_active: false }));

    await expect(useCase.execute(1n, { section_id: 2n }, adminCtx)).rejects.toThrow(BadRequestException);
  });
});
