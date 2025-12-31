/**
 * ルーティング関連の型定義
 */

import { UserRole } from './auth.js';

/**
 * ルートパラメータの型定義
 */
export interface RouteParams {
  customerId?: string;
  accountId?: string;
  transactionId?: string;
}

/**
 * ナビゲーション項目の型定義
 */
export interface NavigationItem {
  path: string;
  label: string;
  icon?: React.ComponentType;
  children?: NavigationItem[];
  requiredRole?: UserRole;
  adminOnly?: boolean;
}

/**
 * パンくずナビゲーション項目の型定義
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

/**
 * ルート設定の型定義
 */
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  adminOnly?: boolean;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * 認証ガードのプロパティ型定義
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  redirectTo?: string;
}

/**
 * ナビゲーションコンテキストの型定義
 */
export interface NavigationContextType {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  navigate: (path: string) => void;
  goBack: () => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
}
