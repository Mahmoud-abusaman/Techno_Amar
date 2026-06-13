import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';

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

export type DamageAssessmentCitizenSummary = {
  full_name: string;
  national_id: string | null;
  phone: string | null;
};

export type DamageAssessmentWithCitizen = DamageAssessmentEntity & {
  citizen: DamageAssessmentCitizenSummary;
};
