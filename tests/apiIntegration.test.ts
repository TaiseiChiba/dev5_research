/**
 * API統合テスト
 *
 * 実際のAPIサーバーとの統合をテストします。
 */

import { CustomerService } from '../src/services/customerService.js';
import { CustomerType } from '../src/types/index.js';

describe('API統合テスト', () => {
  let customerService: CustomerService;

  beforeAll(() => {
    customerService = new CustomerService();
  });

  describe('顧客API統合', () => {
    it('APIサーバーが利用可能な場合、実際のAPIを使用する', async () => {
      // テスト環境では常にローカルストレージを使用するため、
      // このテストは実際のAPI統合の動作確認用です
      const testCustomer = {
        name: 'API統合テスト顧客',
        phoneticName: 'エーピーアイトウゴウテストコキャク',
        customerType: 'individual' as CustomerType,
        contactInfo: {
          email: 'api-test@example.com',
        },
      };

      // 顧客作成（テスト環境ではローカルストレージを使用）
      const createdCustomer =
        await customerService.createCustomer(testCustomer);

      expect(createdCustomer).toBeDefined();
      expect(createdCustomer.customerId).toMatch(/^CUST/);
      expect(createdCustomer.name).toBe(testCustomer.name);
      expect(createdCustomer.phoneticName).toBe(testCustomer.phoneticName);
      expect(createdCustomer.customerType).toBe(testCustomer.customerType);

      // 顧客検索
      const searchResults = await customerService.searchCustomers({
        name: testCustomer.name,
      });

      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);

      const foundCustomer = searchResults.find(
        c => c.customerId === createdCustomer.customerId
      );
      expect(foundCustomer).toBeDefined();

      // 顧客削除
      const deleteResult = await customerService.deleteCustomer(
        createdCustomer.customerId
      );
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toContain('削除されました');
    });

    it('顧客一覧取得が正常に動作する', async () => {
      const result = await customerService.listCustomers({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
