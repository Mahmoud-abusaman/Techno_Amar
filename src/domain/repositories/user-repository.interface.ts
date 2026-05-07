import { UserEntity } from '../entities/user.entity';
import { UserRole, GazaCities } from '@/generated/prisma/enums';

export const IUserRepository = Symbol('IUserRepository');

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
  is_verified?: boolean;
  is_active?: boolean;
};

export type UpdateUserData = Partial<Omit<CreateUserData, 'email'>>;

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findAll(): Promise<UserEntity[]>;
  findById(id: bigint): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  findByNationalId(nationalId: string): Promise<UserEntity | null>;
  findByEmployeeId(employeeId: string): Promise<UserEntity | null>;
  update(id: bigint, data: UpdateUserData): Promise<UserEntity>;
  delete(id: bigint): Promise<UserEntity>;
}
