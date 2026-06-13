import { Injectable, Inject } from '@nestjs/common';
import {
  IUserRepository,
  FindUsersFilter,
} from '@users/domain/repositories/user-repository.interface';
import { AccountStatus, UserRole } from '@/generated/prisma/enums';
import { toPublicUser } from '@users/application/user-response.mapper';

export type GetAllUsersInput = {
  role?: UserRole;
  account_status?: AccountStatus;
  is_active?: boolean;
};

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: GetAllUsersInput = {}) {
    const filter: FindUsersFilter = {};
    if (input.role) filter.role = input.role;
    if (input.account_status) filter.account_status = input.account_status;
    if (input.is_active !== undefined) filter.is_active = input.is_active;

    const users = await this.userRepo.findAll(filter);
    return users.map(toPublicUser);
  }
}
