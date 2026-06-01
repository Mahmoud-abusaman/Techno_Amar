import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';

import { AuthModule } from './auth.module';

// Domain — repository tokens
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { ICitizenProfileRepository } from '@domain/repositories/citizen-profile-repository.interface';

// Infrastructure — Prisma implementations
import { PrismaUserRepository } from '@infrastructure/database/repositories/prisma-user.repository';
import { PrismaCitizenProfileRepository } from '@infrastructure/database/repositories/prisma-citizen-profile.repository';

// Use cases
import { GetCitizenProfileUseCase } from '@usecases/citizens/get-citizen-profile.use-case';
import { UpdateCitizenProfileUseCase } from '@usecases/citizens/update-citizen-profile.use-case';
import { UploadVerificationDocumentUseCase } from '@usecases/citizens/upload-verification-document.use-case';
import { ListCitizensUseCase } from '@usecases/citizens/list-citizens.use-case';
import { VerifyCitizenUseCase } from '@usecases/citizens/verify-citizen.use-case';
import { RejectCitizenUseCase } from '@usecases/citizens/reject-citizen.use-case';
import { DeactivateCitizenUseCase } from '@usecases/citizens/deactivate-citizen.use-case';

// Presentation
import { CitizensController } from '@infrastructure/http/citizens/citizens.controller';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      dest: join(process.cwd(), 'uploads', 'verification-docs'),
    }),
  ],
  controllers: [CitizensController],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: ICitizenProfileRepository, useClass: PrismaCitizenProfileRepository },

    GetCitizenProfileUseCase,
    UpdateCitizenProfileUseCase,
    UploadVerificationDocumentUseCase,
    ListCitizensUseCase,
    VerifyCitizenUseCase,
    RejectCitizenUseCase,
    DeactivateCitizenUseCase,
  ],
  exports: [ICitizenProfileRepository],
})
export class CitizensModule {}
