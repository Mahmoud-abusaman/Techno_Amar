import { SectionEntity } from '../entities/section.entity';

export const ISectionRepository = Symbol('ISectionRepository');

export type CreateSectionData = {
  department_id: bigint;
  name: string;
  description?: string | null;
};

export type UpdateSectionData = Partial<
  Omit<CreateSectionData, 'department_id'>
> & {
  is_active?: boolean;
};

export interface ISectionRepository {
  create(data: CreateSectionData): Promise<SectionEntity>;
  findAll(
    departmentId?: bigint,
    activeOnly?: boolean,
  ): Promise<SectionEntity[]>;
  findById(id: bigint): Promise<SectionEntity | null>;
  findByNameInDepartment(
    name: string,
    departmentId: bigint,
  ): Promise<SectionEntity | null>;
  update(id: bigint, data: UpdateSectionData): Promise<SectionEntity>;
  delete(id: bigint): Promise<void>;
}
