import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IHashPort } from 'src/domain/ports/hash.port';
import { CreateUserDto } from 'src/infrastructure/http/users/dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
  ) {}

  async execute(dto: CreateUserDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const password_hash = await this.hashPort.hash(dto.password);
    const { password, ...rest } = dto;

    return this.userRepo.create({ ...rest, password_hash });
  }
}
