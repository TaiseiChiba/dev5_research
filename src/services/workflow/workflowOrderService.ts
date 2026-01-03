/**
 * ワークフロー順序制御サービス
 *
 * 取引処理の順序制御と不正な画面遷移の防止を提供します。
 * 要件: 10.3 - 多段階ワークフローを処理する際、システムは入力 → 検証 → 確定の順序を通じて利用者をガイドすること
 */

import { TransactionStatus, Transaction } from '../../types/transaction.js';
import {
  getStorageData,
  reviveDatesInArray,
} from '../common/storageService.js';

/**
 * ワークフロー段階の定義
 */
export enum WorkflowStage {
  INPUT = 'input', // 入力段階
  VERIFICATION = 'verification', // 検証段階
  CONFIRMATION = 'confirmation', // 確定段階
  COMPLETED = 'completed', // 完了段階
}

/**
 * ワークフロー進行状況
 */
export interface WorkflowProgress {
  currentStage: WorkflowStage;
  completedStages: WorkflowStage[];
  nextStage?: WorkflowStage;
  canProceed: boolean;
  blockedReason?: string;
}

/**
 * 画面遷移制御情報
 */
export interface TransitionControl {
  isAllowed: boolean;
  reason?: string;
  suggestedPath?: string;
  requiredStage?: WorkflowStage;
}

/**
 * ワークフロー順序制御サービス
 */
export class WorkflowOrderService {
  /**
   * 取引のワークフロー進行状況を取得
   */
  getWorkflowProgress(transactionId: string): WorkflowProgress {
    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions') || []
    );

    const transaction = transactions.find(
      t => t.transactionId === transactionId
    );

    if (!transaction) {
      return {
        currentStage: WorkflowStage.INPUT,
        completedStages: [],
        canProceed: false,
        blockedReason: '取引が見つかりません',
      };
    }

    return this.getProgressFromStatus(transaction.status);
  }

  /**
   * 取引状態からワークフロー進行状況を判定
   */
  private getProgressFromStatus(status: TransactionStatus): WorkflowProgress {
    switch (status) {
      case TransactionStatus.PENDING_VERIFICATION:
        return {
          currentStage: WorkflowStage.VERIFICATION,
          completedStages: [WorkflowStage.INPUT],
          nextStage: WorkflowStage.CONFIRMATION,
          canProceed: true,
        };

      case TransactionStatus.VERIFICATION_COMPLETE:
        return {
          currentStage: WorkflowStage.CONFIRMATION,
          completedStages: [WorkflowStage.INPUT, WorkflowStage.VERIFICATION],
          nextStage: WorkflowStage.COMPLETED,
          canProceed: true,
        };

      case TransactionStatus.ON_HOLD:
        return {
          currentStage: WorkflowStage.VERIFICATION,
          completedStages: [WorkflowStage.INPUT],
          nextStage: WorkflowStage.CONFIRMATION,
          canProceed: false,
          blockedReason: '取引が保留状態です',
        };

      case TransactionStatus.RETURNED_FOR_CORRECTION:
        return {
          currentStage: WorkflowStage.INPUT,
          completedStages: [],
          nextStage: WorkflowStage.VERIFICATION,
          canProceed: true,
        };

      case TransactionStatus.CONFIRMED:
        return {
          currentStage: WorkflowStage.COMPLETED,
          completedStages: [
            WorkflowStage.INPUT,
            WorkflowStage.VERIFICATION,
            WorkflowStage.CONFIRMATION,
          ],
          canProceed: false,
        };

      case TransactionStatus.CANCELLED:
        return {
          currentStage: WorkflowStage.COMPLETED,
          completedStages: [
            WorkflowStage.INPUT,
            WorkflowStage.VERIFICATION,
            WorkflowStage.CONFIRMATION,
          ],
          canProceed: false,
          blockedReason: '取引が取消されています',
        };

      default:
        return {
          currentStage: WorkflowStage.INPUT,
          completedStages: [],
          nextStage: WorkflowStage.VERIFICATION,
          canProceed: true,
        };
    }
  }

  /**
   * 画面遷移の妥当性をチェック
   */
  validateTransition(
    fromPath: string,
    toPath: string,
    transactionId?: string
  ): TransitionControl {
    // 取引IDが指定されている場合は、ワークフロー順序をチェック
    if (transactionId) {
      return this.validateWorkflowTransition(fromPath, toPath, transactionId);
    }

    // 一般的な画面遷移ルールをチェック
    return this.validateGeneralTransition(fromPath, toPath);
  }

  /**
   * ワークフロー関連の画面遷移をチェック
   */
  private validateWorkflowTransition(
    fromPath: string,
    toPath: string,
    transactionId: string
  ): TransitionControl {
    const progress = this.getWorkflowProgress(transactionId);
    const targetStage = this.getStageFromPath(toPath);

    // 完了済みの段階への遷移は常に許可
    if (progress.completedStages.includes(targetStage)) {
      return { isAllowed: true };
    }

    // 現在の段階への遷移は許可
    if (progress.currentStage === targetStage) {
      return { isAllowed: true };
    }

    // 次の段階への遷移をチェック
    if (progress.nextStage === targetStage && progress.canProceed) {
      return { isAllowed: true };
    }

    // 不正な遷移の場合
    const currentStagePath = this.getPathFromStage(progress.currentStage);
    return {
      isAllowed: false,
      reason:
        progress.blockedReason ||
        `ワークフローの順序に従って処理を進めてください。現在の段階: ${this.getStageLabel(progress.currentStage)}`,
      suggestedPath: currentStagePath,
      requiredStage: progress.currentStage,
    };
  }

  /**
   * 一般的な画面遷移をチェック
   */
  private validateGeneralTransition(
    fromPath: string,
    toPath: string
  ): TransitionControl {
    // 基本的には自由な遷移を許可
    // 特定の制約がある場合はここに追加

    // 例: 確定画面への直接アクセスを制限
    if (
      toPath.includes('/confirmation') &&
      !fromPath.includes('/verification')
    ) {
      return {
        isAllowed: false,
        reason: '確定処理は検証完了後に実行してください',
        suggestedPath: '/transactions/verification',
        requiredStage: WorkflowStage.VERIFICATION,
      };
    }

    return { isAllowed: true };
  }

  /**
   * パスからワークフロー段階を判定
   */
  private getStageFromPath(path: string): WorkflowStage {
    if (path.includes('/input')) {
      return WorkflowStage.INPUT;
    }
    if (path.includes('/verification')) {
      return WorkflowStage.VERIFICATION;
    }
    if (
      path.includes('/confirmation') ||
      path.includes('/final-confirmation')
    ) {
      return WorkflowStage.CONFIRMATION;
    }
    if (path.includes('/history')) {
      return WorkflowStage.COMPLETED;
    }

    return WorkflowStage.INPUT; // デフォルト
  }

  /**
   * ワークフロー段階からパスを取得
   */
  private getPathFromStage(stage: WorkflowStage): string {
    switch (stage) {
      case WorkflowStage.INPUT:
        return '/transactions/input';
      case WorkflowStage.VERIFICATION:
        return '/transactions/verification';
      case WorkflowStage.CONFIRMATION:
        return '/transactions/final-confirmation';
      case WorkflowStage.COMPLETED:
        return '/transactions/history';
      default:
        return '/transactions/input';
    }
  }

  /**
   * ワークフロー段階のラベルを取得
   */
  private getStageLabel(stage: WorkflowStage): string {
    switch (stage) {
      case WorkflowStage.INPUT:
        return '入力';
      case WorkflowStage.VERIFICATION:
        return '検証';
      case WorkflowStage.CONFIRMATION:
        return '確定';
      case WorkflowStage.COMPLETED:
        return '完了';
      default:
        return '不明';
    }
  }

  /**
   * 全体のワークフロー進行状況を取得（統計用）
   */
  getOverallWorkflowStatus(): {
    inputCount: number;
    verificationCount: number;
    confirmationCount: number;
    completedCount: number;
  } {
    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions') || []
    );

    const counts = {
      inputCount: 0,
      verificationCount: 0,
      confirmationCount: 0,
      completedCount: 0,
    };

    transactions.forEach(transaction => {
      const progress = this.getProgressFromStatus(transaction.status);

      switch (progress.currentStage) {
        case WorkflowStage.INPUT:
          counts.inputCount++;
          break;
        case WorkflowStage.VERIFICATION:
          counts.verificationCount++;
          break;
        case WorkflowStage.CONFIRMATION:
          counts.confirmationCount++;
          break;
        case WorkflowStage.COMPLETED:
          counts.completedCount++;
          break;
      }
    });

    return counts;
  }

  /**
   * 次に実行すべきアクションを取得
   */
  getNextAction(transactionId: string): {
    action: string;
    path: string;
    description: string;
  } | null {
    const progress = this.getWorkflowProgress(transactionId);

    if (!progress.canProceed || !progress.nextStage) {
      return null;
    }

    switch (progress.nextStage) {
      case WorkflowStage.VERIFICATION:
        return {
          action: 'verify',
          path: '/transactions/verification',
          description: '取引の検証を実行してください',
        };
      case WorkflowStage.CONFIRMATION:
        return {
          action: 'confirm',
          path: '/transactions/final-confirmation',
          description: '取引の確定を実行してください',
        };
      default:
        return null;
    }
  }
}
