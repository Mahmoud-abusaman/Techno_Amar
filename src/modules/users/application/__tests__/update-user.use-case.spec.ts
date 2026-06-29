/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  UpdateUserUseCase,
  AdminUpdateUserInput,
} from '../update-user.use-case';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { SectionAssignmentValidator } from '@org/application/section-assignment.validator';
import { UserEntity } from '@users/domain/entities/user.entity';
import { SectionEntity } from '@org/domain/entities/section.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 1n,
  full_name: 'John Doe',
  email: 'john@example.com',
  password_hash: 'hashed_password',
  national_id: '123456789',
  employee_id: null,
  phone: '0599000000',
  address: 'Gaza City',
  city: GazaCities.GAZA,
  is_verified: true,
  role: UserRole.CITIZEN,
  account_status: AccountStatus.ACTIVE,
  section_id: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const mockUserRepository = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(),
  createCitizenProfile: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdWithProfile: jest.fn(),
  updateCitizenProfile: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  findByNationalId: jest.fn(),
  findByEmployeeId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockHashPort = (): jest.Mocked<IHashPort> => ({
  hash: jest.fn(),
  compare: jest.fn(),
});

const mockSectionAssignmentValidator = () => {
  return {
    assertAssignable: jest.fn(),
  } as unknown as jest.Mocked<SectionAssignmentValidator>;
};

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let hashPort: jest.Mocked<IHashPort>;
  let sectionAssignment: jest.Mocked<SectionAssignmentValidator>;

  beforeEach(() => {
    userRepo = mockUserRepository();
    hashPort = mockHashPort();
    sectionAssignment = mockSectionAssignmentValidator();
    useCase = new UpdateUserUseCase(userRepo, hashPort, sectionAssignment);
  });

  it('should successfully update user details and return a public user profile', async () => {
    const existingUser = makeUser();
    const updatedUser = makeUser({ full_name: 'John Smith' });

    userRepo.findById.mockResolvedValue(existingUser);
    userRepo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute(1n, { full_name: 'John Smith' });

    expect(userRepo.findById).toHaveBeenCalledWith(1n);
    expect(userRepo.update).toHaveBeenCalledWith(1n, {
      full_name: 'John Smith',
    });
    expect(result).not.toHaveProperty('password_hash');
    expect(result.full_name).toBe('John Smith');
  });

  it('should hash the password if password is provided', async () => {
    const existingUser = makeUser();
    const updatedUser = makeUser({ password_hash: 'new_hashed' });

    userRepo.findById.mockResolvedValue(existingUser);
    hashPort.hash.mockResolvedValue('new_hashed');
    userRepo.update.mockResolvedValue(updatedUser);

    await useCase.execute(1n, { password: 'newpassword' });

    expect(hashPort.hash).toHaveBeenCalledWith('newpassword');
    expect(userRepo.update).toHaveBeenCalledWith(1n, {
      password_hash: 'new_hashed',
    });
  });

  it('should validate section assignment if section_id is updated', async () => {
    const existingUser = makeUser({ role: UserRole.EMPLOYEE });
    const updatedUser = makeUser({ role: UserRole.EMPLOYEE, section_id: 2n });

    userRepo.findById.mockResolvedValue(existingUser);
    userRepo.update.mockResolvedValue(updatedUser);
    sectionAssignment.assertAssignable.mockResolvedValue({
      id: 2n,
    } as SectionEntity);

    await useCase.execute(1n, { section_id: '2' });

    expect(sectionAssignment.assertAssignable).toHaveBeenCalledWith(2n);
    expect(userRepo.update).toHaveBeenCalledWith(1n, { section_id: 2n });
  });

  it('should throw NotFoundException if user is not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(99n, { full_name: 'Test' })).rejects.toThrow(
      NotFoundException,
    );
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if trying to change the user role', async () => {
    const existingUser = makeUser({ role: UserRole.CITIZEN });

    userRepo.findById.mockResolvedValue(existingUser);

    await expect(
      useCase.execute(1n, {
        role: UserRole.ADMIN,
      } as unknown as AdminUpdateUserInput),
    ).rejects.toThrow(
      new BadRequestException('Changing user roles is not supported'),
    );

    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should not throw exception if role is provided in input but matches current user role', async () => {
    const existingUser = makeUser({ role: UserRole.CITIZEN });
    const updatedUser = makeUser({
      role: UserRole.CITIZEN,
      full_name: 'John Updated',
    });

    userRepo.findById.mockResolvedValue(existingUser);
    userRepo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute(1n, {
      role: UserRole.CITIZEN,
      full_name: 'John Updated',
    } as unknown as AdminUpdateUserInput);

    expect(userRepo.update).toHaveBeenCalledWith(1n, {
      full_name: 'John Updated',
    });
    expect(result.full_name).toBe('John Updated');
  });
});
