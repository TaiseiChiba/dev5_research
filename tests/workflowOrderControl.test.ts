/**
 * ワークフロー順序制御のテスト
 *
 * 要件: 10.3 - 入力→確認→確定の順序強制と不正な画面遷移の防止
 */

import {
  WorkflowOrderService,
  WorkflowStage,
} from '../src/services/workflow/workflowOrderService';
import { TransactionStatus } from '../src/types/transaction';

describe('WorkflowOrderService', () => {
  let workflowService: WorkflowOrderService;

  beforeEach(() => {
    workflowService = new WorkflowOrderService();
    localStorage.clear();
  });

  describe('getProgressFromStatus', () => {
    test('PENDING_VERIFICATION状態では検証段階になる', () => {
      const mockTransactions = [
        {
          transactionId: 'test-transaction',
          status: TransactionStatus.PENDING_VERIFICATION,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test transaction',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const progress = workflowService.getWorkflowProgress('test-transaction');

      expect(progress.currentStage).toBe(WorkflowStage.VERIFICATION);
      expect(progress.completedStages).toContain(WorkflowStage.INPUT);
      expect(progress.nextStage).toBe(WorkflowStage.CONFIRMATION);
      expect(progress.canProceed).toBe(true);
    });

    test('VERIFICATION_COMPLETE状態では確定段階になる', () => {
      const mockTransactions = [
        {
          transactionId: 'test-transaction',
          status: TransactionStatus.VERIFICATION_COMPLETE,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test transaction',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const progress = workflowService.getWorkflowProgress('test-transaction');

      expect(progress.currentStage).toBe(WorkflowStage.CONFIRMATION);
      expect(progress.completedStages).toContain(WorkflowStage.INPUT);
      expect(progress.completedStages).toContain(WorkflowStage.VERIFICATION);
      expect(progress.nextStage).toBe(WorkflowStage.COMPLETED);
      expect(progress.canProceed).toBe(true);
    });

    test('ON_HOLD状態では進行がブロックされる', () => {
      const mockTransactions = [
        {
          transactionId: 'test-transaction',
          status: TransactionStatus.ON_HOLD,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test transaction',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const progress = workflowService.getWorkflowProgress('test-transaction');

      expect(progress.currentStage).toBe(WorkflowStage.VERIFICATION);
      expect(progress.canProceed).toBe(false);
      expect(progress.blockedReason).toBe('取引が保留状態です');
    });
  });

  describe('validateTransition', () => {
    test('適切な順序での遷移は許可される', () => {
      const control = workflowService.validateTransition(
        '/transactions/input',
        '/transactions/verification'
      );

      expect(control.isAllowed).toBe(true);
    });

    test('確定画面への直接アクセスは制限される', () => {
      const control = workflowService.validateTransition(
        '/dashboard',
        '/transactions/confirmation'
      );

      expect(control.isAllowed).toBe(false);
      expect(control.reason).toContain(
        '確定処理は検証完了後に実行してください'
      );
      expect(control.suggestedPath).toBe('/transactions/verification');
    });

    test('取引IDが指定された場合はワークフロー順序をチェックする', () => {
      const mockTransactions = [
        {
          transactionId: 'test-transaction',
          status: TransactionStatus.PENDING_VERIFICATION,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test transaction',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const validControl = workflowService.validateTransition(
        '/transactions/verification',
        '/transactions/final-confirmation',
        'test-transaction'
      );

      expect(validControl.isAllowed).toBe(true);

      const generalControl = workflowService.validateTransition(
        '/dashboard',
        '/transactions/confirmation'
      );

      expect(generalControl.isAllowed).toBe(false);
    });
  });

  describe('getOverallWorkflowStatus', () => {
    test('全体の統計情報を正しく取得する', () => {
      const mockTransactions = [
        {
          transactionId: 'tx1',
          status: TransactionStatus.PENDING_VERIFICATION,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test 1',
        },
        {
          transactionId: 'tx2',
          status: TransactionStatus.VERIFICATION_COMPLETE,
          createdBy: 'user2',
          createdAt: new Date(),
          type: 'deposit',
          amount: 2000,
          description: 'Test 2',
        },
        {
          transactionId: 'tx3',
          status: TransactionStatus.CONFIRMED,
          createdBy: 'user3',
          createdAt: new Date(),
          type: 'withdrawal',
          amount: 3000,
          description: 'Test 3',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const status = workflowService.getOverallWorkflowStatus();

      expect(status.verificationCount).toBe(1);
      expect(status.confirmationCount).toBe(1);
      expect(status.completedCount).toBe(1);
    });
  });

  describe('getNextAction', () => {
    test('検証待ち取引の次のアクションを取得する', () => {
      const mockTransactions = [
        {
          transactionId: 'test-transaction',
          status: TransactionStatus.PENDING_VERIFICATION,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test transaction',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const nextAction = workflowService.getNextAction('test-transaction');

      expect(nextAction).not.toBeNull();
      expect(nextAction?.action).toBe('confirm');
      expect(nextAction?.path).toBe('/transactions/final-confirmation');
      expect(nextAction?.description).toContain('確定を実行してください');
    });

    test('検証完了取引の次のアクションを取得する', () => {
      const mockTransactions = [
        {
          transactionId: 'test-transaction',
          status: TransactionStatus.VERIFICATION_COMPLETE,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test transaction',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const nextAction = workflowService.getNextAction('test-transaction');

      expect(nextAction).toBeNull();
    });

    test('完了済み取引は次のアクションがない', () => {
      const mockTransactions = [
        {
          transactionId: 'test-transaction',
          status: TransactionStatus.CONFIRMED,
          createdBy: 'user1',
          createdAt: new Date(),
          type: 'transfer',
          amount: 1000,
          description: 'Test transaction',
        },
      ];

      localStorage.setItem(
        'mockTransactions',
        JSON.stringify(mockTransactions)
      );

      const nextAction = workflowService.getNextAction('test-transaction');

      expect(nextAction).toBeNull();
    });
  });
});
