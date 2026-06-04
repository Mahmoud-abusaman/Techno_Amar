import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole } from '@/generated/prisma/enums';

@Injectable()
export class ListCitizensUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(): Promise<UserEntity[]> {
    return this.userRepo.findAll({ role: UserRole.CITIZEN });
  }
}
