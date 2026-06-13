export class CitizenProfileEntity {
  id: bigint;
  user_id: bigint;
  date_of_birth: Date | null;
  verification_document: string | null;
  rejection_reason: string | null;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
