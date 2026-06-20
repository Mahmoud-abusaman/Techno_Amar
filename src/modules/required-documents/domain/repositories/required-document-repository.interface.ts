import { RequiredDocumentEntity } from '../entities/required-document.entity';
import { DocumentRequirementType } from '../entities/required-document.entity';

export const IRequiredDocumentRepository = Symbol('IRequiredDocumentRepository');

export type CreateRequiredDocumentData = {
  service_id: bigint;
  name: string;
  description?: string | null;
  type: DocumentRequirementType;
};

export type UpdateRequiredDocumentData = Partial<
  Omit<CreateRequiredDocumentData, 'service_id'>
> & {
  is_active?: boolean;
};

export interface IRequiredDocumentRepository {
  create(data: CreateRequiredDocumentData): Promise<RequiredDocumentEntity>;
  findByService(
    serviceId: bigint,
    activeOnly?: boolean,
  ): Promise<RequiredDocumentEntity[]>;
  findById(id: bigint): Promise<RequiredDocumentEntity | null>;
  findByIdForService(
    id: bigint,
    serviceId: bigint,
  ): Promise<RequiredDocumentEntity | null>;
  update(
    id: bigint,
    data: UpdateRequiredDocumentData,
  ): Promise<RequiredDocumentEntity>;
  delete(id: bigint): Promise<void>;
}
