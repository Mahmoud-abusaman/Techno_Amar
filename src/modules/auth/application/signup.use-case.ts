import {
  Injectable,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { CitizenVerificationDocumentsInput } from '@uploads/presentation/dto/imagekit-file.dto';
import { validateCitizenVerificationDocuments } from '@uploads/application/citizen-verification-file.validator';

export interface SignupInput {
  full_name: string;
  email: string;
  password: string;
  national_id?: string;
  phone?: string;
  address?: string;
  city: GazaCities;
  verification_documents: CitizenVerificationDocumentsInput;
}

export interface SignupResult {
  user: Pick<
    UserEntity,
    'id' | 'email' | 'full_name' | 'role' | 'account_status'
  >;
  message: string;
}

@Injectable()
export class SignupUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IHashPort) private readonly hashPort: IHashPort,
    private readonly fileValidator: ImageKitFileValidator,
  ) {}

  async execute(input: SignupInput): Promise<SignupResult> {
    validateCitizenVerificationDocuments(
      input.verification_documents,
      this.fileValidator,
    );

    const password_hash = await this.hashPort.hash(input.password);
    const { password, verification_documents, ...userFields } = input;

    let user: UserEntity;
    try {
      user = await this.userRepo.create({
        ...userFields,
        role: UserRole.CITIZEN,
        password_hash,
        account_status: AccountStatus.PENDING_VERIFICATION,
        is_verified: false,
        is_active: true,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const field =
          err?.meta?.modelName === 'User'
            ? (err?.meta?.target?.[0] ?? 'identifier')
            : 'identifier';
        throw new ConflictException(`A user with this ${field} already exists`);
      }
      throw err;
    }

    await this.userRepo.createCitizenProfile(user.id);
    await this.userRepo.updateCitizenProfile(user.id, {
      verification_document: verification_documents.id_document.file_url,
      id_selfie: verification_documents.id_selfie.file_url,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        account_status: user.account_status,
      },
      message:
        'Registration submitted successfully. Your account is pending admin verification.',
    };
  }
}
