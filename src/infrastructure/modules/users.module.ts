import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from './auth.module';

// Domain
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IHashPort } from '@domain/ports/hash.port';

// Infrastructure
import { PrismaUserRepository } from '@infrastructure/database/repositories/prisma-user.repository';
import { BcryptHashAdapter } from '@infrastructure/security/bcrypt-hash.adapter';

// Use cases
import { CreateUserUseCase } from '@/usecases/users/create-user.use-case';
import { GetAllUsersUseCase } from '@/usecases/users/get-all-users.use-case';
import { GetUserUseCase } from '@/usecases/users/get-user.use-case';
import { UpdateUserUseCase } from '@/usecases/users/update-user.use-case';
import { DeleteUserUseCase } from '@/usecases/users/delete-user.use-case';

// Presentation
import { UsersController } from '@infrastructure/http/users/users.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
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
