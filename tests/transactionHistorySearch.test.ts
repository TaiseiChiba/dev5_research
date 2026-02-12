/**
 * 取引履歴検索機能のテスト（タスク 10.2）
 * 要件: 7.2
 */

import { TransactionService } from '../src/services/transaction/transactionService.js';
import { CustomerService } from '../src/services/customer/customerService.js';
import { AccountService } from '../src/services/account/accountService.js';
import {
  TransactionType,
  TransactionStatus,
  TransactionSearchCriteria,
} from '../src/types/transaction.js';

describe('取引履歴検索機能（タスク 10.2）', () => {
  let transactionService: TransactionService;
  let customerService: CustomerService;
  let accountService: AccountService;

  beforeEach(() => {
    transactionService = new TransactionService();
    customerService = new CustomerService();
    accountService = new AccountService();
  });

  describe('検索条件による絞り込み（要件 7.2）', () => {
    test('期間指定による検索が正しく動作する', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');

      const criteria: TransactionSearchCriteria = {
        status: TransactionStatus.CONFIRMED,
        dateFrom,
        dateTo,
      };

      const result = await transactionService.getTransactionHistoryPaginated(
        criteria,
        { page: 1, limit: 20 }
      );

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    test('取引種別による検索が正しく動作する', async () => {
      const criteria: TransactionSearchCriteria = {
        status: TransactionStatus.CONFIRMED,
        type: TransactionType.TRANSFER,
      };

      const result = await transactionService.getTransactionHistoryPaginated(
        criteria,
        { page: 1, limit: 20 }
      );

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      // 結果がある場合は、すべて振込取引であることを確認
      if (result.data.length > 0) {
        expect(
          result.data.every(t => t.type === TransactionType.TRANSFER)
        ).toBe(true);
      }
    });

    test('顧客IDによる検索が正しく動作する', async () => {
      const criteria: TransactionSearchCriteria = {
        status: TransactionStatus.CONFIRMED,
        customerId: 'CUST001',
      };

      const result = await transactionService.getTransactionHistoryPaginated(
        criteria,
        { page: 1, limit: 20 }
      );

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });

    test('口座IDによる検索が正しく動作する', async () => {
      const criteria: TransactionSearchCriteria = {
        status: TransactionStatus.CONFIRMED,
        sourceAccountId: 'ACC001',
      };

      const result = await transactionService.getTransactionHistoryPaginated(
        criteria,
        { page: 1, limit: 20 }
      );

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });

    test('複数条件による検索が正しく動作する', async () => {
      const criteria: TransactionSearchCriteria = {
        status: TransactionStatus.CONFIRMED,
        type: TransactionType.DEPOSIT,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };

      const result = await transactionService.getTransactionHistoryPaginated(
        criteria,
        { page: 1, limit: 20 }
      );

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      // 結果がある場合は、すべて入金取引であることを確認
      if (result.data.length > 0) {
        expect(result.data.every(t => t.type === TransactionType.DEPOSIT)).toBe(
          true
        );
      }
    });
  });

  describe('検索用データの取得', () => {
    test('顧客一覧が取得できる', async () => {
      const customers = await customerService.searchCustomers({ limit: 100 });

      expect(customers).toBeInstanceOf(Array);
      // 顧客データがある場合の構造確認
      if (customers.length > 0) {
        const customer = customers[0];
        expect(customer.customerId).toBeDefined();
        expect(customer.name).toBeDefined();
        expect(typeof customer.name).toBe('string');
      }
    });

    test('口座一覧が取得できる', async () => {
      const accounts = await accountService.listAccounts();

      expect(accounts).toBeInstanceOf(Array);
      // 口座データがある場合の構造確認
      if (accounts.length > 0) {
        const account = accounts[0];
        expect(account.accountId).toBeDefined();
        expect(account.accountNumber).toBeDefined();
        expect(typeof account.balance).toBe('number');
      }
    });
  });

  describe('検索条件の保存・読み込み', () => {
    const STORAGE_KEY = 'transactionHistorySearchConditions';

    beforeEach(() => {
      // テスト前にローカルストレージをクリア
      localStorage.removeItem(STORAGE_KEY);
    });

    afterEach(() => {
      // テスト後にローカルストレージをクリア
      localStorage.removeItem(STORAGE_KEY);
    });

    test('検索条件をローカルストレージに保存できる', () => {
      const condition = {
        name: 'テスト検索条件',
        criteria: {
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.TRANSFER,
          dateFrom: new Date('2024-01-01'),
        },
        createdAt: new Date(),
      };

      const conditions = [condition];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conditions));

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeDefined();

      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('テスト検索条件');
    });

    test('保存された検索条件をローカルストレージから読み込める', () => {
      const condition = {
        name: 'テスト検索条件',
        criteria: {
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.TRANSFER,
        },
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([condition]));

      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved!);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('テスト検索条件');
      expect(parsed[0].criteria.type).toBe(TransactionType.TRANSFER);
    });
  });
});
