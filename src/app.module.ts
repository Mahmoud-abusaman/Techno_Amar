import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfiguration from '@shared/config/app.configuration';
import { PrismaModule } from '@shared/database/prisma.module';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { OrgModule } from '@org/org.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV}`
        : '.env',
      load: [appConfiguration],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrgModule,
  ],
})
export class AppModule {}
