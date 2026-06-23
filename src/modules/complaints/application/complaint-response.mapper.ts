import { ComplaintEntity } from '@complaints/domain/entities/complaint.entity';
import type { ComplaintWithCitizen } from '@complaints/domain/entities/complaint.entity';

export type PublicComplaintPhoto = {
  name: string;
  file_type: string;
  file_url: string;
  file_id: string;
};

export type PublicComplaint = {
  id: string;
  citizen_id: string;
  title: string;
  category: string;
  priority: string;
  location: string | null;
  description: string;
  status: string;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
  photo: PublicComplaintPhoto | null;
};

export type AdminComplaint = PublicComplaint & {
  citizen: {
    full_name: string;
    national_id: string | null;
    phone: string | null;
  };
};

function toPublicComplaintPhoto(
  complaint: ComplaintEntity,
): PublicComplaintPhoto | null {
  if (!complaint.photo_url || !complaint.photo_file_id) {
    return null;
  }

  return {
    name: complaint.photo_name ?? 'photo',
    file_type: complaint.photo_file_type ?? 'image/jpeg',
    file_url: complaint.photo_url,
    file_id: complaint.photo_file_id,
  };
}

export function toPublicComplaint(complaint: ComplaintEntity): PublicComplaint {
  return {
    id: complaint.id.toString(),
    citizen_id: complaint.citizen_id.toString(),
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    location: complaint.location,
    description: complaint.description,
    status: complaint.status,
    submitted_at: complaint.submitted_at,
    created_at: complaint.created_at,
    updated_at: complaint.updated_at,
    photo: toPublicComplaintPhoto(complaint),
  };
}

export function toAdminComplaint(complaint: ComplaintWithCitizen): AdminComplaint {
  return {
    ...toPublicComplaint(complaint),
    citizen: complaint.citizen,
  };
}
