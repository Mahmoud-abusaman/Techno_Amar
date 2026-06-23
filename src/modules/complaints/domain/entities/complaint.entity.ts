import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '@/generated/prisma/enums';

export class ComplaintEntity {
  id: bigint;
  citizen_id: bigint;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  location: string | null;
  description: string;
  photo_name: string | null;
  photo_file_type: string | null;
  photo_url: string | null;
  photo_file_id: string | null;
  photo_file_path: string | null;
  status: ComplaintStatus;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export type ComplaintCitizenSummary = {
  full_name: string;
  national_id: string | null;
  phone: string | null;
};

export type ComplaintWithCitizen = ComplaintEntity & {
  citizen: ComplaintCitizenSummary;
};
