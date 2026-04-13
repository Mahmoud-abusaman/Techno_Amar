import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/db/prisma.module';
import { IUserRepository } from './interfaces/user-repository.interface';
import { UserRepository } from './repositories/user.repository';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
