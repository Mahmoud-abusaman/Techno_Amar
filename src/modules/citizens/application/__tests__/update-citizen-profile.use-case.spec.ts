import { NotFoundException } from '@nestjs/common';
import { UpdateCitizenProfileUseCase } from '../update-citizen-profile.use-case';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { CitizenProfileEntity } from '@domain/entities/citizen-profile.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 1n, full_name: 'Ahmed', email: 'ahmed@example.com', password_hash: 'hash',
  national_id: '123', employee_id: null, phone: null, address: null,
  city: GazaCities.GAZA, is_verified: true, role: UserRole.CITIZEN,
  account_status: AccountStatus.ACTIVE, department_id: null, section_id: null,
  is_active: true, created_at: new Date(), updated_at: new Date(), ...overrides,
});

const makeProfile = (overrides: Partial<CitizenProfileEntity> = {}): CitizenProfileEntity => ({
  id: 1n, user_id: 1n, date_of_birth: null, verification_document: null,
  rejection_reason: null, verified_at: null, created_at: new Date(), updated_at: new Date(),
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

describe('UpdateCitizenProfileUseCase', () => {
  let useCase: UpdateCitizenProfileUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let profileRepo: jest.Mocked<ICitizenProfileRepository>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    profileRepo = makeProfileRepo();
    useCase = new UpdateCitizenProfileUseCase(userRepo, profileRepo);
  });

  it('updates user fields (full_name, phone)', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    userRepo.update.mockResolvedValue(makeUser({ full_name: 'Sami', phone: '+970' }));
    profileRepo.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute(1n, { full_name: 'Sami', phone: '+970' });

    expect(userRepo.update).toHaveBeenCalledWith(1n, { full_name: 'Sami', phone: '+970' });
    expect(result.user.full_name).toBe('Sami');
  });

  it('creates citizen profile when date_of_birth is provided and no profile exists', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    userRepo.update.mockResolvedValue(makeUser());
    profileRepo.findByUserId.mockResolvedValue(null);
    const dob = new Date('1990-01-01');
    profileRepo.create.mockResolvedValue(makeProfile({ date_of_birth: dob }));

    const result = await useCase.execute(1n, { date_of_birth: dob });

    expect(profileRepo.create).toHaveBeenCalledWith({ user_id: 1n, date_of_birth: dob });
    expect(result.profile?.date_of_birth).toEqual(dob);
  });

  it('updates existing profile when date_of_birth provided and profile exists', async () => {
    userRepo.findById.mockResolvedValue(makeUser());
    userRepo.update.mockResolvedValue(makeUser());
    const dob = new Date('1990-01-01');
    profileRepo.findByUserId.mockResolvedValue(makeProfile());
    profileRepo.update.mockResolvedValue(makeProfile({ date_of_birth: dob }));

    await useCase.execute(1n, { date_of_birth: dob });

    expect(profileRepo.update).toHaveBeenCalledWith(1n, { date_of_birth: dob });
    expect(profileRepo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n, { full_name: 'X' })).rejects.toThrow(NotFoundException);
  });
});
