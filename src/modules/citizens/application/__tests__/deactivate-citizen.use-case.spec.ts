import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeactivateCitizenUseCase } from '../deactivate-citizen.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 1n,
  full_name: 'Ahmed',
  email: 'ahmed@example.com',
  password_hash: 'hash',
  national_id: '123',
  employee_id: null,
  phone: null,
  address: null,
  city: GazaCities.GAZA,
  is_verified: true,
  role: UserRole.CITIZEN,
  account_status: AccountStatus.ACTIVE,
  department_id: null,
  section_id: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByEmail: jest.fn(),
  findByPhone: jest.fn(), findByNationalId: jest.fn(), findByEmployeeId: jest.fn(),
  update: jest.fn(), delete: jest.fn(),
});

describe('DeactivateCitizenUseCase', () => {
  let useCase: DeactivateCitizenUseCase;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    useCase = new DeactivateCitizenUseCase(userRepo);
  });

  it('deactivates an active citizen', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    userRepo.update.mockResolvedValue(makeUser({ account_status: AccountStatus.INACTIVE, is_active: false }));

    const result = await useCase.execute(1n);

    expect(userRepo.update).toHaveBeenCalledWith(1n, { account_status: AccountStatus.INACTIVE, is_active: false });
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException when citizen does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when citizen is already inactive', async () => {
    userRepo.findById.mockResolvedValue(makeUser({ account_status: AccountStatus.INACTIVE, is_active: false }));

    await expect(useCase.execute(1n)).rejects.toThrow(BadRequestException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
