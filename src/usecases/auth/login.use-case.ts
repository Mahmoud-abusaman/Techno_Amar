import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IHashPort } from '@domain/ports/hash.port';
import { ITokenPairFactory } from '@domain/ports/token.port';
import { TokenPair } from '@domain/ports/token.port';
import { UserEntity } from '@domain/entities/user.entity';
import { LoginDto } from '@infrastructure/http/auth/dto/login.dto';

export interface LoginResult {
  tokens: TokenPair;
  user: Pick<UserEntity, 'id' | 'email' | 'full_name' | 'role'>;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(ITokenPairFactory) private readonly tokenPairFactory: ITokenPairFactory,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(dto.email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.hashPort.compare(dto.password, user.password_hash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.is_active) throw new UnauthorizedException('Account is disabled');

    const tokens = await this.tokenPairFactory.createPair(user);

    return {
      tokens,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }
}
