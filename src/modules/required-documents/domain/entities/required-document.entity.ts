export type DocumentRequirementType = 'MANDATORY' | 'OPTIONAL';

export class RequiredDocumentEntity {
  id: bigint;
  service_id: bigint;
  name: string;
  description: string | null;
  type: DocumentRequirementType;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
