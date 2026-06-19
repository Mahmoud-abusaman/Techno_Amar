import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectRequestTaskDto {
  @ApiProperty({ example: 'Missing property ownership proof' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejection_reason: string;
}
