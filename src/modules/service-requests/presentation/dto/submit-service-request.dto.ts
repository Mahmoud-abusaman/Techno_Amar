import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitServiceRequestDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id: number;
}
