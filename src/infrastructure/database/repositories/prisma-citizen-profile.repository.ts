import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ICitizenProfileRepository,
  CreateCitizenProfileData,
  UpdateCitizenProfileData,
} from '@domain/repositories/citizen-profile-repository.interface';
import { CitizenProfileEntity } from '@domain/entities/citizen-profile.entity';

@Injectable()
export class PrismaCitizenProfileRepository implements ICitizenProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateCitizenProfileData): Promise<CitizenProfileEntity> {
    return this.prisma.citizenProfile.create({ data }) as Promise<CitizenProfileEntity>;
  }

  findByUserId(userId: bigint): Promise<CitizenProfileEntity | null> {
    return this.prisma.citizenProfile.findUnique({
      where: { user_id: userId },
    }) as Promise<CitizenProfileEntity | null>;
  }

  update(userId: bigint, data: UpdateCitizenProfileData): Promise<CitizenProfileEntity> {
    return this.prisma.citizenProfile.update({
      where: { user_id: userId },
      data,
    }) as Promise<CitizenProfileEntity>;
  }

  async delete(userId: bigint): Promise<void> {
    await this.prisma.citizenProfile.delete({ where: { user_id: userId } });
  }
}
