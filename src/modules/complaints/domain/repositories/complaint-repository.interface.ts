import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '@/generated/prisma/enums';
import {
  ComplaintEntity,
  ComplaintWithCitizen,
} from '@complaints/domain/entities/complaint.entity';

export const IComplaintRepository = Symbol('IComplaintRepository');

export type CreateComplaintData = {
  citizen_id: bigint;
  title: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  location?: string | null;
  description: string;
  photo_name?: string | null;
  photo_file_type?: string | null;
  photo_url?: string | null;
  photo_file_id?: string | null;
  photo_file_path?: string | null;
};

export type ComplaintFilters = {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
};

export interface IComplaintRepository {
  create(data: CreateComplaintData): Promise<ComplaintEntity>;
  findByCitizenId(citizenId: bigint): Promise<ComplaintEntity[]>;
  findById(id: bigint): Promise<ComplaintEntity | null>;
  findByIdWithCitizen(id: bigint): Promise<ComplaintWithCitizen | null>;
  findAll(filters?: ComplaintFilters): Promise<ComplaintWithCitizen[]>;
}
