import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IComplaintRepository,
  CreateComplaintData,
  ComplaintFilters,
  UpdateComplaintData,
} from '@complaints/domain/repositories/complaint-repository.interface';
import { ComplaintEntity, ComplaintWithCitizen } from '@complaints/domain/entities/complaint.entity';

const citizenSelect = {
  full_name: true,
  national_id: true,
  phone: true,
} as const;

@Injectable()
export class PrismaComplaintRepository implements IComplaintRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateComplaintData): Promise<ComplaintEntity> {
    return this.prisma.complaint.create({
      data: {
        citizen_id: data.citizen_id,
        title: data.title,
        category: data.category,
        priority: data.priority,
        location: data.location ?? null,
        description: data.description,
        photo_name: data.photo_name ?? null,
        photo_file_type: data.photo_file_type ?? null,
        photo_url: data.photo_url ?? null,
        photo_file_id: data.photo_file_id ?? null,
        photo_file_path: data.photo_file_path ?? null,
      },
    }) as Promise<ComplaintEntity>;
  }

  findByCitizenId(citizenId: bigint): Promise<ComplaintEntity[]> {
    return this.prisma.complaint.findMany({
      where: { citizen_id: citizenId },
      orderBy: { submitted_at: 'desc' },
    }) as Promise<ComplaintEntity[]>;
  }

  findById(id: bigint): Promise<ComplaintEntity | null> {
    return this.prisma.complaint.findUnique({
      where: { id },
    }) as Promise<ComplaintEntity | null>;
  }

  findByIdWithCitizen(id: bigint): Promise<ComplaintWithCitizen | null> {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: { citizen: { select: citizenSelect } },
    }) as Promise<ComplaintWithCitizen | null>;
  }

  findAll(filters: ComplaintFilters = {}): Promise<ComplaintWithCitizen[]> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    return this.prisma.complaint.findMany({
      where,
      include: { citizen: { select: citizenSelect } },
      orderBy: { submitted_at: 'desc' },
    }) as Promise<ComplaintWithCitizen[]>;
  }

  async updateComplaint(id: bigint, data: UpdateComplaintData): Promise<ComplaintEntity> {
    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: data.status,
        admin_result: data.adminResult,
      },
    }) as Promise<ComplaintEntity>;
  }
}
