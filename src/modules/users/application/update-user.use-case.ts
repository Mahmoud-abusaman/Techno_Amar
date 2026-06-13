import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  UpdateUserData,
} from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { SectionAssignmentValidator } from '@org/application/section-assignment.validator';
import { AccountStatus } from '@/generated/prisma/enums';
import { toPublicUser } from '@users/application/user-response.mapper';

export type AdminUpdateUserInput = Partial<
  Omit<UpdateUserData, 'section_id'> & {
    password?: string;
    is_verified?: boolean;
    is_active?: boolean;
    account_status?: AccountStatus;
    section_id?: string;
  }
>;

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    private readonly sectionAssignment: SectionAssignmentValidator,
  ) {}

  async execute(id: bigint, input: AdminUpdateUserInput) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (input.section_id != null) {
      await this.sectionAssignment.assertAssignable(BigInt(input.section_id));
    }

    const { password, section_id, ...rest } = input;
    const updateData: Record<string, unknown> = { ...rest };

    if (section_id != null) {
      updateData.section_id = BigInt(section_id);
    }

    if (password) {
      updateData.password_hash = await this.hashPort.hash(password);
    }

    const updated = await this.userRepo.update(id, updateData);
    return toPublicUser(updated);
  }
}
