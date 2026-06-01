import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { UserEntity } from '@domain/entities/user.entity';
import { AccountStatus } from '@/generated/prisma/enums';

@Injectable()
export class DeactivateCitizenUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(citizenId: bigint): Promise<UserEntity> {
    const user = await this.userRepo.findById(citizenId);
    if (!user) throw new NotFoundException('Citizen not found');

    if (user.account_status === AccountStatus.INACTIVE) {
      throw new BadRequestException('Citizen account is already inactive');
    }

    return this.userRepo.update(citizenId, {
      account_status: AccountStatus.INACTIVE,
      is_active: false,
    });
  }
}
