import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { CitizenVerificationDocumentsInput } from '@uploads/presentation/dto/imagekit-file.dto';
import { validateCitizenVerificationDocuments } from '@uploads/application/citizen-verification-file.validator';
import { AccountStatus, UserRole } from '@/generated/prisma/enums';
import { toPublicUserWithProfile } from '@users/application/user-response.mapper';

@Injectable()
export class ResubmitVerificationDocumentsUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    private readonly fileValidator: ImageKitFileValidator,
  ) {}

  async execute(userId: bigint, documents: CitizenVerificationDocumentsInput) {
    const user = await this.userRepo.findByIdWithProfile(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== UserRole.CITIZEN) {
      throw new BadRequestException(
        'Only citizens can upload verification documents',
      );
    }

    if (user.account_status !== AccountStatus.REJECTED) {
      throw new BadRequestException(
        'Verification documents can only be resubmitted after account rejection',
      );
    }

    validateCitizenVerificationDocuments(documents, this.fileValidator);

    if (!user.citizen_profile) {
      await this.userRepo.createCitizenProfile(userId);
    }

    await this.userRepo.updateCitizenProfile(userId, {
      verification_document: documents.id_document.file_url,
      id_selfie: documents.id_selfie.file_url,
      rejection_reason: null,
    });

    await this.userRepo.update(userId, {
      account_status: AccountStatus.PENDING_VERIFICATION,
      is_active: true,
    });

    const result = await this.userRepo.findByIdWithProfile(userId);
    return toPublicUserWithProfile(result!);
  }
}
