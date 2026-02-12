/**
 * 取引履歴一覧画面のテスト
 *
 * 要件: 7.1, 7.3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TransactionService } from '../src/services/transaction/transactionService.js';
import {
  TransactionType,
  TransactionStatus,
} from '../src/types/transaction.js';

describe('取引履歴一覧機能（タスク 10.1）', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  describe('完了取引の一覧表示（要件 7.1）', () => {
    test('確定済み取引のみが取得される', async () => {
      // テスト用の取引データを作成
      const confirmedTransaction = await transactionService.createTransaction(
        {
          type: TransactionType.TRANSFER,
          sourceAccountId: 'ACC001',
          destinationAccountId: 'ACC002',
          amount: 50000,
          description: '確定済み取引テスト',
        },
        'staff001'
      );

      // 取引を確定状態にする（実際のワークフローをシミュレート）
      await transactionService.verifyTransaction(
        confirmedTransaction.transactionId,
        {
          action: 'approve',
          verifiedBy: 'staff002',
        }
      );

      const confirmResult = await transactionService.confirmTransaction(
        confirmedTransaction.transactionId,
        'admin001'
      );

      expect(confirmResult.success).toBe(true);

      // 取引履歴を取得
      const historyResult =
        await transactionService.getTransactionHistoryPaginated(
          { status: TransactionStatus.CONFIRMED },
          { page: 1, limit: 20 }
        );

      expect(historyResult.data.length).toBeGreaterThan(0);
      expect(
        historyResult.data.every(t => t.status === TransactionStatus.CONFIRMED)
      ).toBe(true);
    });

    test('取引履歴が存在しない場合は空の配列が返される', async () => {
      // 存在しない条件で検索
      const historyResult =
        await transactionService.getTransactionHistoryPaginated(
          {
            status: TransactionStatus.CONFIRMED,
            customerId: 'NONEXISTENT_CUSTOMER',
          },
          { page: 1, limit: 20 }
        );

      expect(historyResult.data).toHaveLength(0);
      expect(Array.isArray(historyResult.data)).toBe(true);
      expect(historyResult.total).toBe(0);
    });
  });

  describe('ページネーション機能', () => {
    test('ページネーション情報が正しく返される', async () => {
      const historyResult =
        await transactionService.getTransactionHistoryPaginated(
          { status: TransactionStatus.CONFIRMED },
          { page: 1, limit: 10 }
        );

      expect(historyResult.page).toBe(1);
      expect(historyResult.limit).toBe(10);
      expect(historyResult.total).toBeGreaterThanOrEqual(0);
      expect(historyResult.totalPages).toBeGreaterThanOrEqual(0);
      expect(historyResult.data.length).toBeLessThanOrEqual(10);
    });

    test('異なるページサイズでの取得が正しく動作する', async () => {
      const smallPageResult =
        await transactionService.getTransactionHistoryPaginated(
          { status: TransactionStatus.CONFIRMED },
          { page: 1, limit: 5 }
        );

      const largePageResult =
        await transactionService.getTransactionHistoryPaginated(
          { status: TransactionStatus.CONFIRMED },
          { page: 1, limit: 20 }
        );

      expect(smallPageResult.limit).toBe(5);
      expect(largePageResult.limit).toBe(20);
      expect(smallPageResult.data.length).toBeLessThanOrEqual(5);
      expect(largePageResult.data.length).toBeLessThanOrEqual(20);
    });
  });

  describe('取引詳細の表示（要件 7.3）', () => {
    test('取引詳細が正しく取得できる', async () => {
      // テスト用の取引を作成
      const transaction = await transactionService.createTransaction(
        {
          type: TransactionType.DEPOSIT,
          destinationAccountId: 'ACC001',
          amount: 30000,
          description: '詳細表示テスト用入金',
        },
        'staff001'
      );

      // 取引詳細を取得
      const detail = await transactionService.getTransactionDetail(
        transaction.transactionId
      );

      expect(detail.transactionId).toBe(transaction.transactionId);
      expect(detail.type).toBe(TransactionType.DEPOSIT);
      expect(detail.amount).toBe(30000);
      expect(detail.description).toBe('詳細表示テスト用入金');
      expect(detail.createdBy).toBe('staff001');
      expect(detail.createdAt).toBeInstanceOf(Date);
    });

    test('存在しない取引IDでエラーが発生する', async () => {
      await expect(
        transactionService.getTransactionDetail('NONEXISTENT_TRANSACTION')
      ).rejects.toThrow();
    });
  });

  describe('データ整合性', () => {
    test('取引履歴の日時情報が正しく設定される', async () => {
      const beforeCreate = new Date();

      const transaction = await transactionService.createTransaction(
        {
          type: TransactionType.WITHDRAWAL,
          sourceAccountId: 'ACC001',
          amount: 15000,
          description: '日時テスト用出金',
        },
        'staff001'
      );

      const afterCreate = new Date();

      expect(transaction.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(transaction.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
    });

    test('取引履歴の検索条件が正しく適用される', async () => {
      // 振込取引を作成
      const transferTransaction = await transactionService.createTransaction(
        {
          type: TransactionType.TRANSFER,
          sourceAccountId: 'ACC001',
          destinationAccountId: 'ACC002',
          amount: 25000,
          description: '検索条件テスト用振込',
        },
        'staff001'
      );

      // 振込取引のみを検索
      const transferHistory =
        await transactionService.getTransactionHistoryPaginated(
          { type: TransactionType.TRANSFER },
          { page: 1, limit: 20 }
        );

      // すべての結果が振込取引であることを確認
      expect(
        transferHistory.data.every(t => t.type === TransactionType.TRANSFER)
      ).toBe(true);
    });
  });
});
