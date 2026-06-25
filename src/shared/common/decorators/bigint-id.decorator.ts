import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

function toBigInt(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return value;
  return BigInt(value as string | number | bigint);
}

/** Accepts a numeric string in JSON, then transforms to bigint for Prisma. */
export function BigIntId() {
  return applyDecorators(
    IsNotEmpty(),
    Transform(({ value }) => toBigInt(value)),
  );
}

/** Optional variant for partial-update DTOs. */
export function BigIntIdOptional() {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => toBigInt(value)),
  );
}
