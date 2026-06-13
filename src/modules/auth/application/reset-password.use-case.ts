import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { IPasswordResetTokenPort } from '@auth/domain/ports/password-reset-token.port';

export interface ResetPasswordInput {
  reset_token: string;
  new_password: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(IPasswordResetTokenPort)
    private readonly resetTokenPort: IPasswordResetTokenPort,
  ) {}

  async execute(input: ResetPasswordInput): Promise<{ message: string }> {
    let payload: Awaited<ReturnType<typeof this.resetTokenPort.verify>>;
    try {
      payload = await this.resetTokenPort.verify(input.reset_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userRepo.findById(BigInt(payload.sub));
    if (!user) throw new NotFoundException('User not found');

    const password_hash = await this.hashPort.hash(input.new_password);
    await this.userRepo.update(user.id, { password_hash });

    return { message: 'Password has been reset successfully' };
  }
}
