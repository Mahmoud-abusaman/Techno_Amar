import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import appConfiguration from '@shared/config/app.configuration';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(
    @Inject(appConfiguration.KEY)
    private readonly config: ConfigType<typeof appConfiguration>,
  ) {
    const adapter = new PrismaPg({ connectionString: config.database.url });
    super({ adapter });
  }
}
