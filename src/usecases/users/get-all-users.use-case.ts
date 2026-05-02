import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  execute() {
    return this.userRepo.findAll();
  }
}
