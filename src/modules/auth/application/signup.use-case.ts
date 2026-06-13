import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';

export interface SignupInput {
  full_name: string;
  email: string;
  password: string;
  national_id?: string;
  phone?: string;
  address?: string;
  city: GazaCities;
}

export interface SignupResult {
  user: Pick<
    UserEntity,
    'id' | 'email' | 'full_name' | 'role' | 'account_status'
  >;
  message: string;
}

@Injectable()
export class SignupUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
  ) {}

  async execute(input: SignupInput): Promise<SignupResult> {
    const password_hash = await this.hashPort.hash(input.password);
    const { password, ...rest } = input;

    let user: UserEntity;
    try {
      user = await this.userRepo.create({
        ...rest,
        role: UserRole.CITIZEN,
        password_hash,
        account_status: AccountStatus.PENDING_VERIFICATION,
        is_verified: false,
        is_active: true,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const field =
          err?.meta?.modelName === 'User'
            ? (err?.meta?.target?.[0] ?? 'identifier')
            : 'identifier';
        throw new ConflictException(`A user with this ${field} already exists`);
      }
      throw err;
    }

    await this.userRepo.createCitizenProfile(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        account_status: user.account_status,
      },
      message:
        'Registration submitted successfully. Your account is pending admin verification.',
    };
  }
}
