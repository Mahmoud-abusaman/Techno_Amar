import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DeactivateEmployeeUseCase } from '../deactivate-employee.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

const makeEmployee = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 1n, full_name: 'Ali', email: 'ali@mun.gov', password_hash: 'hash',
  national_id: null, employee_id: 'EMP-001', phone: null, address: null,
  city: GazaCities.GAZA, is_verified: true, role: UserRole.EMPLOYEE,
  account_status: AccountStatus.ACTIVE, department_id: 10n, section_id: 1n,
  is_active: true, created_at: new Date(), updated_at: new Date(), ...overrides,
});

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByEmail: jest.fn(),
  findByPhone: jest.fn(), findByNationalId: jest.fn(), findByEmployeeId: jest.fn(),
  update: jest.fn(), delete: jest.fn(),
});

const adminCtx = { actorRole: UserRole.ADMIN, actorDepartmentId: null };
const managerCtx = { actorRole: UserRole.DEPARTMENT_MANAGER, actorDepartmentId: 10n };

describe('DeactivateEmployeeUseCase', () => {
  let useCase: DeactivateEmployeeUseCase;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    useCase = new DeactivateEmployeeUseCase(userRepo);
  });

  it('admin deactivates any employee', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    userRepo.update.mockResolvedValue(makeEmployee({ is_active: false }));

    const result = await useCase.execute(1n, adminCtx);

    expect(userRepo.update).toHaveBeenCalledWith(1n, { is_active: false });
    expect(result.is_active).toBe(false);
  });

  it('manager deactivates employee in their department', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee({ department_id: 10n }));
    userRepo.update.mockResolvedValue(makeEmployee({ is_active: false }));

    await expect(useCase.execute(1n, managerCtx)).resolves.toBeDefined();
  });

  it('throws ForbiddenException when manager tries to deactivate employee in another department', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee({ department_id: 99n }));

    await expect(useCase.execute(1n, managerCtx)).rejects.toThrow(ForbiddenException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when employee does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n, adminCtx)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when employee is already inactive', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee({ is_active: false }));

    await expect(useCase.execute(1n, adminCtx)).rejects.toThrow(BadRequestException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
