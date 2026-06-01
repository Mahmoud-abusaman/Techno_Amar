import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';
import { CitizenProfileEntity } from '@domain/entities/citizen-profile.entity';

@Injectable()
export class UploadVerificationDocumentUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(ICitizenProfileRepository) private readonly profileRepo: ICitizenProfileRepository,
  ) {}

  async execute(userId: bigint, filePath: string): Promise<CitizenProfileEntity> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.profileRepo.findByUserId(userId);
    return existing
      ? this.profileRepo.update(userId, { verification_document: filePath })
      : this.profileRepo.create({ user_id: userId, verification_document: filePath });
  }
}
