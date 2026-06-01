import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VerifyCitizenUseCase } from '../verify-citizen.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { CitizenProfileEntity } from '@domain/entities/citizen-profile.entity';
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

const makeProfile = (overrides: Partial<CitizenProfileEntity> = {}): CitizenProfileEntity => ({
  id: 1n,
  user_id: 1n,
  date_of_birth: null,
  verification_document: 'uploads/doc.pdf',
  rejection_reason: null,
  verified_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  findByNationalId: jest.fn(),
  findByEmployeeId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeProfileRepo = (): jest.Mocked<ICitizenProfileRepository> => ({
  create: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('VerifyCitizenUseCase', () => {
  let useCase: VerifyCitizenUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let profileRepo: jest.Mocked<ICitizenProfileRepository>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    profileRepo = makeProfileRepo();
    useCase = new VerifyCitizenUseCase(userRepo, profileRepo);
  });

  it('verifies citizen with uploaded document', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    profileRepo.findByUserId.mockResolvedValue(makeProfile());
    userRepo.update.mockResolvedValue(makeUser({ account_status: AccountStatus.ACTIVE, is_verified: true }));
    profileRepo.update.mockResolvedValue(makeProfile({ verified_at: new Date() }));

    const result = await useCase.execute(1n);

    expect(profileRepo.update).toHaveBeenCalledWith(1n, expect.objectContaining({ verified_at: expect.any(Date) }));
    expect(userRepo.update).toHaveBeenCalledWith(1n, { account_status: AccountStatus.ACTIVE, is_verified: true });
    expect(result.is_verified).toBe(true);
  });

  it('throws NotFoundException when citizen does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n)).rejects.toThrow(NotFoundException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when citizen is already verified', async () => {
    userRepo.findById.mockResolvedValue(makeUser({ account_status: AccountStatus.ACTIVE }));

    await expect(useCase.execute(1n)).rejects.toThrow(BadRequestException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when no verification document uploaded', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    profileRepo.findByUserId.mockResolvedValue(makeProfile({ verification_document: null }));

    await expect(useCase.execute(1n)).rejects.toThrow(BadRequestException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when citizen profile does not exist', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    profileRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute(1n)).rejects.toThrow(BadRequestException);
  });
});
