import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { CitizenProfileEntity } from '@domain/entities/citizen-profile.entity';

export interface CitizenProfileResult {
  user: UserEntity;
  profile: CitizenProfileEntity | null;
}

@Injectable()
export class GetCitizenProfileUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(ICitizenProfileRepository) private readonly profileRepo: ICitizenProfileRepository,
  ) {}

  async execute(userId: bigint): Promise<CitizenProfileResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepo.findByUserId(userId);
    return { user, profile };
  }
}
