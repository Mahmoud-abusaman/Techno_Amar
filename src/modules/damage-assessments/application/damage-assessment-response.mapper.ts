import { DamageAssessmentEntity } from '@damage-assessments/domain/entities/damage-assessment.entity';
import type { DamageAssessmentWithCitizen } from '@damage-assessments/domain/entities/damage-assessment.entity';

export type PublicDamageAssessment = {
  id: string;
  citizen_id: string;
  location: string;
  description: string;
  damage_severity: string;
  status: string;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type AdminDamageAssessment = PublicDamageAssessment & {
  citizen: {
    full_name: string;
    national_id: string | null;
    phone: string | null;
  };
};

export type DamageAssessmentSubmissionStatus = {
  has_submitted: boolean;
  assessment_id?: string;
};

export function toPublicDamageAssessment(
  assessment: DamageAssessmentEntity,
): PublicDamageAssessment {
  return {
    id: assessment.id.toString(),
    citizen_id: assessment.citizen_id.toString(),
    location: assessment.location,
    description: assessment.description,
    damage_severity: assessment.damage_severity,
    status: assessment.status,
    submitted_at: assessment.submitted_at,
    created_at: assessment.created_at,
    updated_at: assessment.updated_at,
  };
}

export function toAdminDamageAssessment(
  assessment: DamageAssessmentWithCitizen,
): AdminDamageAssessment {
  return {
    ...toPublicDamageAssessment(assessment),
    citizen: assessment.citizen,
  };
}
