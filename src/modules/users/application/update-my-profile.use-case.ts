import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { GazaCities } from '@/generated/prisma/enums';
import { toPublicUser } from '@users/application/user-response.mapper';

export type UpdateMyProfileInput = {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: GazaCities;
  password?: string;
};

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
  ) {}

  async execute(userId: bigint, input: UpdateMyProfileInput) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { password, ...rest } = input;
    const updateData: Record<string, unknown> = { ...rest };

    if (password) {
      updateData.password_hash = await this.hashPort.hash(password);
    }

    const updated = await this.userRepo.update(userId, updateData);
    return toPublicUser(updated);
  }
}
