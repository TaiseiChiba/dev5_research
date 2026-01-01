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
} from '../../types/index.js';
import {
  getStorageData,
  setStorageData,
  generateId,
  reviveDatesInArray,
} from '../common/storageService.js';
import { API_BASE_URL, isTestEnvironment } from '../../env.js';

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
    // テスト環境では、ローカルストレージを使用
    if (isTestEnvironment()) {
      return this.createCustomerInStorage(customerData);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '顧客作成に失敗しました。');
      }

      return data.customer;
    } catch (error) {
      console.error('API create error, falling back to local storage:', error);
      // APIが利用できない場合はローカルストレージを使用
      return this.createCustomerInStorage(customerData);
    }
  }

  /**
   * ローカルストレージに顧客を作成
   */
  private createCustomerInStorage(customerData: CustomerData): Customer {
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
    // テスト環境では、ローカルストレージを使用
    if (isTestEnvironment()) {
      return this.updateCustomerInStorage(customerId, updates);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '顧客更新に失敗しました。');
      }

      return data.customer;
    } catch (error) {
      console.error('API update error, falling back to local storage:', error);
      // APIが利用できない場合はローカルストレージを使用
      return this.updateCustomerInStorage(customerId, updates);
    }
  }

  /**
   * ローカルストレージで顧客を更新
   */
  private updateCustomerInStorage(
    customerId: string,
    updates: Partial<CustomerData>
  ): Customer {
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
    // テスト環境では、ローカルストレージを使用
    if (isTestEnvironment()) {
      return this.deleteCustomerInStorage(customerId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || '顧客削除に失敗しました。',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('API delete error, falling back to local storage:', error);
      // APIが利用できない場合はローカルストレージを使用
      return this.deleteCustomerInStorage(customerId);
    }
  }

  /**
   * ローカルストレージで顧客を削除
   */
  private deleteCustomerInStorage(customerId: string): BaseApiResponse {
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
    // テスト環境では、ローカルストレージを使用
    if (isTestEnvironment()) {
      return this.getCustomerFromStorage(customerId);
    }

    // ブラウザ環境では常にAPIを試行
    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId);

      const requestUrl = `${API_BASE_URL}/customers/details?${params.toString()}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '顧客が見つかりません。');
      }

      return data.customer;
    } catch (error) {
      console.error('API get error, falling back to local storage:', error);
      // APIが利用できない場合はローカルストレージを使用
      return this.getCustomerFromStorage(customerId);
    }
  }

  /**
   * ローカルストレージから顧客を取得
   */
  private getCustomerFromStorage(customerId: string): Customer {
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
    // テスト環境では、ローカルストレージから検索
    if (isTestEnvironment()) {
      return this.searchCustomersFromStorage(criteria);
    }

    try {
      // クエリパラメータを作成
      const params = new URLSearchParams();
      if (criteria.customerId) params.append('customerId', criteria.customerId);
      if (criteria.name) params.append('name', criteria.name);
      if (criteria.phoneticName)
        params.append('phoneticName', criteria.phoneticName);
      if (criteria.customerType)
        params.append('customerType', criteria.customerType);

      const requestUrl = `${API_BASE_URL}/customers/search?${params.toString()}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const customers = data.customers;

      // ページネーション
      const offset = criteria.offset || 0;
      const limit = criteria.limit || 50;

      return customers.slice(offset, offset + limit);
    } catch (error) {
      console.error('API search error, falling back to local storage:', error);
      // APIが利用できない場合はローカルストレージから検索
      return this.searchCustomersFromStorage(criteria);
    }
  }

  /**
   * ローカルストレージから顧客を検索
   */
  private searchCustomersFromStorage(
    criteria: CustomerSearchCriteria
  ): Customer[] {
    const customers = reviveDatesInArray(
      getStorageData<Customer>('mockCustomers')
    ).filter(c => !c.isDeleted);

    let filteredCustomers = customers;

    // 顧客番号での検索
    if (criteria.customerId) {
      filteredCustomers = filteredCustomers.filter(c =>
        c.customerId.toLowerCase().includes(criteria.customerId!.toLowerCase())
      );
    }

    // 氏名での検索
    if (criteria.name) {
      filteredCustomers = filteredCustomers.filter(c =>
        c.name.toLowerCase().includes(criteria.name!.toLowerCase())
      );
    }

    // カナでの検索
    if (criteria.phoneticName) {
      filteredCustomers = filteredCustomers.filter(c =>
        c.phoneticName
          .toLowerCase()
          .includes(criteria.phoneticName!.toLowerCase())
      );
    }

    // 顧客タイプでの検索
    if (criteria.customerType) {
      filteredCustomers = filteredCustomers.filter(
        c => c.customerType === criteria.customerType
      );
    }

    // ページネーション
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 50;

    return filteredCustomers.slice(offset, offset + limit);
  }

  /**
   * 顧客一覧取得（ページネーション付き）
   */
  async listCustomers(pagination: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<Customer>> {
    // テスト環境では、ローカルストレージから取得
    if (isTestEnvironment()) {
      return this.listCustomersFromStorage(pagination);
    }

    try {
      await this.simulateApiDelay();

      const requestUrl = `${API_BASE_URL}/customers/list`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const offset = (pagination.page - 1) * pagination.limit;
      const data = await response.json();
      const customers = data.customers.slice(offset, offset + pagination.limit);

      return {
        data: customers,
        total: customers.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(customers.length / pagination.limit),
      };
    } catch (error) {
      console.error('API list error, falling back to local storage:', error);
      // APIが利用できない場合はローカルストレージから取得
      return this.listCustomersFromStorage(pagination);
    }
  }

  /**
   * ローカルストレージから顧客一覧を取得
   */
  private listCustomersFromStorage(pagination: {
    page: number;
    limit: number;
  }): PaginatedResult<Customer> {
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
   * 顧客照会
   */
  async searchCustomerDetails(customerId: string): Promise<Customer> {
    try {
      // クエリパラメータを作成
      const params = new URLSearchParams();
      params.append('customerId', customerId);

      const requestUrl = `${API_BASE_URL}/customers/details?${params.toString()}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.customer;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // エラーを再スロー
    }
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
