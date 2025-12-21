/**
 * 口座管理関連の型定義
 */

import { BaseSearchCriteria } from './common.js';

/**
 * 口座タイプ
 */
export enum AccountType {
  SAVINGS = 'savings',
  CHECKING = 'checking',
  FIXED_DEPOSIT = 'fixed_deposit',
  LOAN = 'loan',
}

/**
 * 口座状態
 */
export enum AccountStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

/**
 * 口座情報
 */
export interface Account {
  accountId: string;
  customerId: string;
  accountNumber: string;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 口座データ（作成・更新用）
 */
export interface AccountData {
  customerId: string;
  accountType: AccountType;
  initialBalance?: number;
}

/**
 * 口座残高情報
 */
export interface AccountBalance {
  accountId: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  lastUpdated: Date;
}

/**
 * 口座検索条件
 */
export interface AccountSearchCriteria extends BaseSearchCriteria {
  accountId?: string;
  customerId?: string;
  accountNumber?: string;
  accountType?: AccountType;
  status?: AccountStatus;
}
