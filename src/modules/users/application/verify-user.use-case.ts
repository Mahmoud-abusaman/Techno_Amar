import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { AccountStatus, UserRole } from '@/generated/prisma/enums';
import { toPublicUserWithProfile } from '@users/application/user-response.mapper';

@Injectable()
export class VerifyUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: bigint) {
    const user = await this.userRepo.findByIdWithProfile(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (user.account_status === AccountStatus.ACTIVE && user.is_verified) {
      throw new BadRequestException('User is already verified');
    }

    if (
      user.role === UserRole.CITIZEN &&
      (!user.citizen_profile?.verification_document ||
        !user.citizen_profile?.id_selfie)
    ) {
      throw new BadRequestException(
        'Citizen must upload an ID document and selfie before approval',
      );
    }

    const updated = await this.userRepo.update(id, {
      is_verified: true,
      is_active: true,
      account_status: AccountStatus.ACTIVE,
    });

    if (user.citizen_profile) {
      await this.userRepo.updateCitizenProfile(id, {
        verified_at: new Date(),
        rejection_reason: null,
      });
    }

    const result = await this.userRepo.findByIdWithProfile(id);
    return toPublicUserWithProfile({
      ...updated,
      citizen_profile: result?.citizen_profile ?? null,
    });
  }
}
