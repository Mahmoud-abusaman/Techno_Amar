import { AuthModule } from './auth/auth.module';
import appConfiguration from './config/app.configuration';
import { UsersModule } from './users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV}`
        : '.env',
      load: [appConfiguration],
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
