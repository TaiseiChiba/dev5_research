/**
 * 顧客サービス
 *
 * 顧客情報の管理機能を提供します。
 */

import {
  Customer,
  CustomerData,
  CustomerSearchCriteria,
  PaginatedResult,
  BaseApiResponse,
} from '../types/index.js';
import {
  getStorageData,
  setStorageData,
  generateId,
  reviveDatesInArray,
} from './storageService.js';

/**
 * API呼び出しをシミュレートする遅延
 */
const API_DELAY = 300;

/**
 * 顧客サービスクラス
 */
export class CustomerService {
  /**
   * 顧客作成
   */
  async createCustomer(customerData: CustomerData): Promise<Customer> {
    await this.simulateApiDelay();

    const customers = reviveDatesInArray(
      getStorageData<Customer>('mockCustomers')
    );

    const newCustomer: Customer = {
      customerId: generateId('CUST'),
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    };

    customers.push(newCustomer);
    setStorageData('mockCustomers', customers);

    return newCustomer;
  }

  /**
   * 顧客更新
   */
  async updateCustomer(
    customerId: string,
    updates: Partial<CustomerData>
  ): Promise<Customer> {
    await this.simulateApiDelay();

    const customers = reviveDatesInArray(
      getStorageData<Customer>('mockCustomers')
    );
    const customerIndex = customers.findIndex(
      c => c.customerId === customerId && !c.isDeleted
    );

    if (customerIndex === -1) {
      throw new Error('顧客が見つかりません。');
    }

    const updatedCustomer: Customer = {
      ...customers[customerIndex],
      ...updates,
      updatedAt: new Date(),
    };

    customers[customerIndex] = updatedCustomer;
    setStorageData('mockCustomers', customers);

    return updatedCustomer;
  }

  /**
   * 顧客削除
   */
  async deleteCustomer(customerId: string): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    // アクティブな口座があるかチェック
    const accounts = getStorageData('mockAccounts');
    const hasActiveAccounts = accounts.some(
      (account: any) =>
        account.customerId === customerId && account.status === 'active'
    );

    if (hasActiveAccounts) {
      return {
        success: false,
        message: 'アクティブな口座が存在するため、顧客を削除できません。',
        timestamp: new Date().toISOString(),
      };
    }

    const customers = reviveDatesInArray(
      getStorageData<Customer>('mockCustomers')
    );
    const customerIndex = customers.findIndex(
      c => c.customerId === customerId && !c.isDeleted
    );

    if (customerIndex === -1) {
      return {
        success: false,
        message: '顧客が見つかりません。',
        timestamp: new Date().toISOString(),
      };
    }

    // 論理削除
    customers[customerIndex].isDeleted = true;
    customers[customerIndex].updatedAt = new Date();
    setStorageData('mockCustomers', customers);

    return {
      success: true,
      message: '顧客が正常に削除されました。',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 顧客取得
   */
  async getCustomer(customerId: string): Promise<Customer> {
    await this.simulateApiDelay();

    const customers = reviveDatesInArray(
      getStorageData<Customer>('mockCustomers')
    );
    const customer = customers.find(
      c => c.customerId === customerId && !c.isDeleted
    );

    if (!customer) {
      throw new Error('顧客が見つかりません。');
    }

    return customer;
  }

  /**
   * 顧客検索
   */
  async searchCustomers(criteria: CustomerSearchCriteria): Promise<Customer[]> {
    await this.simulateApiDelay();

    let customers = reviveDatesInArray(
      getStorageData<Customer>('mockCustomers')
    ).filter(c => !c.isDeleted);

    // 検索条件を適用
    if (criteria.customerId) {
      customers = customers.filter(c =>
        c.customerId.toLowerCase().includes(criteria.customerId!.toLowerCase())
      );
    }

    if (criteria.name) {
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(criteria.name!.toLowerCase())
      );
    }

    if (criteria.phoneticName) {
      customers = customers.filter(c =>
        c.phoneticName
          .toLowerCase()
          .includes(criteria.phoneticName!.toLowerCase())
      );
    }

    if (criteria.customerType) {
      customers = customers.filter(
        c => c.customerType === criteria.customerType
      );
    }

    // ページネーション
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 50;

    return customers.slice(offset, offset + limit);
  }

  /**
   * 顧客一覧取得（ページネーション付き）
   */
  async listCustomers(pagination: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<Customer>> {
    await this.simulateApiDelay();

    const allCustomers = reviveDatesInArray(
      getStorageData<Customer>('mockCustomers')
    ).filter(c => !c.isDeleted);

    const offset = (pagination.page - 1) * pagination.limit;
    const customers = allCustomers.slice(offset, offset + pagination.limit);

    return {
      data: customers,
      total: allCustomers.length,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(allCustomers.length / pagination.limit),
    };
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
