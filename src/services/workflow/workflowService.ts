/**
 * ワークフローサービス
 *
 * 取引ワークフローの状態管理と検証機能を提供します。
 */

import {
  WorkflowStep,
  WorkflowTransitionRule,
  WorkflowValidationResult,
  TransactionStatus,
  Transaction,
  BaseApiResponse,
} from '../../types/index.js';
import {
  getStorageData,
  setStorageData,
  generateId,
  reviveDatesInArray,
} from '../common/storageService.js';

/**
 * API呼び出しをシミュレートする遅延
 */
const API_DELAY = 200;

/**
 * ワークフロー遷移ルール
 */
const WORKFLOW_RULES: WorkflowTransitionRule[] = [
  {
    fromStatus: TransactionStatus.PENDING_VERIFICATION,
    toStatus: TransactionStatus.VERIFICATION_COMPLETE,
    preventSelfApproval: true,
  },
  {
    fromStatus: TransactionStatus.PENDING_VERIFICATION,
    toStatus: TransactionStatus.ON_HOLD,
    preventSelfApproval: true,
  },
  {
    fromStatus: TransactionStatus.PENDING_VERIFICATION,
    toStatus: TransactionStatus.RETURNED_FOR_CORRECTION,
    preventSelfApproval: true,
  },
  {
    fromStatus: TransactionStatus.VERIFICATION_COMPLETE,
    toStatus: TransactionStatus.CONFIRMED,
  },
  {
    fromStatus: TransactionStatus.ON_HOLD,
    toStatus: TransactionStatus.VERIFICATION_COMPLETE,
  },
  {
    fromStatus: TransactionStatus.ON_HOLD,
    toStatus: TransactionStatus.RETURNED_FOR_CORRECTION,
  },
  {
    fromStatus: TransactionStatus.CONFIRMED,
    toStatus: TransactionStatus.CANCELLED,
  },
];

/**
 * ワークフローサービスクラス
 */
export class WorkflowService {
  /**
   * 取引状態遷移の検証
   */
  async validateTransactionTransition(
    transactionId: string,
    newStatus: TransactionStatus,
    userId: string
  ): Promise<boolean> {
    await this.simulateApiDelay();

    try {
      const validation = await this.getTransitionValidation(
        transactionId,
        newStatus,
        userId
      );
      return validation.isValid;
    } catch (error) {
      console.error('Transition validation error:', error);
      return false;
    }
  }

  /**
   * ダブルチェックルールの強制
   */
  async enforceDoubleCheckRule(
    transactionId: string,
    verifyingUserId: string
  ): Promise<boolean> {
    await this.simulateApiDelay();

    try {
      const transactions = reviveDatesInArray(
        getStorageData<Transaction>('mockTransactions')
      );
      const transaction = transactions.find(
        t => t.transactionId === transactionId
      );

      if (!transaction) {
        return false;
      }

      // 自己検証防止
      return transaction.createdBy !== verifyingUserId;
    } catch (error) {
      console.error('Double check rule enforcement error:', error);
      return false;
    }
  }

  /**
   * 状態変更処理
   */
  async processStatusChange(
    transactionId: string,
    newStatus: TransactionStatus,
    userId: string,
    comments?: string
  ): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    try {
      const transactions = reviveDatesInArray(
        getStorageData<Transaction>('mockTransactions')
      );
      const transaction = transactions.find(
        t => t.transactionId === transactionId
      );

      if (!transaction) {
        return {
          success: false,
          message: '取引が見つかりません。',
          timestamp: new Date().toISOString(),
        };
      }

      const validation = await this.getTransitionValidation(
        transactionId,
        newStatus,
        userId
      );

      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || '無効な状態遷移です。',
          timestamp: new Date().toISOString(),
        };
      }

      // ワークフロー履歴を記録
      await this.recordWorkflowStep(
        transactionId,
        transaction.status,
        newStatus,
        userId,
        comments
      );

      return {
        success: true,
        message: '状態変更が正常に処理されました。',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `状態変更処理中にエラーが発生しました: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * ワークフロー履歴取得
   */
  async getWorkflowHistory(transactionId: string): Promise<WorkflowStep[]> {
    await this.simulateApiDelay();

    try {
      const workflowHistory = reviveDatesInArray(
        getStorageData<WorkflowStep>('workflowHistory') || []
      );
      return workflowHistory
        .filter(step => step.transactionId === transactionId)
        .sort(
          (a, b) =>
            new Date(a.performedAt).getTime() -
            new Date(b.performedAt).getTime()
        );
    } catch (error) {
      console.error('Error getting workflow history:', error);
      return [];
    }
  }

  /**
   * 全ワークフロー履歴取得（管理用）
   */
  async getAllWorkflowHistory(): Promise<WorkflowStep[]> {
    await this.simulateApiDelay();

    try {
      const workflowHistory = reviveDatesInArray(
        getStorageData<WorkflowStep>('workflowHistory') || []
      );
      return workflowHistory.sort(
        (a, b) =>
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      );
    } catch (error) {
      console.error('Error getting all workflow history:', error);
      return [];
    }
  }

  /**
   * 遷移検証の詳細取得
   */
  private async getTransitionValidation(
    transactionId: string,
    newStatus: TransactionStatus,
    userId: string
  ): Promise<WorkflowValidationResult> {
    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );
    const transaction = transactions.find(
      t => t.transactionId === transactionId
    );

    if (!transaction) {
      return {
        isValid: false,
        errorMessage: '取引が見つかりません。',
      };
    }

    // 遷移ルールを確認
    const rule = WORKFLOW_RULES.find(
      r => r.fromStatus === transaction.status && r.toStatus === newStatus
    );

    if (!rule) {
      return {
        isValid: false,
        errorMessage: `${transaction.status} から ${newStatus} への遷移は許可されていません。`,
      };
    }

    // 自己承認防止チェック
    if (rule.preventSelfApproval && transaction.createdBy === userId) {
      return {
        isValid: false,
        errorMessage: '自分が作成した取引は承認できません。',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * ワークフローステップの記録
   */
  private async recordWorkflowStep(
    transactionId: string,
    fromStatus: TransactionStatus,
    toStatus: TransactionStatus,
    performedBy: string,
    comments?: string
  ): Promise<void> {
    const workflowHistory = reviveDatesInArray(
      getStorageData<WorkflowStep>('workflowHistory') || []
    );

    const step: WorkflowStep = {
      stepId: generateId('STEP'),
      transactionId,
      fromStatus,
      toStatus,
      performedBy,
      performedAt: new Date(),
      comments,
    };

    workflowHistory.push(step);
    setStorageData('workflowHistory', workflowHistory);
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
