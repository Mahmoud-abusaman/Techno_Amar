import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { UnifiedApiResponse, PaginatedResult } from '../types/util.types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  UnifiedApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<UnifiedApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data): UnifiedApiResponse<T> => {
        const statusCode = response.statusCode;
        const isPaginated = this.isPaginationResponse(data);

        return {
          success: true,
          statusCode,
          path: request.url,
          timestamp: new Date().toISOString(),
          message: this.getMessage(statusCode),
          data: isPaginated
            ? this.transform((data as PaginatedResult<T>).data)
            : this.transform(data as T),
          ...(isPaginated && {
            meta: (data as PaginatedResult<T>).meta,
          }),
        } as UnifiedApiResponse<T>;
      }),
    );
  }

  private transform(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item));
    }

    if (typeof data === 'bigint') {
      return data.toString();
    }

    if (typeof data === 'object') {
      // Preserve specialized objects
      if (data instanceof Date || data instanceof Buffer) {
        return data;
      }

      // 1. Check if it's a Prisma Decimal instance
      if (
        data.constructor &&
        (data.constructor.name === 'Decimal' ||
          data.constructor.name === 'Prisma.Decimal')
      ) {
        return Number(data.toString());
      }

      // 2. Structural check for Decimal.js POJO (sign, exponent, digits array)
      if (
        data.s !== undefined &&
        data.e !== undefined &&
        data.d !== undefined &&
        Array.isArray(data.d)
      ) {
        // If it looks like a Decimal but lost its prototype, try to use its toString if valid
        if (
          typeof data.toString === 'function' &&
          data.toString() !== '[object Object]'
        ) {
          const val = data.toString();
          return isNaN(Number(val)) ? data : Number(val);
        }

        // Fallback: If it's a pure POJO with s, e, d but no useful toString,
        // we could try to reconstruct it or return as is if we can't.
        // But usually Prisma objects have a valid toString() if they are instances.
        // If the user is seeing rounded values, it might be due to the previous calculation.
      }

      // Handle plain objects recursive
      const transformed: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          transformed[key] = this.transform(data[key]);
        }
      }
      return transformed;
    }

    return data;
  }

  private isPaginationResponse(data: any): data is PaginatedResult<any> {
    return data && typeof data === 'object' && 'data' in data && 'meta' in data;
  }

  private getMessage(status: number): string {
    const messages = {
      [HttpStatus.OK]: 'Success',
      [HttpStatus.CREATED]: 'Created successfully',
      [HttpStatus.NO_CONTENT]: 'Deleted successfully',
    };
    return messages[status] || 'Operation successful';
  }
}
