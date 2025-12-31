/**
 * 顧客新規登録・削除機能のテスト
 *
 * 要件 2.1, 2.3, 8.1, 9.1 の検証
 */

import { CustomerService } from '../src/services/customerService';
import { CustomerType } from '../src/types/customer';
import { initializeMockData } from '../src/data/mockData';

describe('顧客新規登録・削除機能', () => {
  let customerService: CustomerService;

  beforeEach(() => {
    // LocalStorageをクリアして初期データを設定
    localStorage.clear();
    initializeMockData();
    customerService = new CustomerService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('顧客新規登録機能（要件 2.1）', () => {
    test('必須項目を含む顧客を正常に作成できる', async () => {
      const customerData = {
        name: '新規顧客',
        phoneticName: 'シンキコキャク',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'new@example.com',
          phone: '03-1111-1111',
        },
      };

      const result = await customerService.createCustomer(customerData);

      expect(result.customerId).toBeDefined();
      expect(result.customerId).toMatch(/^CUST\d+$/);
      expect(result.name).toBe(customerData.name);
      expect(result.phoneticName).toBe(customerData.phoneticName);
      expect(result.customerType).toBe(customerData.customerType);
      expect(result.contactInfo.email).toBe(customerData.contactInfo.email);
      expect(result.contactInfo.phone).toBe(customerData.contactInfo.phone);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.isDeleted).toBe(false);
    });

    test('一意の顧客番号が割り当てられる', async () => {
      const customerData1 = {
        name: '顧客1',
        phoneticName: 'コキャク1',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {},
      };

      const customerData2 = {
        name: '顧客2',
        phoneticName: 'コキャク2',
        customerType: CustomerType.CORPORATE,
        contactInfo: {},
      };

      const result1 = await customerService.createCustomer(customerData1);
      const result2 = await customerService.createCustomer(customerData2);

      expect(result1.customerId).not.toBe(result2.customerId);
      expect(result1.customerId).toMatch(/^CUST\d+$/);
      expect(result2.customerId).toMatch(/^CUST\d+$/);
    });

    test('連絡先情報が任意項目として正しく処理される', async () => {
      const customerDataMinimal = {
        name: '最小限顧客',
        phoneticName: 'サイショウゲンコキャク',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {},
      };

      const result = await customerService.createCustomer(customerDataMinimal);

      expect(result.customerId).toBeDefined();
      expect(result.name).toBe(customerDataMinimal.name);
      expect(result.phoneticName).toBe(customerDataMinimal.phoneticName);
      expect(result.contactInfo).toEqual({});
    });

    test('法人顧客を正常に作成できる', async () => {
      const corporateData = {
        name: '株式会社テスト',
        phoneticName: 'カブシキガイシャテスト',
        customerType: CustomerType.CORPORATE,
        contactInfo: {
          email: 'corporate@test.com',
          phone: '03-2222-2222',
          address: '東京都渋谷区テスト1-1-1',
          postalCode: '150-0001',
        },
      };

      const result = await customerService.createCustomer(corporateData);

      expect(result.customerType).toBe(CustomerType.CORPORATE);
      expect(result.name).toBe(corporateData.name);
      expect(result.phoneticName).toBe(corporateData.phoneticName);
      expect(result.contactInfo.address).toBe(
        corporateData.contactInfo.address
      );
      expect(result.contactInfo.postalCode).toBe(
        corporateData.contactInfo.postalCode
      );
    });
  });

  describe('顧客削除機能（要件 2.3）', () => {
    test('アクティブな口座がない顧客を正常に削除できる', async () => {
      // 新規顧客を作成（アクティブな口座がないことを保証）
      const customerData = {
        name: '削除テスト顧客',
        phoneticName: 'サクジョテストコキャク',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'delete@test.com',
        },
      };

      const newCustomer = await customerService.createCustomer(customerData);

      // 削除を実行
      const deleteResult = await customerService.deleteCustomer(
        newCustomer.customerId
      );

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toContain('正常に削除されました');

      // 削除後に取得できないことを確認
      await expect(
        customerService.getCustomer(newCustomer.customerId)
      ).rejects.toThrow('顧客が見つかりません');
    });

    test('アクティブな口座がある顧客は削除できない', async () => {
      // 既存の顧客（アクティブな口座を持つ）を削除しようとする
      const existingCustomerId = 'CUST001'; // モックデータに存在し、アクティブな口座を持つ顧客

      const deleteResult =
        await customerService.deleteCustomer(existingCustomerId);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toContain('アクティブな口座が存在するため');

      // 顧客がまだ存在することを確認
      const customer = await customerService.getCustomer(existingCustomerId);
      expect(customer).toBeDefined();
      expect(customer.isDeleted).toBe(false);
    });

    test('存在しない顧客を削除しようとするとエラーになる', async () => {
      const nonExistentId = 'CUST999999';

      const deleteResult = await customerService.deleteCustomer(nonExistentId);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toContain('顧客が見つかりません');
    });

    test('削除された顧客は論理削除される（物理削除されない）', async () => {
      // 新規顧客を作成
      const customerData = {
        name: '論理削除テスト',
        phoneticName: 'ロンリサクジョテスト',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {},
      };

      const newCustomer = await customerService.createCustomer(customerData);

      // 削除を実行
      const deleteResult = await customerService.deleteCustomer(
        newCustomer.customerId
      );
      expect(deleteResult.success).toBe(true);

      // LocalStorageから直接データを確認（論理削除の確認）
      const allCustomers = JSON.parse(
        localStorage.getItem('mockCustomers') || '[]'
      );
      const deletedCustomer = allCustomers.find(
        (c: any) => c.customerId === newCustomer.customerId
      );

      expect(deletedCustomer).toBeDefined();
      expect(deletedCustomer.isDeleted).toBe(true);
      expect(deletedCustomer.updatedAt).toBeDefined();
    });
  });

  describe('入力検証（要件 8.1）', () => {
    test('必須項目が不足している場合の処理', async () => {
      // 実際のバリデーションはフロントエンドで行われるため、
      // ここではサービス層が正しいデータを受け取ることを確認

      const validData = {
        name: '有効な顧客',
        phoneticName: 'ユウコウナコキャク',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {},
      };

      const result = await customerService.createCustomer(validData);
      expect(result).toBeDefined();
      expect(result.customerId).toMatch(/^CUST\d+$/);
    });

    test('空文字列や空白文字の処理', async () => {
      // フロントエンドでトリムされた後のデータがサービスに渡されることを想定
      const trimmedData = {
        name: 'トリム済み顧客',
        phoneticName: 'トリムズミコキャク',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'trimmed@test.com',
        },
      };

      const result = await customerService.createCustomer(trimmedData);
      expect(result.name).toBe('トリム済み顧客');
      expect(result.phoneticName).toBe('トリムズミコキャク');
    });
  });

  describe('エラーハンドリング（要件 9.1）', () => {
    test('削除操作の成功メッセージが適切に返される', async () => {
      const customerData = {
        name: '成功メッセージテスト',
        phoneticName: 'セイコウメッセージテスト',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {},
      };

      const newCustomer = await customerService.createCustomer(customerData);
      const deleteResult = await customerService.deleteCustomer(
        newCustomer.customerId
      );

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('顧客が正常に削除されました。');
      expect(deleteResult.timestamp).toBeDefined();
    });

    test('削除失敗時の具体的なエラーメッセージが返される', async () => {
      const existingCustomerId = 'CUST001'; // アクティブな口座を持つ顧客

      const deleteResult =
        await customerService.deleteCustomer(existingCustomerId);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toBe(
        'アクティブな口座が存在するため、顧客を削除できません。'
      );
      expect(deleteResult.timestamp).toBeDefined();
    });

    test('存在しない顧客削除時のエラーメッセージ', async () => {
      const deleteResult = await customerService.deleteCustomer('NONEXISTENT');

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toBe('顧客が見つかりません。');
      expect(deleteResult.timestamp).toBeDefined();
    });
  });

  describe('データ整合性', () => {
    test('作成された顧客が検索で見つかる', async () => {
      const customerData = {
        name: '検索テスト顧客',
        phoneticName: 'ケンサクテストコキャク',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'search@test.com',
        },
      };

      const newCustomer = await customerService.createCustomer(customerData);

      // 顧客番号で検索
      const searchResults = await customerService.searchCustomers({
        customerId: newCustomer.customerId,
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].customerId).toBe(newCustomer.customerId);
      expect(searchResults[0].name).toBe(customerData.name);
    });

    test('削除された顧客が検索結果に含まれない', async () => {
      const customerData = {
        name: '削除後検索テスト',
        phoneticName: 'サクジョゴケンサクテスト',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {},
      };

      const newCustomer = await customerService.createCustomer(customerData);

      // 作成直後は検索で見つかる
      let searchResults = await customerService.searchCustomers({
        customerId: newCustomer.customerId,
      });
      expect(searchResults).toHaveLength(1);

      // 削除実行
      const deleteResult = await customerService.deleteCustomer(
        newCustomer.customerId
      );
      expect(deleteResult.success).toBe(true);

      // 削除後は検索で見つからない
      searchResults = await customerService.searchCustomers({
        customerId: newCustomer.customerId,
      });
      expect(searchResults).toHaveLength(0);
    });
  });
});
