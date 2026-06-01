import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfiguration from '@infrastructure/config/app.configuration';
import { PrismaModule } from '@infrastructure/database/prisma.module';
import { AuthModule } from './auth.module';
import { UsersModule } from './users.module';
import { OrgModule } from './org.module';
import { CitizensModule } from './citizens.module';
import { EmployeesModule } from './employees.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
      load: [appConfiguration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrgModule,
    CitizensModule,
    EmployeesModule,
  ],
})
export class AppModule {}
