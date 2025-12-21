/**
 * 顧客管理機能のテスト
 *
 * 要件 2.4, 2.5 の検証
 */

import { CustomerService } from '../src/services/customerService';
import { CustomerType } from '../src/types/customer';
import { initializeMockData } from '../src/data/mockData';

describe('顧客管理機能', () => {
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

  describe('顧客一覧表示（要件 2.4）', () => {
    test('ページネーション付きで顧客一覧を取得できる', async () => {
      const result = await customerService.listCustomers({
        page: 1,
        limit: 2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    test('2ページ目の顧客一覧を取得できる', async () => {
      const result = await customerService.listCustomers({
        page: 2,
        limit: 2,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });
  });

  describe('顧客検索機能（要件 2.5）', () => {
    test('顧客番号で検索できる', async () => {
      const results = await customerService.searchCustomers({
        customerId: 'CUST001',
      });

      expect(results).toHaveLength(1);
      expect(results[0].customerId).toBe('CUST001');
    });

    test('氏名で検索できる', async () => {
      const results = await customerService.searchCustomers({
        name: '田中',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('田中');
    });

    test('カナで検索できる', async () => {
      const results = await customerService.searchCustomers({
        phoneticName: 'タナカ',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].phoneticName).toContain('タナカ');
    });

    test('個人/法人区分で検索できる', async () => {
      const individualResults = await customerService.searchCustomers({
        customerType: CustomerType.INDIVIDUAL,
      });

      const corporateResults = await customerService.searchCustomers({
        customerType: CustomerType.CORPORATE,
      });

      expect(individualResults.length).toBeGreaterThan(0);
      expect(corporateResults.length).toBeGreaterThan(0);

      individualResults.forEach(customer => {
        expect(customer.customerType).toBe(CustomerType.INDIVIDUAL);
      });

      corporateResults.forEach(customer => {
        expect(customer.customerType).toBe(CustomerType.CORPORATE);
      });
    });

    test('複数の検索条件を組み合わせて検索できる', async () => {
      const results = await customerService.searchCustomers({
        customerType: CustomerType.INDIVIDUAL,
        name: '田中',
      });

      results.forEach(customer => {
        expect(customer.customerType).toBe(CustomerType.INDIVIDUAL);
        expect(customer.name).toContain('田中');
      });
    });

    test('検索条件に該当しない場合は空の配列を返す', async () => {
      const results = await customerService.searchCustomers({
        customerId: 'NONEXISTENT',
      });

      expect(results).toHaveLength(0);
    });

    test('部分一致検索が正しく動作する', async () => {
      const results = await customerService.searchCustomers({
        name: '太',
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(customer => {
        expect(customer.name.toLowerCase()).toContain('太');
      });
    });
  });

  describe('検索結果のフィルタリング', () => {
    test('削除された顧客は検索結果に含まれない', async () => {
      // 顧客を削除（アクティブな口座がないことを確認するため、口座のない顧客を作成）
      const newCustomer = await customerService.createCustomer({
        name: 'テスト顧客',
        phoneticName: 'テストコキャク',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'test@example.com',
          phone: '03-0000-0000',
        },
      });

      // 削除を実行
      const deleteResult = await customerService.deleteCustomer(
        newCustomer.customerId
      );
      expect(deleteResult.success).toBe(true);

      // 検索結果に含まれないことを確認
      const results = await customerService.searchCustomers({
        customerId: newCustomer.customerId,
      });

      expect(results).toHaveLength(0);
    });

    test('一覧表示でも削除された顧客は含まれない', async () => {
      // 削除前の件数を取得
      const beforeDelete = await customerService.listCustomers({
        page: 1,
        limit: 100,
      });

      // 新しい顧客を作成（アクティブな口座がないことを保証）
      const newCustomer = await customerService.createCustomer({
        name: 'テスト顧客2',
        phoneticName: 'テストコキャク2',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'test2@example.com',
          phone: '03-0000-0001',
        },
      });

      // 作成後の件数を確認
      const afterCreate = await customerService.listCustomers({
        page: 1,
        limit: 100,
      });
      expect(afterCreate.total).toBe(beforeDelete.total + 1);

      // 顧客を削除
      const deleteResult = await customerService.deleteCustomer(
        newCustomer.customerId
      );
      expect(deleteResult.success).toBe(true);

      // 削除後の件数を取得
      const afterDelete = await customerService.listCustomers({
        page: 1,
        limit: 100,
      });

      expect(afterDelete.total).toBe(beforeDelete.total);
    });
  });
});
