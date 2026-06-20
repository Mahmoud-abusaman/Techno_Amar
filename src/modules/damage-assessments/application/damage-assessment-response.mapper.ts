import {
  DamageAssessmentDocumentEntity,
  DamageAssessmentEntity,
} from '@damage-assessments/domain/entities/damage-assessment.entity';
import type { DamageAssessmentWithCitizen } from '@damage-assessments/domain/entities/damage-assessment.entity';

export type PublicDamageAssessmentImage = {
  id: string;
  name: string;
  file_type: string;
  file_url: string;
  file_id: string;
  uploaded_at: Date;
};

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
  images: PublicDamageAssessmentImage[];
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

function toPublicDamageAssessmentImage(
  document: DamageAssessmentDocumentEntity,
): PublicDamageAssessmentImage {
  return {
    id: document.id.toString(),
    name: document.name,
    file_type: document.file_type,
    file_url: document.file_url,
    file_id: document.file_id,
    uploaded_at: document.uploaded_at,
  };
}

export function toPublicDamageAssessment(
  assessment: DamageAssessmentEntity & {
    documents?: DamageAssessmentDocumentEntity[];
  },
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
    images: (assessment.documents ?? []).map(toPublicDamageAssessmentImage),
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
