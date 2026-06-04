import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { AccountStatus } from '@/generated/prisma/enums';

@Injectable()
export class VerifyCitizenUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(ICitizenProfileRepository) private readonly profileRepo: ICitizenProfileRepository,
  ) {}

  async execute(citizenId: bigint): Promise<UserEntity> {
    const user = await this.userRepo.findById(citizenId);
    if (!user) throw new NotFoundException('Citizen not found');

    if (user.account_status === AccountStatus.ACTIVE) {
      throw new BadRequestException('Citizen account is already verified');
    }

    const profile = await this.profileRepo.findByUserId(citizenId);
    if (!profile?.verification_document) {
      throw new BadRequestException('Citizen has not uploaded a verification document');
    }

    await this.profileRepo.update(citizenId, { verified_at: new Date(), rejection_reason: null });
    return this.userRepo.update(citizenId, {
      account_status: AccountStatus.ACTIVE,
      is_verified: true,
    });
  }
}
