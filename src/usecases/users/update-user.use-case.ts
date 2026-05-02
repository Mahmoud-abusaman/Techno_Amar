import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IHashPort } from 'src/domain/ports/hash.port';
import { UpdateUserDto } from 'src/infrastructure/http/users/dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
  ) {}

  async execute(id: bigint, dto: UpdateUserDto) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const { password, ...rest } = dto;
    const updateData: Record<string, any> = { ...rest };

    if (password) {
      updateData.password_hash = await this.hashPort.hash(password);
    }

    return this.userRepo.update(id, updateData);
  }
}
