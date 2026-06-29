import { Injectable, Inject, ConflictException } from '@nestjs/common';
import {
  IUserRepository,
  CreateUserData,
} from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { SectionAssignmentValidator } from '@org/application/section-assignment.validator';
import { AccountStatus, UserRole } from '@/generated/prisma/enums';
import { toPublicUser } from '@users/application/user-response.mapper';

export type CreateUserInput = Omit<
  CreateUserData,
  'password_hash' | 'section_id'
> & {
  password: string;
  section_id?: string;
};

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    private readonly sectionAssignment: SectionAssignmentValidator,
  ) {}

  async execute(input: CreateUserInput) {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw new ConflictException('Email already exists');

    if (input.section_id != null) {
      await this.sectionAssignment.assertAssignable(BigInt(input.section_id));
    }

    const password_hash = await this.hashPort.hash(input.password);
    const { password, section_id, ...rest } = input;

    const user = await this.userRepo.create({
      ...rest,
      password_hash,
      section_id: section_id != null ? BigInt(section_id) : null,
      account_status: AccountStatus.ACTIVE,
      is_verified: true,
      is_active: true,
    });

    if (user.role === UserRole.CITIZEN) {
      await this.userRepo.createCitizenProfile(user.id);
    }

    return toPublicUser(user);
  }
}
