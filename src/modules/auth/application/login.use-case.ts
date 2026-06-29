import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { ITokenPairFactory } from '@auth/domain/ports/token.port';
import { TokenPair } from '@auth/domain/ports/token.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { ISectionRepository } from '@org/domain/repositories/section-repository.interface';
import { UserRole, AccountStatus } from '@/generated/prisma/enums';

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginResult {
  tokens: TokenPair;
  user: Pick<UserEntity, 'id' | 'email' | 'full_name' | 'role'> & {
    department_id: bigint | null;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(ITokenPairFactory)
    private readonly tokenPairFactory: ITokenPairFactory,
    @Inject(ISectionRepository)
    private readonly sectionRepo: ISectionRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    let user = await this.userRepo.findByNationalId(input.identifier);
    if (!user) user = await this.userRepo.findByEmployeeId(input.identifier);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.hashPort.compare(
      input.password,
      user.password_hash,
    );
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    this.assertAccountCanLogin(user);

    const department_id = await this.resolveDepartmentId(user.section_id);

    const tokens = await this.tokenPairFactory.createPair({
      id: user.id,
      email: user.email,
      role: user.role,
      department_id,
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department_id,
      },
    };
  }

  private assertAccountCanLogin(user: UserEntity): void {
    if (user.account_status === AccountStatus.REJECTED) {
      throw new UnauthorizedException('Account registration was rejected');
    }

    if (user.account_status === AccountStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException('Account is pending admin verification');
    }

    if (user.account_status === AccountStatus.INACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    if (user.role === UserRole.CITIZEN && !user.is_verified) {
      throw new UnauthorizedException('Account is not verified');
    }
  }

  private async resolveDepartmentId(
    sectionId: bigint | null,
  ): Promise<bigint | null> {
    if (sectionId == null) return null;
    const section = await this.sectionRepo.findById(sectionId);
    return section?.department_id ?? null;
  }
}
