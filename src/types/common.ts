/**
 * 共通型定義
 */

/**
 * ページネーション設定
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * ページネーション結果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 連絡先情報
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
}

/**
 * 検索基準の基底インターフェース
 */
export interface BaseSearchCriteria {
  limit?: number;
  offset?: number;
}

/**
 * API応答の基底インターフェース
 */
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  timestamp: string;
}

/**
 * エラー情報
 */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 操作結果
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  errorInfo?: ErrorInfo;
}
