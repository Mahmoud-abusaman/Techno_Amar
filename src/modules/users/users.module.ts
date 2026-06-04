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
import { DeleteUserUseCase } from '@users/application/delete-user.use-case';

import { UsersController } from '@users/presentation/users.controller';

@Module({
  imports: [forwardRef(() => AuthModule), OrgModule],
  controllers: [UsersController],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: IHashPort, useClass: BcryptHashAdapter },
    CreateUserUseCase,
    GetAllUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: [IUserRepository],
})
export class UsersModule {}
