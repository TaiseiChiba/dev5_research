/**
 * 取引取消機能のテスト
 *
 * 要件 6.3, 9.1 の実装をテストします。
 */

import { TransactionService } from '../src/services/transaction/transactionService.js';
import {
  TransactionType,
  TransactionStatus,
} from '../src/types/transaction.js';
import {
  setStorageData,
  getStorageData,
} from '../src/services/common/storageService.js';

describe('取引取消機能（タスク 9.2）', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    // テスト用のクリーンな状態を設定
    setStorageData('mockTransactions', []);
    setStorageData('mockAccounts', [
      {
        accountId: 'ACC001',
        customerId: 'CUST001',
        accountNumber: '1234567890',
        accountType: 'savings',
        status: 'active',
        balance: 100000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        accountId: 'ACC002',
        customerId: 'CUST002',
        accountNumber: '0987654321',
        accountType: 'checking',
        status: 'active',
        balance: 50000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ]);

    transactionService = new TransactionService();
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    setStorageData('mockTransactions', []);
    setStorageData('mockAccounts', []);
  });

  describe('当日取引の取消制約（要件 6.3）', () => {
    test('当日確定された取引は取消可能', async () => {
      // 当日確定された取引を作成
      const today = new Date();
      const confirmedTransaction = {
        transactionId: 'TXN001',
        type: TransactionType.TRANSFER,
        sourceAccountId: 'ACC001',
        destinationAccountId: 'ACC002',
        amount: 10000,
        description: '当日取引テスト',
        status: TransactionStatus.CONFIRMED,
        createdBy: 'staff001',
        verifiedBy: 'staff002',
        confirmedBy: 'admin001',
        createdAt: today,
        verifiedAt: today,
        confirmedAt: today,
      };

      setStorageData('mockTransactions', [confirmedTransaction]);

      // 取消実行
      const result = await transactionService.cancelTransaction('TXN001');

      expect(result.success).toBe(true);
      expect(result.message).toBe('取引が正常に取消されました。');

      // 取引状態が取消済みに変更されていることを確認
      const transactions = getStorageData('mockTransactions');
      const cancelledTransaction = transactions.find(
        t => t.transactionId === 'TXN001'
      );
      expect(cancelledTransaction.status).toBe(TransactionStatus.CANCELLED);
    });

    test('過去の日付の取引は取消不可', async () => {
      // 昨日確定された取引を作成
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const pastTransaction = {
        transactionId: 'TXN002',
        type: TransactionType.TRANSFER,
        sourceAccountId: 'ACC001',
        destinationAccountId: 'ACC002',
        amount: 10000,
        description: '過去取引テスト',
        status: TransactionStatus.CONFIRMED,
        createdBy: 'staff001',
        verifiedBy: 'staff002',
        confirmedBy: 'admin001',
        createdAt: yesterday,
        verifiedAt: yesterday,
        confirmedAt: yesterday,
      };

      setStorageData('mockTransactions', [pastTransaction]);

      // 取消実行
      const result = await transactionService.cancelTransaction('TXN002');

      expect(result.success).toBe(false);
      expect(result.message).toBe('当日の取引のみ取消可能です。');

      // 取引状態が変更されていないことを確認
      const transactions = getStorageData('mockTransactions');
      const unchangedTransaction = transactions.find(
        t => t.transactionId === 'TXN002'
      );
      expect(unchangedTransaction.status).toBe(TransactionStatus.CONFIRMED);
    });

    test('存在しない取引の取消はエラー', async () => {
      const result = await transactionService.cancelTransaction('NONEXISTENT');

      expect(result.success).toBe(false);
      expect(result.message).toBe('取引が見つかりません。');
    });
  });

  describe('残高復元機能', () => {
    test('取消時に口座残高が正しく復元される', async () => {
      // 当日確定された振込取引を作成
      const today = new Date();
      const confirmedTransaction = {
        transactionId: 'TXN003',
        type: TransactionType.TRANSFER,
        sourceAccountId: 'ACC001',
        destinationAccountId: 'ACC002',
        amount: 20000,
        description: '残高復元テスト',
        status: TransactionStatus.CONFIRMED,
        createdBy: 'staff001',
        verifiedBy: 'staff002',
        confirmedBy: 'admin001',
        createdAt: today,
        verifiedAt: today,
        confirmedAt: today,
      };

      setStorageData('mockTransactions', [confirmedTransaction]);

      // 確定時の残高変更をシミュレート（振込元から減額、振込先に加算）
      const accounts = getStorageData('mockAccounts');
      accounts[0].balance = 80000; // ACC001: 100000 - 20000
      accounts[1].balance = 70000; // ACC002: 50000 + 20000
      setStorageData('mockAccounts', accounts);

      // 取消実行
      const result = await transactionService.cancelTransaction('TXN003');

      expect(result.success).toBe(true);

      // 残高が元に戻っていることを確認
      const updatedAccounts = getStorageData('mockAccounts');
      const sourceAccount = updatedAccounts.find(a => a.accountId === 'ACC001');
      const destAccount = updatedAccounts.find(a => a.accountId === 'ACC002');

      expect(sourceAccount.balance).toBe(100000); // 元の残高に復元
      expect(destAccount.balance).toBe(50000); // 元の残高に復元
    });
  });

  describe('確認ダイアログ機能（要件 9.1）', () => {
    test('取消対象取引の詳細情報が正しく表示される', async () => {
      // この部分は実際のUIコンポーネントのテストで実装される
      // ここでは取消機能の基本動作のみをテスト
      const today = new Date();
      const transaction = {
        transactionId: 'TXN004',
        type: TransactionType.DEPOSIT,
        destinationAccountId: 'ACC001',
        amount: 5000,
        description: '入金取引テスト',
        status: TransactionStatus.CONFIRMED,
        createdBy: 'staff001',
        verifiedBy: 'staff002',
        confirmedBy: 'admin001',
        createdAt: today,
        verifiedAt: today,
        confirmedAt: today,
      };

      setStorageData('mockTransactions', [transaction]);

      const result = await transactionService.cancelTransaction('TXN004');
      expect(result.success).toBe(true);
    });
  });
});
