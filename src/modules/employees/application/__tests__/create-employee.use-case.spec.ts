import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateEmployeeUseCase } from '../create-employee.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ISectionRepository } from '@domain/repositories/section-repository.interface';
import { IHashPort } from '@domain/ports/hash.port';
import { SectionEntity } from '@domain/entities/section.entity';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

const makeSection = (overrides: Partial<SectionEntity> = {}): SectionEntity => ({
  id: 1n, department_id: 10n, name: 'IT', description: null,
  is_active: true, created_at: new Date(), updated_at: new Date(), ...overrides,
});

const makeEmployee = (): UserEntity => ({
  id: 100n, full_name: 'Ali', email: 'ali@mun.gov', password_hash: 'hash',
  national_id: null, employee_id: 'EMP-001', phone: null, address: null,
  city: GazaCities.GAZA, is_verified: true, role: UserRole.EMPLOYEE,
  account_status: AccountStatus.ACTIVE, department_id: 10n, section_id: 1n,
  is_active: true, created_at: new Date(), updated_at: new Date(),
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

const makeHashPort = (): jest.Mocked<IHashPort> => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
});

const adminCtx = { actorRole: UserRole.ADMIN, actorDepartmentId: null };
const managerCtx = { actorRole: UserRole.DEPARTMENT_MANAGER, actorDepartmentId: 10n };

const validDto = {
  full_name: 'Ali Ahmed',
  email: 'ali@mun.gov',
  password: 'SecurePass@2024',
  employee_id: 'EMP-001',
  city: GazaCities.GAZA,
  role: 'EMPLOYEE' as const,
  section_id: 1n,
};

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let sectionRepo: jest.Mocked<ISectionRepository>;
  let hashPort: jest.Mocked<IHashPort>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    sectionRepo = makeSectionRepo();
    hashPort = makeHashPort();
    useCase = new CreateEmployeeUseCase(userRepo, sectionRepo, hashPort);
  });

  it('admin creates employee in any section', async () => {
    sectionRepo.findById.mockResolvedValue(makeSection());
    userRepo.create.mockResolvedValue(makeEmployee());

    const result = await useCase.execute(validDto, adminCtx);

    expect(hashPort.hash).toHaveBeenCalledWith('SecurePass@2024');
    expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      department_id: 10n,
      section_id: 1n,
    }));
    expect(result.role).toBe(UserRole.EMPLOYEE);
  });

  it('manager creates employee in own department section', async () => {
    sectionRepo.findById.mockResolvedValue(makeSection({ department_id: 10n }));
    userRepo.create.mockResolvedValue(makeEmployee());

    await expect(useCase.execute(validDto, managerCtx)).resolves.toBeDefined();
  });

  it('throws ForbiddenException when manager tries section in another department', async () => {
    sectionRepo.findById.mockResolvedValue(makeSection({ department_id: 99n }));

    await expect(useCase.execute(validDto, managerCtx)).rejects.toThrow(ForbiddenException);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when section does not exist', async () => {
    sectionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(validDto, adminCtx)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when section is inactive', async () => {
    sectionRepo.findById.mockResolvedValue(makeSection({ is_active: false }));

    await expect(useCase.execute(validDto, adminCtx)).rejects.toThrow(BadRequestException);
  });

  it('throws ConflictException on duplicate employee_id', async () => {
    sectionRepo.findById.mockResolvedValue(makeSection());
    userRepo.create.mockRejectedValue({ code: 'P2002', meta: { target: ['employee_id'] } });

    await expect(useCase.execute(validDto, adminCtx)).rejects.toThrow(ConflictException);
  });
});
