export interface PageRequest {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PageResult<T> {
  items: T[];
  meta: PaginationMeta;
}
