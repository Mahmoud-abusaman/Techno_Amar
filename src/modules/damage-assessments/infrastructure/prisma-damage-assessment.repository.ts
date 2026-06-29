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
  DamageAssessmentWithDocuments,
} from '@damage-assessments/domain/entities/damage-assessment.entity';

const citizenSelect = {
  full_name: true,
  national_id: true,
  phone: true,
} as const;

const documentsInclude = {
  documents: { orderBy: { uploaded_at: 'asc' as const } },
};

@Injectable()
export class PrismaDamageAssessmentRepository implements IDamageAssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: CreateDamageAssessmentData,
  ): Promise<DamageAssessmentWithDocuments> {
    const { documents, ...assessmentData } = data;
    return this.prisma.damageAssessment.create({
      data: {
        ...assessmentData,
        documents: {
          create: documents.map((doc) => ({
            name: doc.name,
            file_type: doc.file_type,
            file_url: doc.file_url,
            file_id: doc.file_id,
            file_path: doc.file_path ?? null,
          })),
        },
      },
      include: documentsInclude,
    }) as Promise<DamageAssessmentWithDocuments>;
  }

  findByCitizenId(
    citizenId: bigint,
  ): Promise<DamageAssessmentWithDocuments | null> {
    return this.prisma.damageAssessment.findUnique({
      where: { citizen_id: citizenId },
      include: documentsInclude,
    }) as Promise<DamageAssessmentWithDocuments | null>;
  }

  findById(id: bigint): Promise<DamageAssessmentWithDocuments | null> {
    return this.prisma.damageAssessment.findUnique({
      where: { id },
      include: documentsInclude,
    }) as Promise<DamageAssessmentWithDocuments | null>;
  }

  findByIdWithCitizen(id: bigint): Promise<DamageAssessmentWithCitizen | null> {
    return this.prisma.damageAssessment.findUnique({
      where: { id },
      include: {
        citizen: { select: citizenSelect },
        ...documentsInclude,
      },
    }) as Promise<DamageAssessmentWithCitizen | null>;
  }

  findAll(
    filters: DamageAssessmentFilters = {},
  ): Promise<DamageAssessmentWithCitizen[]> {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.damage_severity)
      where.damage_severity = filters.damage_severity;
    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    return this.prisma.damageAssessment.findMany({
      where,
      include: {
        citizen: { select: citizenSelect },
        ...documentsInclude,
      },
      orderBy: { submitted_at: 'desc' },
    }) as Promise<DamageAssessmentWithCitizen[]>;
  }
}
