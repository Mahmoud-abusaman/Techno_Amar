import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  IPasswordResetTokenPort,
  PasswordResetPayload,
} from 'src/domain/ports/password-reset-token.port';

@Injectable()
export class JwtPasswordResetTokenAdapter implements IPasswordResetTokenPort {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  generate(userId: string): Promise<string> {
    const payload: PasswordResetPayload = { sub: userId, type: 'password_reset' };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get('app.jwt.passwordResetSecret'),
      expiresIn: this.config.get('app.jwt.passwordResetTtl'),
    });
  }

  async verify(token: string): Promise<PasswordResetPayload> {
    try {
      const secret = this.config.get<string>('app.jwt.passwordResetSecret');
      const payload = await this.jwtService.verifyAsync<PasswordResetPayload>(token, { secret });

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
