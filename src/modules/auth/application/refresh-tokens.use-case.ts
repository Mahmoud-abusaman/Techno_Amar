import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IRefreshTokenPort, ITokenPairFactory } from '@domain/ports/token.port';
import { TokenPair } from '@domain/ports/token.port';
import { UserEntity } from '@domain/entities/user.entity';

export interface RefreshTokensResult {
  tokens: TokenPair;
  user: Pick<UserEntity, 'id' | 'email' | 'full_name' | 'role'>;
}

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IRefreshTokenPort) private readonly refreshTokenPort: IRefreshTokenPort,
    @Inject(ITokenPairFactory) private readonly tokenPairFactory: ITokenPairFactory,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokensResult> {
    let payload: Awaited<ReturnType<IRefreshTokenPort['verify']>>;

    try {
      payload = await this.refreshTokenPort.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepo.findById(BigInt(payload.sub));
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.refreshTokenPort.revoke(payload.tokenId);
    const tokens = await this.tokenPairFactory.createPair(user);

    return {
      tokens,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }
}
