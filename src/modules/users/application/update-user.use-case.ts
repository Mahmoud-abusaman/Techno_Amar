import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  UpdateUserData,
} from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { SectionAssignmentValidator } from '@org/application/section-assignment.validator';

export type UpdateUserInput = Partial<
  UpdateUserData & { password?: string; is_verified?: boolean; is_active?: boolean }
>;

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    private readonly sectionAssignment: SectionAssignmentValidator,
  ) {}

  async execute(id: bigint, input: UpdateUserInput) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (input.section_id != null) {
      await this.sectionAssignment.assertAssignable(input.section_id);
    }

    const { password, ...rest } = input;
    const updateData: Record<string, unknown> = { ...rest };

    if (password) {
      updateData.password_hash = await this.hashPort.hash(password);
    }

    return this.userRepo.update(id, updateData);
  }
}
