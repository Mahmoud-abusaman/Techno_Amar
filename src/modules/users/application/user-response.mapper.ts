import { UserEntity } from '@users/domain/entities/user.entity';
import { CitizenProfileEntity } from '@users/domain/entities/citizen-profile.entity';

export type PublicUser = Omit<UserEntity, 'password_hash'>;

export type PublicUserWithProfile = PublicUser & {
  citizen_profile: CitizenProfileEntity | null;
};

export function toPublicUser(user: UserEntity): PublicUser {
  const { password_hash: _, ...rest } = user;
  return rest;
}

export function toPublicUserWithProfile(
  user: UserEntity & { citizen_profile?: CitizenProfileEntity | null },
): PublicUserWithProfile {
  const { password_hash: _, citizen_profile, ...rest } = user;
  return { ...rest, citizen_profile: citizen_profile ?? null };
}
