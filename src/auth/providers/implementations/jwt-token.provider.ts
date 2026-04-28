import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ITokenProvider,
  TokenPayload,
  TokenOptions,
} from '../interfaces/token-provider.interface';

@Injectable()
export class JwtTokenProvider implements ITokenProvider {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async generate(
    payload: TokenPayload,
    options?: Partial<TokenOptions>,
  ): Promise<string> {
    const config = this.configService;
    const secret = options?.secret ?? config.get('app.jwt.secret');
    const expiresIn =
      options?.expiresIn ?? config.get('app.jwt.accessTokenTtl');
    const audience = options?.audience ?? config.get('app.jwt.audience');

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
      audience,
    });
  }

  async verify(token: string, secret?: string): Promise<TokenPayload> {
    try {
      const config = this.configService;
      return await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: secret ?? config.get('app.jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
