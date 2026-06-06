import { DepartmentEntity } from '../entities/department.entity';

export const IDepartmentRepository = Symbol('IDepartmentRepository');

export type CreateDepartmentData = {
  name: string;
  description?: string | null;
};

export type UpdateDepartmentData = Partial<CreateDepartmentData> & {
  is_active?: boolean;
};

export interface IDepartmentRepository {
  create(data: CreateDepartmentData): Promise<DepartmentEntity>;
  findAll(activeOnly?: boolean): Promise<DepartmentEntity[]>;
  findById(id: bigint): Promise<DepartmentEntity | null>;
  findByName(name: string): Promise<DepartmentEntity | null>;
  update(id: bigint, data: UpdateDepartmentData): Promise<DepartmentEntity>;
  delete(id: bigint): Promise<void>;
}
