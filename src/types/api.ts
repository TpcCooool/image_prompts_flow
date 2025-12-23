import { Prompt, Tag } from './index';

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PromptsResponse {
  success: boolean;
  data: Prompt[];
  pagination: PaginationInfo;
}

export interface TagsResponse {
  success: boolean;
  data: Tag[];
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}

export type ErrorResponse = ApiErrorResponse;
