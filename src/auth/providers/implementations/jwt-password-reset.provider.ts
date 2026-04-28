import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  IPasswordResetProvider,
  PasswordResetPayload,
} from '../interfaces/password-reset.interface';

@Injectable()
export class JwtPasswordResetProvider implements IPasswordResetProvider {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async generate(userId: string): Promise<string> {
    const secret = this.configService.get('app.jwt.passwordResetSecret');
    const expiresIn = this.configService.get('app.jwt.passwordResetTtl');

    const payload: PasswordResetPayload = {
      sub: userId,
      type: 'password_reset',
    };

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  async verify(token: string): Promise<PasswordResetPayload> {
    try {
      const secret = this.configService.get('app.jwt.passwordResetSecret');
      const payload = await this.jwtService.verifyAsync<PasswordResetPayload>(token, {
        secret,
      });

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
