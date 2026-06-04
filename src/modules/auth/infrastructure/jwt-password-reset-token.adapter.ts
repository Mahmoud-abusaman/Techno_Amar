import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  IPasswordResetTokenPort,
  PasswordResetPayload,
} from '@auth/domain/ports/password-reset-token.port';
import appConfiguration from '@shared/config/app.configuration';

@Injectable()
export class JwtPasswordResetTokenAdapter implements IPasswordResetTokenPort {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(appConfiguration.KEY)
    private readonly config: ConfigType<typeof appConfiguration>,
  ) {}

  generate(userId: string): Promise<string> {
    const payload: PasswordResetPayload = {
      sub: userId,
      type: 'password_reset',
    };
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwt.passwordResetSecret,
      expiresIn: this.config.jwt.passwordResetTtl,
    });
  }

  async verify(token: string): Promise<PasswordResetPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<PasswordResetPayload>(
        token,
        {
          secret: this.config.jwt.passwordResetSecret,
        },
      );

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
