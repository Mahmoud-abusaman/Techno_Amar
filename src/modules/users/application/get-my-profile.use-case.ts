import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { toPublicUserWithProfile } from '@users/application/user-response.mapper';

@Injectable()
export class GetMyProfileUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: bigint) {
    const user = await this.userRepo.findByIdWithProfile(userId);
    if (!user) throw new NotFoundException('User not found');
    return toPublicUserWithProfile(user);
  }
}
