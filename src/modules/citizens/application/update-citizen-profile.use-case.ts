import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { CitizenProfileEntity } from '@domain/entities/citizen-profile.entity';

export interface UpdateCitizenProfileDto {
  full_name?: string;
  phone?: string;
  address?: string;
  date_of_birth?: Date;
}

export interface CitizenProfileResult {
  user: UserEntity;
  profile: CitizenProfileEntity | null;
}

@Injectable()
export class UpdateCitizenProfileUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(ICitizenProfileRepository) private readonly profileRepo: ICitizenProfileRepository,
  ) {}

  async execute(userId: bigint, dto: UpdateCitizenProfileDto): Promise<CitizenProfileResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { date_of_birth, ...userFields } = dto;
    const updatedUser = Object.keys(userFields).length
      ? await this.userRepo.update(userId, userFields)
      : user;

    let profile = await this.profileRepo.findByUserId(userId);
    if (date_of_birth !== undefined) {
      profile = profile
        ? await this.profileRepo.update(userId, { date_of_birth })
        : await this.profileRepo.create({ user_id: userId, date_of_birth });
    }

    return { user: updatedUser, profile };
  }
}
