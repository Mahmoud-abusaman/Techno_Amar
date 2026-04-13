import { Prisma, User } from 'generated/prisma/client';

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: bigint): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: bigint, data: Omit<Prisma.UserUpdateInput, 'id'>): Promise<User>;
  delete(id: bigint): Promise<User>;
}
