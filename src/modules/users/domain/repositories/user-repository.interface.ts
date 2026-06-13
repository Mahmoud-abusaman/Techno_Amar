import { UserEntity } from '../entities/user.entity';
import { CitizenProfileEntity } from '../entities/citizen-profile.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

export const IUserRepository = Symbol('IUserRepository');

export type UpdateCitizenProfileData = {
  date_of_birth?: Date | null;
  verification_document?: string | null;
  rejection_reason?: string | null;
  verified_at?: Date | null;
};

export type UserWithProfile = UserEntity & {
  citizen_profile: CitizenProfileEntity | null;
};

export type CreateUserData = {
  full_name: string;
  email: string;
  password_hash: string;
  national_id?: string | null;
  employee_id?: string | null;
  phone?: string | null;
  address?: string | null;
  city: GazaCities;
  role: UserRole;
  account_status?: AccountStatus;
  section_id?: bigint | null;
  is_verified?: boolean;
  is_active?: boolean;
};

export type UpdateUserData = Partial<Omit<CreateUserData, 'email'>>;

export type FindUsersFilter = {
  role?: UserRole;
  department_id?: bigint;
  section_id?: bigint;
  is_active?: boolean;
  account_status?: AccountStatus;
};

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  createCitizenProfile(userId: bigint): Promise<CitizenProfileEntity>;
  findAll(filter?: FindUsersFilter): Promise<UserEntity[]>;
  findById(id: bigint): Promise<UserEntity | null>;
  findByIdWithProfile(id: bigint): Promise<UserWithProfile | null>;
  updateCitizenProfile(
    userId: bigint,
    data: UpdateCitizenProfileData,
  ): Promise<CitizenProfileEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  findByNationalId(nationalId: string): Promise<UserEntity | null>;
  findByEmployeeId(employeeId: string): Promise<UserEntity | null>;
  update(id: bigint, data: UpdateUserData): Promise<UserEntity>;
  delete(id: bigint): Promise<UserEntity>;
}
