import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { AccountStatus } from '@/generated/prisma/enums';
import { toPublicUserWithProfile } from '@users/application/user-response.mapper';

export type RejectUserInput = {
  rejection_reason: string;
};

@Injectable()
export class RejectUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: bigint, input: RejectUserInput) {
    const user = await this.userRepo.findByIdWithProfile(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (user.account_status === AccountStatus.REJECTED) {
      throw new BadRequestException('User is already rejected');
    }

    const updated = await this.userRepo.update(id, {
      is_verified: false,
      is_active: false,
      account_status: AccountStatus.REJECTED,
    });

    if (user.citizen_profile) {
      await this.userRepo.updateCitizenProfile(id, {
        rejection_reason: input.rejection_reason,
        verified_at: null,
      });
    } else {
      await this.userRepo.createCitizenProfile(id);
      await this.userRepo.updateCitizenProfile(id, {
        rejection_reason: input.rejection_reason,
      });
    }

    const result = await this.userRepo.findByIdWithProfile(id);
    return toPublicUserWithProfile({ ...updated, citizen_profile: result?.citizen_profile ?? null });
  }
}
