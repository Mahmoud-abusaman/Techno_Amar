import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IHashPort } from 'src/domain/ports/hash.port';
import { ITokenPairFactory } from 'src/domain/ports/token.port';
import { TokenPair } from 'src/domain/value-objects/token-pair.value-object';
import { UserEntity } from 'src/domain/entities/user.entity';
import { CreateUserDto } from 'src/infrastructure/http/users/dto/create-user.dto';

export interface SignupResult {
  tokens: TokenPair;
  user: Pick<UserEntity, 'id' | 'email' | 'full_name' | 'role'>;
}

@Injectable()
export class SignupUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(ITokenPairFactory) private readonly tokenPairFactory: ITokenPairFactory,
  ) {}

  async execute(dto: CreateUserDto): Promise<SignupResult> {
    const password_hash = await this.hashPort.hash(dto.password);
    const { password, ...rest } = dto;

    // ConflictException propagates from repository via Prisma P2002 filter if email is duplicate.
    const user = await this.userRepo.create({ ...rest, password_hash });
    const tokens = await this.tokenPairFactory.createPair(user);

    return {
      tokens,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }
}
