import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IHashPort } from 'src/domain/ports/hash.port';
import { IPasswordResetTokenPort } from 'src/domain/ports/password-reset-token.port';
import { ResetPasswordDto } from 'src/infrastructure/http/auth/dto/forgot-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    @Inject(IPasswordResetTokenPort) private readonly resetTokenPort: IPasswordResetTokenPort,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ message: string }> {
    const payload = await this.resetTokenPort.verify(dto.reset_token);

    const user = await this.userRepo.findById(BigInt(payload.sub));
    if (!user) throw new NotFoundException('User not found');

    const password_hash = await this.hashPort.hash(dto.new_password);
    await this.userRepo.update(user.id, { password_hash });

    return { message: 'Password has been reset successfully' };
  }
}
