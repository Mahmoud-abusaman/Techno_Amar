import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { ITokenPairFactory } from '@auth/domain/ports/token.port';
import { TokenPair } from '@auth/domain/ports/token.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { UserRole, GazaCities } from '@/generated/prisma/enums';

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
  tokens: TokenPair;
  user: Pick<UserEntity, 'id' | 'email' | 'full_name' | 'role'>;
}

@Injectable()
export class SignupUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(ITokenPairFactory)
    private readonly tokenPairFactory: ITokenPairFactory,
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

    const tokens = await this.tokenPairFactory.createPair(user);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }
}
