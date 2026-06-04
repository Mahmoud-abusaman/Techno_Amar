import { Injectable, Inject, ConflictException } from '@nestjs/common';
import {
  IUserRepository,
  CreateUserData,
} from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';

export type CreateUserInput = Omit<CreateUserData, 'password_hash'> & {
  password: string;
};

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
  ) {}

  async execute(input: CreateUserInput) {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw new ConflictException('Email already exists');

    const password_hash = await this.hashPort.hash(input.password);
    const { password, ...rest } = input;

    return this.userRepo.create({ ...rest, password_hash });
  }
}
