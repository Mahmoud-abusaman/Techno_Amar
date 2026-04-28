import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUserRepository } from './interfaces/user-repository.interface';
import { IHashProvider } from 'src/auth/providers/interfaces/hash-provider.interface';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashProvider) private readonly hashProvider: IHashProvider,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const password_hash = await this.hashProvider.hash(dto.password);

    const { password, ...rest } = dto;
    return this.userRepo.create({
      ...rest,
      password_hash,
    } as Prisma.UserCreateInput);
  }

  async findAll() {
    return this.userRepo.findAll();
  }

  async findOne(id: bigint) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepo.findByEmail(email);
  }

  async findByIdentifier(identifier: string) {
    // Try phone first (most likely for citizens)
    let user = await this.userRepo.findByPhone(identifier);
    if (user) return user;

    // Try national_id
    user = await this.userRepo.findByNationalId(identifier);
    if (user) return user;

    // Try employee_id
    user = await this.userRepo.findByEmployeeId(identifier);
    return user;
  }

  async update(id: bigint, dto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: Prisma.UserUpdateInput = { ...dto };

    if (dto.password) {
      updateData.password_hash = await this.hashProvider.hash(dto.password);
      delete (updateData as { password?: string }).password;
    }

    return this.userRepo.update(id, updateData);
  }

  async updatePassword(id: bigint, hashedPassword: string) {
    await this.findOne(id);
    return this.userRepo.update(id, { password_hash: hashedPassword });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.userRepo.delete(id);
  }
}
