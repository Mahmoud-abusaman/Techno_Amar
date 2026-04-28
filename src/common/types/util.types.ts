export interface ApiErrorResponse {
  timestamp: string;
  success: false;
  statusCode: number;
  path: string;
  message: string;
  fields?: { field: string; message: string }[];
}

export interface UnifiedApiResponse<T> {
  success: true;
  statusCode: number;
  path: string;
  timestamp: string;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
