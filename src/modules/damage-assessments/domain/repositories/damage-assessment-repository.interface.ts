import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';
import {
  DamageAssessmentEntity,
  DamageAssessmentWithCitizen,
  DamageAssessmentWithDocuments,
} from '@damage-assessments/domain/entities/damage-assessment.entity';

export const IDamageAssessmentRepository = Symbol('IDamageAssessmentRepository');

export type CreateDamageAssessmentDocumentData = {
  name: string;
  file_type: string;
  file_url: string;
  file_id: string;
  file_path?: string | null;
};

export type CreateDamageAssessmentData = {
  citizen_id: bigint;
  location: string;
  description: string;
  damage_severity: DamageSeverity;
  documents: CreateDamageAssessmentDocumentData[];
};

export type DamageAssessmentFilters = {
  status?: DamageAssessmentStatus;
  damage_severity?: DamageSeverity;
  location?: string;
};

export interface IDamageAssessmentRepository {
  create(data: CreateDamageAssessmentData): Promise<DamageAssessmentWithDocuments>;
  findByCitizenId(
    citizenId: bigint,
  ): Promise<DamageAssessmentWithDocuments | null>;
  findById(id: bigint): Promise<DamageAssessmentWithDocuments | null>;
  findByIdWithCitizen(
    id: bigint,
  ): Promise<DamageAssessmentWithCitizen | null>;
  findAll(
    filters?: DamageAssessmentFilters,
  ): Promise<DamageAssessmentWithCitizen[]>;
}
