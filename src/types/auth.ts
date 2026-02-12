/**
 * 認証・認可関連の型定義
 */

/**
 * ユーザー役割
 */
export enum UserRole {
  GENERAL_STAFF = 'GENERAL_STAFF',
  ADMINISTRATOR = 'ADMINISTRATOR',
}

/**
 * ユーザー情報
 */
export interface User {
  userId: string;
  userRole: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 認証結果
 */
export interface AuthResult {
  success: boolean;
  sessionId?: string;
  userRole?: UserRole;
  errorMessage?: string;
}

/**
 * ユーザーセッション
 */
export interface UserSession {
  sessionId: string;
  userId: string;
  userRole: UserRole;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

/**
 * ログイン要求
 */
export interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * ユーザー切替要求
 */
export interface SwitchUserRequest {
  currentSessionId: string;
  newUserId: string;
  password: string;
}
