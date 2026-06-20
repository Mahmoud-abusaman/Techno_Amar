import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';

export class DamageAssessmentDocumentEntity {
  id: bigint;
  assessment_id: bigint;
  name: string;
  file_type: string;
  file_url: string;
  file_id: string;
  file_path: string | null;
  uploaded_at: Date;
  created_at: Date;
}

export class DamageAssessmentEntity {
  id: bigint;
  citizen_id: bigint;
  location: string;
  description: string;
  damage_severity: DamageSeverity;
  status: DamageAssessmentStatus;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export type DamageAssessmentWithDocuments = DamageAssessmentEntity & {
  documents: DamageAssessmentDocumentEntity[];
};

export type DamageAssessmentCitizenSummary = {
  full_name: string;
  national_id: string | null;
  phone: string | null;
};

export type DamageAssessmentWithCitizen = DamageAssessmentWithDocuments & {
  citizen: DamageAssessmentCitizenSummary;
};
