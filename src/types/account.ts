/**
 * 口座管理関連の型定義
 */

import { BaseSearchCriteria } from './common.js';

/**
 * 口座タイプ
 */
export enum AccountType {
  SAVINGS = 'SAVINGS',
  CHECKING = 'CHECKING',
  FIXED_DEPOSIT = 'FIXED_DEPOSIT',
}

/**
 * 口座状態
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
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
 * 顧客情報を含む口座情報（表示用）
 */
export interface AccountWithCustomer extends Account {
  customerName: string;
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
