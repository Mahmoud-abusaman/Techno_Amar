import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RejectCitizenUseCase } from '../reject-citizen.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';
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
  is_verified: false,
  role: UserRole.CITIZEN,
  account_status: AccountStatus.PENDING_VERIFICATION,
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

const makeProfileRepo = (): jest.Mocked<ICitizenProfileRepository> => ({
  create: jest.fn(), findByUserId: jest.fn(), update: jest.fn(), delete: jest.fn(),
});

describe('RejectCitizenUseCase', () => {
  let useCase: RejectCitizenUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let profileRepo: jest.Mocked<ICitizenProfileRepository>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    profileRepo = makeProfileRepo();
    useCase = new RejectCitizenUseCase(userRepo, profileRepo);
  });

  it('rejects a pending citizen with a reason', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    userRepo.update.mockResolvedValue(makeUser({ account_status: AccountStatus.REJECTED }));
    profileRepo.update.mockResolvedValue({} as any);

    const result = await useCase.execute(1n, 'Document unclear');

    expect(profileRepo.update).toHaveBeenCalledWith(1n, { rejection_reason: 'Document unclear', verified_at: null });
    expect(userRepo.update).toHaveBeenCalledWith(1n, { account_status: AccountStatus.REJECTED });
    expect(result.account_status).toBe(AccountStatus.REJECTED);
  });

  it('throws NotFoundException when citizen does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n, 'reason')).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when citizen is already verified', async () => {
    userRepo.findById.mockResolvedValue(makeUser({ account_status: AccountStatus.ACTIVE }));

    await expect(useCase.execute(1n, 'reason')).rejects.toThrow(BadRequestException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
