import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectUserDto {
  @ApiProperty({ example: 'National ID document is unclear or invalid' })
  @IsString()
  @IsNotEmpty()
  rejection_reason!: string;
}
