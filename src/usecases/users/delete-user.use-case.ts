import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: bigint) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.userRepo.delete(id);
  }
}
