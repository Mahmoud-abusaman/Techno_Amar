import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';
import {
  DamageAssessmentEntity,
  DamageAssessmentWithCitizen,
} from '@damage-assessments/domain/entities/damage-assessment.entity';

export const IDamageAssessmentRepository = Symbol('IDamageAssessmentRepository');

export type CreateDamageAssessmentData = {
  citizen_id: bigint;
  location: string;
  description: string;
  damage_severity: DamageSeverity;
};

export type DamageAssessmentFilters = {
  status?: DamageAssessmentStatus;
  damage_severity?: DamageSeverity;
  location?: string;
};

export interface IDamageAssessmentRepository {
  create(data: CreateDamageAssessmentData): Promise<DamageAssessmentEntity>;
  findByCitizenId(citizenId: bigint): Promise<DamageAssessmentEntity | null>;
  findById(id: bigint): Promise<DamageAssessmentEntity | null>;
  findByIdWithCitizen(
    id: bigint,
  ): Promise<DamageAssessmentWithCitizen | null>;
  findAll(
    filters?: DamageAssessmentFilters,
  ): Promise<DamageAssessmentWithCitizen[]>;
}
