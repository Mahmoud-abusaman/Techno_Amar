import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { UnifiedApiResponse } from '../types/util.types';

export function ApiResponseDto<T>(DataDto: Type<T>): Type<UnifiedApiResponse<T>> {
  class ApiResponseDtoClass implements UnifiedApiResponse<T> {
    @ApiProperty({ example: true })                        success: true;
    @ApiProperty({ example: 200 })                         statusCode: number;
    @ApiProperty({ example: '/resource' })                 path: string;
    @ApiProperty({ example: '2026-05-16T10:00:00.000Z' }) timestamp: string;
    @ApiProperty({ example: 'Success' })                   message: string;
    @ApiProperty({ type: () => DataDto })                  data: T;
  }
  return ApiResponseDtoClass as Type<UnifiedApiResponse<T>>;
}
