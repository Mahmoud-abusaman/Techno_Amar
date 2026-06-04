import { CitizenProfileEntity } from '../entities/citizen-profile.entity';

export const ICitizenProfileRepository = Symbol('ICitizenProfileRepository');

export type CreateCitizenProfileData = {
  user_id: bigint;
  date_of_birth?: Date | null;
  verification_document?: string | null;
};

export type UpdateCitizenProfileData = Partial<
  Omit<CreateCitizenProfileData, 'user_id'>
> & {
  rejection_reason?: string | null;
  verified_at?: Date | null;
};

export interface ICitizenProfileRepository {
  create(data: CreateCitizenProfileData): Promise<CitizenProfileEntity>;
  findByUserId(userId: bigint): Promise<CitizenProfileEntity | null>;
  update(userId: bigint, data: UpdateCitizenProfileData): Promise<CitizenProfileEntity>;
  delete(userId: bigint): Promise<void>;
}
