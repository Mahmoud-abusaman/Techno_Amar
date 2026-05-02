import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from './auth.module';

// Domain
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IHashPort } from 'src/domain/ports/hash.port';

// Infrastructure
import { PrismaUserRepository } from 'src/infrastructure/database/repositories/prisma-user.repository';
import { BcryptHashAdapter } from 'src/infrastructure/security/bcrypt-hash.adapter';

// Use cases
import { CreateUserUseCase } from 'src/usecases/users/create-user.use-case';
import { GetAllUsersUseCase } from 'src/usecases/users/get-all-users.use-case';
import { GetUserUseCase } from 'src/usecases/users/get-user.use-case';
import { UpdateUserUseCase } from 'src/usecases/users/update-user.use-case';
import { DeleteUserUseCase } from 'src/usecases/users/delete-user.use-case';

// Presentation
import { UsersController } from 'src/infrastructure/http/users/users.controller';

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
