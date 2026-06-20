import { ConflictException, BadRequestException } from '@nestjs/common';
import { SignupUseCase, SignupInput } from '../signup.use-case';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';
import { UserEntity } from '@users/domain/entities/user.entity';
import { UserRole, GazaCities, AccountStatus } from '@/generated/prisma/enums';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';

const verificationDocuments = {
  id_document: {
    file_name: 'National ID Copy.pdf',
    file_type: 'application/pdf',
    file_url: 'https://ik.imagekit.io/TechnoAmar/citizens/id.pdf',
    file_id: 'file_abc123',
  },
  id_selfie: {
    file_name: 'Selfie with ID.jpg',
    file_type: 'image/jpeg',
    file_url: 'https://ik.imagekit.io/TechnoAmar/citizens/selfie.jpg',
    file_id: 'file_selfie123',
  },
};

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
  ({
    id: 1n,
    full_name: 'Ahmed Al-Masri',
    email: 'ahmed@example.com',
    password_hash: 'hashed_password',
    national_id: '123456789',
    employee_id: null,
    phone: '+970591234567',
    address: 'Gaza City',
    city: GazaCities.GAZA,
    is_verified: false,
    role: UserRole.CITIZEN,
    account_status: AccountStatus.PENDING_VERIFICATION,
    section_id: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as UserEntity;

const makeSignupInput = (
  overrides: Partial<SignupInput> = {},
): SignupInput => ({
  full_name: 'Ahmed Al-Masri',
  email: 'ahmed@example.com',
  password: 'SecurePass@2024',
  national_id: '123456789',
  phone: '+970591234567',
  address: 'Gaza City',
  city: GazaCities.GAZA,
  verification_documents: verificationDocuments,
  ...overrides,
});

describe('SignupUseCase', () => {
  let useCase: SignupUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let hashPort: jest.Mocked<IHashPort>;
  let fileValidator: jest.Mocked<
    Pick<
      ImageKitFileValidator,
      'isValidFileUrl' | 'isAllowedPdfMimeType' | 'isAllowedImageMimeType'
    >
  >;

  beforeEach(() => {
    userRepo = {
      create: jest.fn(),
      createCitizenProfile: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIdWithProfile: jest.fn(),
      updateCitizenProfile: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByNationalId: jest.fn(),
      findByEmployeeId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    hashPort = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    fileValidator = {
      isValidFileUrl: jest.fn().mockReturnValue(true),
      isAllowedPdfMimeType: jest.fn().mockReturnValue(true),
      isAllowedImageMimeType: jest.fn().mockReturnValue(true),
    };

    useCase = new SignupUseCase(
      userRepo,
      hashPort,
      fileValidator as unknown as ImageKitFileValidator,
    );
  });

  describe('execute', () => {
    it('creates a pending citizen profile and returns no tokens', async () => {
      const dto = makeSignupInput();
      const user = makeUser();

      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(user);
      userRepo.createCitizenProfile.mockResolvedValue({} as any);

      const result = await useCase.execute(dto);

      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        account_status: user.account_status,
      });
      expect(result.message).toContain('pending admin verification');
      expect(userRepo.createCitizenProfile).toHaveBeenCalledWith(user.id);
      expect(userRepo.updateCitizenProfile).toHaveBeenCalledWith(user.id, {
        verification_document: verificationDocuments.id_document.file_url,
        id_selfie: verificationDocuments.id_selfie.file_url,
      });
    });

    it('always creates the user with CITIZEN role and PENDING_VERIFICATION status', async () => {
      const dto = makeSignupInput();
      const user = makeUser();

      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(user);
      userRepo.createCitizenProfile.mockResolvedValue({} as any);

      await useCase.execute(dto);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CITIZEN,
          account_status: AccountStatus.PENDING_VERIFICATION,
          is_verified: false,
        }),
      );
    });

    it('does not pass the plain-text password to the repository', async () => {
      const dto = makeSignupInput();
      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(makeUser());
      userRepo.createCitizenProfile.mockResolvedValue({} as any);

      await useCase.execute(dto);

      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg).not.toHaveProperty('password');
      expect(createArg).toHaveProperty('password_hash', 'hashed_password');
    });

    it('hashes the password before creating the user', async () => {
      const dto = makeSignupInput({ password: 'SecurePass@2024' });
      hashPort.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue(makeUser());
      userRepo.createCitizenProfile.mockResolvedValue({} as any);

      await useCase.execute(dto);

      expect(hashPort.hash).toHaveBeenCalledWith('SecurePass@2024');
    });

    it('throws ConflictException on Prisma P2002 (duplicate national_id)', async () => {
      const dto = makeSignupInput();
      hashPort.hash.mockResolvedValue('hashed_password');
      const prismaError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
        meta: { modelName: 'User', target: ['national_id'] },
      });
      userRepo.create.mockRejectedValue(prismaError);

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ConflictException('A user with this national_id already exists'),
      );
    });

    it('throws ConflictException on Prisma P2002 (duplicate email)', async () => {
      const dto = makeSignupInput();
      hashPort.hash.mockResolvedValue('hashed_password');
      const prismaError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
        meta: { modelName: 'User', target: ['email'] },
      });
      userRepo.create.mockRejectedValue(prismaError);

      await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    });

    it('re-throws unknown errors from the repository', async () => {
      const dto = makeSignupInput();
      hashPort.hash.mockResolvedValue('hashed_password');
      const dbError = new Error('Database connection lost');
      userRepo.create.mockRejectedValue(dbError);

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Database connection lost',
      );
    });

    it('throws BadRequestException when ID document URL is invalid', async () => {
      fileValidator.isValidFileUrl.mockReturnValue(false);

      await expect(useCase.execute(makeSignupInput())).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when ID document is not a PDF', async () => {
      fileValidator.isAllowedPdfMimeType.mockReturnValue(false);

      await expect(useCase.execute(makeSignupInput())).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when selfie is not an image', async () => {
      fileValidator.isAllowedImageMimeType.mockReturnValue(false);

      await expect(useCase.execute(makeSignupInput())).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepo.create).not.toHaveBeenCalled();
    });
  });
});
