/**
 * 口座開設・解約機能のテスト
 *
 * 要件: 3.1, 3.3, 8.1, 9.1
 */

import { AccountService } from '../src/services/account/accountService.js';
import { CustomerService } from '../src/services/customer/customerService.js';
import { AccountType, AccountStatus } from '../src/types/account.js';
import { CustomerType } from '../src/types/customer.js';

describe('口座開設・解約機能（タスク 5.3）', () => {
  let accountService: AccountService;
  let customerService: CustomerService;
  let testCustomerId: string;

  beforeEach(async () => {
    accountService = new AccountService();
    customerService = new CustomerService();

    // テスト用顧客を作成
    const customerData = {
      name: 'テスト顧客',
      phoneticName: 'テストコキャク',
      customerType: CustomerType.INDIVIDUAL,
      contactInfo: {
        email: 'test@example.com',
        phone: '090-1234-5678',
        address: '東京都渋谷区',
        postalCode: '150-0001',
      },
    };

    const customer = await customerService.createCustomer(customerData);
    testCustomerId = customer.customerId;
  });

  describe('口座開設機能（要件 3.1）', () => {
    test('顧客選択必須で口座を正常に開設できる', async () => {
      const accountData = {
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: 10000,
      };

      const result = await accountService.openAccount(accountData);

      // 要件 3.1: 新規口座を開設する際、システムは顧客選択を必須とし、一意の口座番号を割り当てること
      expect(result.customerId).toBe(testCustomerId);
      expect(result.accountType).toBe(AccountType.SAVINGS);
      expect(result.balance).toBe(10000);
      expect(result.accountNumber).toMatch(/^\d+-\d+-\d+$/); // 口座番号形式チェック
      expect(result.accountId).toMatch(/^ACC\d+$/); // 口座ID形式チェック
      expect(result.status).toBe(AccountStatus.ACTIVE);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    test('顧客IDが未指定の場合はエラーになる', async () => {
      const accountData = {
        customerId: '',
        accountType: AccountType.SAVINGS,
        initialBalance: 0,
      };

      // 要件 8.1: 必須フィールドが空の際、システムはフォーム送信を防止し、不足フィールドをハイライトすること
      await expect(accountService.openAccount(accountData)).rejects.toThrow();
    });

    test('存在しない顧客IDの場合はエラーになる', async () => {
      const accountData = {
        customerId: 'NONEXISTENT',
        accountType: AccountType.SAVINGS,
        initialBalance: 0,
      };

      await expect(accountService.openAccount(accountData)).rejects.toThrow();
    });

    test('初期残高が負の値の場合はエラーになる', async () => {
      const accountData = {
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: -1000,
      };

      await expect(accountService.openAccount(accountData)).rejects.toThrow();
    });

    test('複数の口座種別で開設できる', async () => {
      const accountTypes = [
        AccountType.SAVINGS,
        AccountType.CHECKING,
        AccountType.FIXED_DEPOSIT,
      ];

      for (const accountType of accountTypes) {
        const accountData = {
          customerId: testCustomerId,
          accountType: accountType,
          initialBalance: 5000,
        };

        const result = await accountService.openAccount(accountData);
        expect(result.accountType).toBe(accountType);
        expect(result.customerId).toBe(testCustomerId);
      }
    });
  });

  describe('口座解約機能（要件 3.3）', () => {
    let testAccountId: string;

    beforeEach(async () => {
      // テスト用口座を作成
      const accountData = {
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: 0, // 残高ゼロで作成
      };

      const account = await accountService.openAccount(accountData);
      testAccountId = account.accountId;
    });

    test('残高がゼロの口座を正常に解約できる', async () => {
      // 要件 3.3: 口座を解約する際、システムは残高がゼロであることを確認し、口座を解約済みとしてマークすること
      const result = await accountService.closeAccount(testAccountId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('正常に解約されました');
      expect(result.timestamp).toBeDefined();

      // 解約後の口座状態を確認
      const closedAccount = await accountService.getAccount(testAccountId);
      expect(closedAccount.status).toBe(AccountStatus.CLOSED);
    });

    test('残高がゼロでない口座は解約できない', async () => {
      // 残高がある口座を作成
      const accountWithBalance = await accountService.openAccount({
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: 1000,
      });

      const result = await accountService.closeAccount(
        accountWithBalance.accountId
      );

      // 要件 3.3: 残高制約の検証
      expect(result.success).toBe(false);
      expect(result.message).toContain('残高がゼロでないため');

      // 口座状態が変更されていないことを確認
      const account = await accountService.getAccount(
        accountWithBalance.accountId
      );
      expect(account.status).toBe(AccountStatus.ACTIVE);
    });

    test('存在しない口座を解約しようとするとエラーになる', async () => {
      const result = await accountService.closeAccount('NONEXISTENT');

      expect(result.success).toBe(false);
      expect(result.message).toContain('口座が見つかりません');
    });

    test('既に解約済みの口座を再度解約しようとするとエラーになる', async () => {
      // 最初の解約
      const firstResult = await accountService.closeAccount(testAccountId);
      expect(firstResult.success).toBe(true);

      // 二度目の解約試行
      const secondResult = await accountService.closeAccount(testAccountId);
      expect(secondResult.success).toBe(false);
    });
  });

  describe('入力検証とエラー制御（要件 8.1）', () => {
    test('必須項目の検証が正しく動作する', async () => {
      // 顧客IDなし
      await expect(
        accountService.openAccount({
          customerId: '',
          accountType: AccountType.SAVINGS,
          initialBalance: 0,
        })
      ).rejects.toThrow();

      // 口座種別なし
      await expect(
        accountService.openAccount({
          customerId: testCustomerId,
          accountType: '' as any,
          initialBalance: 0,
        })
      ).rejects.toThrow();
    });

    test('数値形式の検証が正しく動作する', async () => {
      // 初期残高が数値でない場合
      await expect(
        accountService.openAccount({
          customerId: testCustomerId,
          accountType: AccountType.SAVINGS,
          initialBalance: NaN,
        })
      ).rejects.toThrow();
    });
  });

  describe('ユーザーフィードバックとメッセージング（要件 9.1）', () => {
    test('口座開設成功時に適切なメッセージが返される', async () => {
      const accountData = {
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: 1000,
      };

      const result = await accountService.openAccount(accountData);

      // 要件 9.2: 操作が正常に完了した際、システムは明確な成功メッセージを表示すること
      expect(result).toBeDefined();
      expect(result.accountId).toBeDefined();
      expect(result.accountNumber).toBeDefined();
    });

    test('口座解約成功時に適切なメッセージが返される', async () => {
      const account = await accountService.openAccount({
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: 0,
      });

      const result = await accountService.closeAccount(account.accountId);

      // 要件 9.2: 操作が正常に完了した際、システムは明確な成功メッセージを表示すること
      expect(result.success).toBe(true);
      expect(result.message).toBe('口座が正常に解約されました。');
      expect(result.timestamp).toBeDefined();
    });

    test('エラー時に具体的なエラーメッセージが返される', async () => {
      const result = await accountService.closeAccount('INVALID_ID');

      // 要件 9.3: エラーが発生した際、システムは解決のためのガイダンス付きの具体的なエラーメッセージを表示すること
      expect(result.success).toBe(false);
      expect(result.message).toContain('口座が見つかりません');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('データ整合性', () => {
    test('開設された口座が検索で見つかる', async () => {
      const accountData = {
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: 5000,
      };

      const newAccount = await accountService.openAccount(accountData);

      // 検索で見つかることを確認
      const searchResults = await accountService.searchAccounts({
        customerId: testCustomerId,
      });

      expect(searchResults.length).toBeGreaterThan(0);
      const foundAccount = searchResults.find(
        acc => acc.accountId === newAccount.accountId
      );
      expect(foundAccount).toBeDefined();
      expect(foundAccount?.accountNumber).toBe(newAccount.accountNumber);
    });

    test('解約された口座の状態が正しく更新される', async () => {
      const account = await accountService.openAccount({
        customerId: testCustomerId,
        accountType: AccountType.SAVINGS,
        initialBalance: 0,
      });

      // 解約前の状態確認
      expect(account.status).toBe(AccountStatus.ACTIVE);

      // 解約実行
      const closeResult = await accountService.closeAccount(account.accountId);
      expect(closeResult.success).toBe(true);

      // 解約後の状態確認
      const closedAccount = await accountService.getAccount(account.accountId);
      expect(closedAccount.status).toBe(AccountStatus.CLOSED);
      expect(closedAccount.updatedAt.getTime()).toBeGreaterThan(
        account.updatedAt.getTime()
      );
    });
  });
});
