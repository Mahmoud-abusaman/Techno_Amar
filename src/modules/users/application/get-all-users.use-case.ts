import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute() {
    return this.userRepo.findAll();
  }
}
