import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUserRepository } from './interfaces/user-repository.interface';
import * as bcrypt from 'bcrypt';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class UsersService {
  private static readonly HASH_ROUNDS = 10;

  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const password_hash = await bcrypt.hash(
      dto.password,
      UsersService.HASH_ROUNDS,
    );

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

  async update(id: bigint, dto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: Prisma.UserUpdateInput = { ...dto };

    if (dto.password) {
      updateData.password_hash = await bcrypt.hash(
        dto.password,
        UsersService.HASH_ROUNDS,
      );
      delete updateData.password_hash;
    }

    return this.userRepo.update(id, updateData);
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.userRepo.delete(id);
  }
}
