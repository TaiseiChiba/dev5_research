/**
 * 取引検証（ダブルチェック）機能のテスト
 * タスク 8.1: 取引確認（ダブルチェック）画面の実装
 * 要件: 5.1, 5.2
 */

import { TransactionService } from '../src/services/transaction/transactionService.js';
import { AccountService } from '../src/services/account/accountService.js';
import { ServiceFactory } from '../src/services/common/serviceFactory.js';
import {
  TransactionType,
  TransactionStatus,
} from '../src/types/transaction.js';
import { AccountType, AccountStatus } from '../src/types/account.js';
import { CustomerType } from '../src/types/customer.js';
import {
  setStorageData,
  removeStorageData,
} from '../src/services/common/storageService.js';

describe('取引検証（ダブルチェック）機能（タスク 8.1）', () => {
  let transactionService: TransactionService;
  let accountService: AccountService;

  beforeEach(() => {
    // ストレージをクリア
    removeStorageData('mockCustomers');
    removeStorageData('mockAccounts');
    removeStorageData('mockTransactions');

    // ServiceFactoryを初期化
    ServiceFactory.getInstance().initialize();
    transactionService = ServiceFactory.getInstance().getTransactionService();
    accountService = ServiceFactory.getInstance().getAccountService();

    // テスト用の顧客データを設定
    const mockCustomers = [
      {
        customerId: 'CUST001',
        name: '田中太郎',
        phoneticName: 'タナカタロウ',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'tanaka@example.com',
          phone: '090-1234-5678',
          address: '東京都渋谷区1-1-1',
          postalCode: '150-0001',
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isDeleted: false,
      },
      {
        customerId: 'CUST002',
        name: '佐藤花子',
        phoneticName: 'サトウハナコ',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'sato@example.com',
          phone: '090-2345-6789',
          address: '東京都新宿区2-2-2',
          postalCode: '160-0001',
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isDeleted: false,
      },
    ];

    // テスト用の口座データを設定
    const mockAccounts = [
      {
        accountId: 'ACC001',
        customerId: 'CUST001',
        accountNumber: '1234567890',
        accountType: AccountType.SAVINGS,
        status: AccountStatus.ACTIVE,
        balance: 100000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        accountId: 'ACC002',
        customerId: 'CUST002',
        accountNumber: '2345678901',
        accountType: AccountType.SAVINGS,
        status: AccountStatus.ACTIVE,
        balance: 50000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    setStorageData('mockCustomers', mockCustomers);
    setStorageData('mockAccounts', mockAccounts);
    setStorageData('mockTransactions', []);

    // AccountService.listAccounts をモック化して localStorage のデータを返すようにする
    jest.spyOn(accountService, 'listAccounts').mockImplementation(async () => {
      return mockAccounts;
    });
  });

  afterEach(() => {
    removeStorageData('mockCustomers');
    removeStorageData('mockAccounts');
    removeStorageData('mockTransactions');
    jest.restoreAllMocks();
  });

  describe('検証待ち取引の一覧表示（要件 5.1）', () => {
    test('検証待ち状態の取引のみが取得される', async () => {
      // 複数の取引を作成（異なる状態）
      const transaction1 = await transactionService.createTransaction(
        {
          type: TransactionType.TRANSFER,
          sourceAccountId: 'ACC001',
          destinationAccountId: 'ACC002',
          amount: 10000,
          description: '振込テスト1',
        },
        'staff001'
      );

      const transaction2 = await transactionService.createTransaction(
        {
          type: TransactionType.DEPOSIT,
          destinationAccountId: 'ACC001',
          amount: 5000,
          description: '入金テスト',
        },
        'staff002'
      );

      // 1つの取引を検証完了状態に変更
      await transactionService.verifyTransaction(transaction1.transactionId, {
        action: 'approve',
        verifiedBy: 'staff003',
      });

      // 検証待ち取引を取得
      const pendingTransactions =
        await transactionService.getTransactionsPendingVerification();

      // 要件 5.1: システムは検証待ちのすべての取引のリストを表示すること
      expect(pendingTransactions).toHaveLength(1);
      expect(pendingTransactions[0].transactionId).toBe(
        transaction2.transactionId
      );
      expect(pendingTransactions[0].status).toBe(
        TransactionStatus.PENDING_VERIFICATION
      );
    });

    test('検証待ち取引が存在しない場合は空の配列が返される', async () => {
      const pendingTransactions =
        await transactionService.getTransactionsPendingVerification();

      expect(pendingTransactions).toHaveLength(0);
      expect(Array.isArray(pendingTransactions)).toBe(true);
    });
  });

  describe('取引詳細の確認表示（要件 5.2）', () => {
    test('取引の完全な詳細情報が取得できる', async () => {
      const transactionData = {
        type: TransactionType.TRANSFER,
        sourceAccountId: 'ACC001',
        destinationAccountId: 'ACC002',
        amount: 25000,
        description: '振込テスト - 詳細確認',
      };

      const transaction = await transactionService.createTransaction(
        transactionData,
        'staff001'
      );

      // 要件 5.2: 取引を確認する際、システムは検証のための完全な取引詳細を表示すること
      expect(transaction.transactionId).toBeDefined();
      expect(transaction.type).toBe(TransactionType.TRANSFER);
      expect(transaction.sourceAccountId).toBe('ACC001');
      expect(transaction.destinationAccountId).toBe('ACC002');
      expect(transaction.amount).toBe(25000);
      expect(transaction.description).toBe('振込テスト - 詳細確認');
      expect(transaction.status).toBe(TransactionStatus.PENDING_VERIFICATION);
      expect(transaction.createdBy).toBe('staff001');
      expect(transaction.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('差し戻し・保留・承認ボタン機能', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await transactionService.createTransaction(
        {
          type: TransactionType.TRANSFER,
          sourceAccountId: 'ACC001',
          destinationAccountId: 'ACC002',
          amount: 15000,
          description: '検証テスト用取引',
        },
        'staff001'
      );
    });

    test('取引を承認できる（要件 5.5）', async () => {
      const result = await transactionService.verifyTransaction(
        testTransaction.transactionId,
        {
          action: 'approve',
          verifiedBy: 'staff002',
        }
      );

      // 要件 5.5: 取引が正しい際、システムは「検証完了」としてマークすることを許可すること
      expect(result.success).toBe(true);
      expect(result.message).toContain('取引検証が完了しました');

      // 取引状態が更新されていることを確認
      const pendingTransactions =
        await transactionService.getTransactionsPendingVerification();
      expect(
        pendingTransactions.find(
          t => t.transactionId === testTransaction.transactionId
        )
      ).toBeUndefined();
    });

    test('取引を差し戻しできる（要件 5.3）', async () => {
      const comments = '金額に誤りがあります';
      const result = await transactionService.verifyTransaction(
        testTransaction.transactionId,
        {
          action: 'return',
          comments,
          verifiedBy: 'staff002',
        }
      );

      // 要件 5.3: 取引にエラーを発見した際、システムはコメント付きで修正のために差し戻すことを許可すること
      expect(result.success).toBe(true);
      expect(result.message).toContain('取引検証が完了しました');
    });

    test('取引を保留にできる（要件 5.4）', async () => {
      const comments = '追加確認が必要です';
      const result = await transactionService.verifyTransaction(
        testTransaction.transactionId,
        {
          action: 'hold',
          comments,
          verifiedBy: 'staff002',
        }
      );

      // 要件 5.4: 取引が追加確認を必要とする際、システムは理由付きで「保留」としてマークすることを許可すること
      expect(result.success).toBe(true);
      expect(result.message).toContain('取引検証が完了しました');
    });

    test('自己検証は防止される（要件 5.6）', async () => {
      const result = await transactionService.verifyTransaction(
        testTransaction.transactionId,
        {
          action: 'approve',
          verifiedBy: 'staff001', // 作成者と同じユーザー
        }
      );

      // 要件 5.6: システムは利用者が自分自身の取引を検証することを防止すること
      expect(result.success).toBe(false);
      expect(result.message).toContain('自分が作成した取引は検証できません');
    });

    test('存在しない取引の検証はエラーになる', async () => {
      const result = await transactionService.verifyTransaction('INVALID_ID', {
        action: 'approve',
        verifiedBy: 'staff002',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('取引が見つかりません');
    });

    test('無効な検証アクションはエラーになる', async () => {
      const result = await transactionService.verifyTransaction(
        testTransaction.transactionId,
        {
          action: 'invalid_action' as any,
          verifiedBy: 'staff002',
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('無効な検証アクションです');
    });
  });

  describe('データ整合性', () => {
    test('検証後の取引状態が正しく更新される', async () => {
      const transaction = await transactionService.createTransaction(
        {
          type: TransactionType.DEPOSIT,
          destinationAccountId: 'ACC001',
          amount: 30000,
          description: '状態更新テスト',
        },
        'staff001'
      );

      // 承認
      await transactionService.verifyTransaction(transaction.transactionId, {
        action: 'approve',
        verifiedBy: 'staff002',
      });

      // 確定準備完了取引に含まれることを確認
      const readyTransactions =
        await transactionService.getTransactionsReadyForConfirmation();
      const updatedTransaction = readyTransactions.find(
        t => t.transactionId === transaction.transactionId
      );

      expect(updatedTransaction).toBeDefined();
      expect(updatedTransaction!.status).toBe(
        TransactionStatus.VERIFICATION_COMPLETE
      );
      expect(updatedTransaction!.verifiedBy).toBe('staff002');
      expect(updatedTransaction!.verifiedAt).toBeInstanceOf(Date);
    });

    test('検証時のタイムスタンプが正しく記録される', async () => {
      const transaction = await transactionService.createTransaction(
        {
          type: TransactionType.WITHDRAWAL,
          sourceAccountId: 'ACC001',
          amount: 20000,
          description: 'タイムスタンプテスト',
        },
        'staff001'
      );

      const beforeVerification = new Date();

      await transactionService.verifyTransaction(transaction.transactionId, {
        action: 'approve',
        verifiedBy: 'staff002',
      });

      const afterVerification = new Date();
      const readyTransactions =
        await transactionService.getTransactionsReadyForConfirmation();
      const verifiedTransaction = readyTransactions.find(
        t => t.transactionId === transaction.transactionId
      );

      expect(verifiedTransaction!.verifiedAt).toBeInstanceOf(Date);
      expect(verifiedTransaction!.verifiedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeVerification.getTime()
      );
      expect(verifiedTransaction!.verifiedAt!.getTime()).toBeLessThanOrEqual(
        afterVerification.getTime()
      );
    });
  });
});
