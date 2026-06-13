import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '@auth/auth.module';
import { OrgModule } from '@org/org.module';
import { IUserRepository } from '@users/domain/repositories/user-repository.interface';
import { IHashPort } from '@auth/domain/ports/hash.port';

import { PrismaUserRepository } from '@users/infrastructure/prisma-user.repository';
import { BcryptHashAdapter } from '@auth/infrastructure/bcrypt-hash.adapter';

import { CreateUserUseCase } from '@users/application/create-user.use-case';
import { GetAllUsersUseCase } from '@users/application/get-all-users.use-case';
import { GetUserUseCase } from '@users/application/get-user.use-case';
import { UpdateUserUseCase } from '@users/application/update-user.use-case';
import { GetMyProfileUseCase } from '@users/application/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '@users/application/update-my-profile.use-case';
import { VerifyUserUseCase } from '@users/application/verify-user.use-case';
import { RejectUserUseCase } from '@users/application/reject-user.use-case';
import { DisableUserUseCase } from '@users/application/disable-user.use-case';

import { UsersController } from '@users/presentation/users.controller';
import { AdminUsersController } from '@users/presentation/admin-users.controller';

@Module({
  imports: [forwardRef(() => AuthModule), OrgModule],
  controllers: [UsersController, AdminUsersController],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: IHashPort, useClass: BcryptHashAdapter },
    CreateUserUseCase,
    GetAllUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    VerifyUserUseCase,
    RejectUserUseCase,
    DisableUserUseCase,
  ],
  exports: [IUserRepository],
})
export class UsersModule {}
