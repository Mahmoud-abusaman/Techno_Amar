import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IDamageAssessmentRepository,
  CreateDamageAssessmentData,
  DamageAssessmentFilters,
} from '@damage-assessments/domain/repositories/damage-assessment-repository.interface';
import {
  DamageAssessmentEntity,
  DamageAssessmentWithCitizen,
} from '@damage-assessments/domain/entities/damage-assessment.entity';

const citizenSelect = {
  full_name: true,
  national_id: true,
  phone: true,
} as const;

@Injectable()
export class PrismaDamageAssessmentRepository
  implements IDamageAssessmentRepository
{
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateDamageAssessmentData): Promise<DamageAssessmentEntity> {
    return this.prisma.damageAssessment.create({
      data,
    }) as Promise<DamageAssessmentEntity>;
  }

  findByCitizenId(citizenId: bigint): Promise<DamageAssessmentEntity | null> {
    return this.prisma.damageAssessment.findUnique({
      where: { citizen_id: citizenId },
    }) as Promise<DamageAssessmentEntity | null>;
  }

  findById(id: bigint): Promise<DamageAssessmentEntity | null> {
    return this.prisma.damageAssessment.findUnique({
      where: { id },
    }) as Promise<DamageAssessmentEntity | null>;
  }

  findByIdWithCitizen(
    id: bigint,
  ): Promise<DamageAssessmentWithCitizen | null> {
    return this.prisma.damageAssessment.findUnique({
      where: { id },
      include: { citizen: { select: citizenSelect } },
    }) as Promise<DamageAssessmentWithCitizen | null>;
  }

  findAll(
    filters: DamageAssessmentFilters = {},
  ): Promise<DamageAssessmentWithCitizen[]> {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.damage_severity) where.damage_severity = filters.damage_severity;
    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    return this.prisma.damageAssessment.findMany({
      where,
      include: { citizen: { select: citizenSelect } },
      orderBy: { submitted_at: 'desc' },
    }) as Promise<DamageAssessmentWithCitizen[]>;
  }
}
