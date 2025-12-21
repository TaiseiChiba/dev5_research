/**
 * ワークフロー管理関連の型定義
 */

import { TransactionStatus } from './transaction.js';

/**
 * ワークフローステップ
 */
export interface WorkflowStep {
  stepId: string;
  transactionId: string;
  fromStatus: TransactionStatus;
  toStatus: TransactionStatus;
  performedBy: string;
  performedAt: Date;
  comments?: string;
}

/**
 * ワークフロー状態遷移ルール
 */
export interface WorkflowTransitionRule {
  fromStatus: TransactionStatus;
  toStatus: TransactionStatus;
  requiredRole?: string;
  preventSelfApproval?: boolean;
}

/**
 * ワークフロー検証結果
 */
export interface WorkflowValidationResult {
  isValid: boolean;
  errorMessage?: string;
  requiredRole?: string;
}
