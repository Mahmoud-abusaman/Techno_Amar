import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { AccountStatus } from '@/generated/prisma/enums';
import { toPublicUser } from '@users/application/user-response.mapper';

@Injectable()
export class DisableUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: bigint) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (!user.is_active && user.account_status === AccountStatus.INACTIVE) {
      throw new BadRequestException('User is already disabled');
    }

    const updated = await this.userRepo.update(id, {
      is_active: false,
      account_status: AccountStatus.INACTIVE,
    });

    return toPublicUser(updated);
  }
}
