import { NestFactory } from '@nestjs/core';
import { AppModule } from './infrastructure/modules/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './infrastructure/http/common/interceptors/response.interceptor';
import {
  HttpExceptionFilter,
  PrismaExceptionFilter,
  ValidationExceptionFilter,
  UncaughtExceptionFilter,
} from './infrastructure/http/common/filters/exception.filter';

// @ts-expect-error BigInt serialization
BigInt.prototype.toJSON = function () {
  return String(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(
    new UncaughtExceptionFilter(),
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  const config = new DocumentBuilder()
    .setTitle('Techno Amar')
    .setVersion('1.0')
    .addTag('munacapility')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api', app, () => SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
