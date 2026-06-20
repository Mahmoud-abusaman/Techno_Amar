import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  IRequiredDocumentRepository,
  CreateRequiredDocumentData,
  UpdateRequiredDocumentData,
} from '@required-documents/domain/repositories/required-document-repository.interface';
import { RequiredDocumentEntity } from '@required-documents/domain/entities/required-document.entity';

@Injectable()
export class PrismaRequiredDocumentRepository implements IRequiredDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRequiredDocumentData): Promise<RequiredDocumentEntity> {
    return this.prisma.requiredDocument
      .create({ data })
      .then((row) => this.toEntity(row));
  }

  findByService(
    serviceId: bigint,
    activeOnly = false,
  ): Promise<RequiredDocumentEntity[]> {
    return this.prisma.requiredDocument
      .findMany({
        where: {
          service_id: serviceId,
          ...(activeOnly ? { is_active: true } : {}),
        },
        orderBy: { name: 'asc' },
      })
      .then((rows) => rows.map((row) => this.toEntity(row)));
  }

  findById(id: bigint): Promise<RequiredDocumentEntity | null> {
    return this.prisma.requiredDocument
      .findUnique({ where: { id } })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  findByIdForService(
    id: bigint,
    serviceId: bigint,
  ): Promise<RequiredDocumentEntity | null> {
    return this.prisma.requiredDocument
      .findFirst({ where: { id, service_id: serviceId } })
      .then((row) => (row ? this.toEntity(row) : null));
  }

  update(
    id: bigint,
    data: UpdateRequiredDocumentData,
  ): Promise<RequiredDocumentEntity> {
    return this.prisma.requiredDocument
      .update({ where: { id }, data })
      .then((row) => this.toEntity(row));
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.requiredDocument.update({
      where: { id },
      data: { is_active: false },
    });
  }

  private toEntity(row: {
    id: bigint;
    service_id: bigint;
    name: string;
    description: string | null;
    type: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): RequiredDocumentEntity {
    return {
      id: row.id,
      service_id: row.service_id,
      name: row.name,
      description: row.description,
      type: row.type as RequiredDocumentEntity['type'],
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
