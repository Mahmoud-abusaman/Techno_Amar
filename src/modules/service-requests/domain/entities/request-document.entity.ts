export type RequestDocumentCategory =
  | 'CITIZEN_UPLOADED'
  | 'INTERNAL'
  | 'RESULT';

export class RequestDocumentEntity {
  id: bigint;
  request_id: bigint;
  required_document_id: bigint | null;
  task_id: bigint | null;
  name: string;
  file_type: string;
  file_url: string;
  file_id: string;
  file_path: string | null;
  category: RequestDocumentCategory;
  uploaded_by: bigint;
  uploaded_at: Date;
  created_at: Date;
}
