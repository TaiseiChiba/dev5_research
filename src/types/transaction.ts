/**
 * 取引管理関連の型定義
 */

import { BaseSearchCriteria } from './common.js';

/**
 * 取引タイプ
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

/**
 * 取引状態
 */
export enum TransactionStatus {
  PENDING_VERIFICATION = 'pending_verification',
  VERIFICATION_COMPLETE = 'verification_complete',
  ON_HOLD = 'on_hold',
  RETURNED_FOR_CORRECTION = 'returned_for_correction',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

/**
 * 取引情報
 */
export interface Transaction {
  transactionId: string;
  type: TransactionType;
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount: number;
  description: string;
  status: TransactionStatus;
  createdBy: string;
  verifiedBy?: string;
  confirmedBy?: string;
  createdAt: Date;
  verifiedAt?: Date;
  confirmedAt?: Date;
}

/**
 * 取引入力データ
 */
export interface TransactionInput {
  type: TransactionType;
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount: number;
  description: string;
  transactionDate?: Date;
}

/**
 * 取引検証情報
 */
export interface TransactionVerification {
  action: 'approve' | 'hold' | 'return';
  comments?: string;
  verifiedBy: string;
}

/**
 * 取引結果
 */
export interface TransactionResult {
  transactionId: string;
  success: boolean;
  newBalance?: Record<string, number>; // accountId -> new balance
  message?: string;
}

/**
 * 取引検索条件
 */
export interface TransactionSearchCriteria extends BaseSearchCriteria {
  transactionId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  sourceAccountId?: string;
  destinationAccountId?: string;
  customerId?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}
