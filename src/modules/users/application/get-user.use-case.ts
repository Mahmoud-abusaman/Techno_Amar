import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { toPublicUserWithProfile } from '@users/application/user-response.mapper';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: bigint) {
    const user = await this.userRepo.findByIdWithProfile(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return toPublicUserWithProfile(user);
  }
}
