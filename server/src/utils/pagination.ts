import { Request } from 'express';

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip?: number;
  take?: number;
};

export type SortParams = {
  orderBy?: Record<string, 'asc' | 'desc'>;
};

export type ListQueryOptions = {
  defaultPageSize?: number;
  maxPageSize?: number;
  defaultOrderBy?: string;
  defaultOrderDir?: 'asc' | 'desc';
};

export function parsePaginationAndSort(req: Request, options?: ListQueryOptions): PaginationParams & SortParams {
  const defaultPageSize = options?.defaultPageSize ?? 50;
  const maxPageSize = options?.maxPageSize ?? 200;
  const defaultOrderBy = options?.defaultOrderBy;
  const defaultOrderDir = options?.defaultOrderDir ?? 'desc';

  const pageRaw = req.query.page as string | undefined;
  const pageSizeRaw = req.query.page_size as string | undefined;
  const orderByRaw = req.query.order_by as string | undefined;
  const orderDirRaw = (req.query.order_dir as string | undefined)?.toLowerCase() as 'asc' | 'desc' | undefined;

  const page = Math.max(Number.isFinite(Number(pageRaw)) ? Number(pageRaw) : 1, 1);
  const sizeRaw = Number(pageSizeRaw);
  const pageSizeBase = Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : defaultPageSize;
  const pageSize = Math.min(pageSizeBase, maxPageSize);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const orderByField = orderByRaw || defaultOrderBy;
  const orderDir = orderDirRaw === 'asc' || orderDirRaw === 'desc' ? orderDirRaw : defaultOrderDir;

  const sort: SortParams = {};
  if (orderByField) {
    sort.orderBy = { [orderByField]: orderDir };
  }

  return {
    page,
    pageSize,
    skip,
    take,
    ...sort,
  };
}

