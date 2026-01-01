/**
 * 口座サービス
 *
 * 口座情報の管理機能を提供します。
 */

import {
  Account,
  AccountData,
  AccountBalance,
  AccountSearchCriteria,
  AccountStatus,
  BaseApiResponse,
} from '../types/index.js';

/**
 * API呼び出しをシミュレートする遅延
 */
const API_DELAY = 300;

/**
 * 口座サービスクラス
 */
export class AccountService {
  private baseUrl = '/api/accounts';

  /**
   * 口座開設
   */
  async openAccount(accountData: AccountData): Promise<Account> {
    await this.simulateApiDelay();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '口座開設に失敗しました。');
    }

    return result.account;
  }

  /**
   * 口座更新
   */
  async updateAccount(
    accountId: string,
    updates: Partial<AccountData>
  ): Promise<Account> {
    await this.simulateApiDelay();

    const response = await fetch(`${this.baseUrl}/${accountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '口座更新に失敗しました。');
    }

    return result.account;
  }

  /**
   * 口座解約
   */
  async closeAccount(accountId: string): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    const response = await fetch(`${this.baseUrl}/${accountId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    return {
      success: result.success,
      message: result.message,
      timestamp: result.timestamp || new Date().toISOString(),
    };
  }

  /**
   * 口座取得
   */
  async getAccount(accountId: string): Promise<Account> {
    await this.simulateApiDelay();

    const response = await fetch(
      `${this.baseUrl}/details?accountId=${accountId}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '口座が見つかりません。');
    }

    return result.account;
  }

  /**
   * 顧客別口座取得
   */
  async getAccountsByCustomer(customerId: string): Promise<Account[]> {
    await this.simulateApiDelay();

    const response = await fetch(`${this.baseUrl}/customer/${customerId}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '口座の取得に失敗しました。');
    }

    return result.accounts;
  }

  /**
   * 口座一覧検索
   */
  async accountsList(pagination: {
    page: number;
    limit: number;
  }): Promise<Account[]> {
    const response = await fetch(`${this.baseUrl}/list`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || '口座一覧検索に失敗しました。');
    }

    const offset = (pagination.page - 1) * pagination.limit;
    const accounts = data.accounts.slice(offset, offset + pagination.limit);

    return accounts;
  }

  /**
   * 口座検索
   */
  async searchAccounts(criteria: AccountSearchCriteria): Promise<Account[]> {
    await this.simulateApiDelay();

    const params = new URLSearchParams();

    if (criteria.accountId) params.append('accountId', criteria.accountId);
    if (criteria.customerId) params.append('customerId', criteria.customerId);
    if (criteria.accountNumber)
      params.append('accountNumber', criteria.accountNumber);
    if (criteria.accountType)
      params.append('accountType', criteria.accountType);
    if (criteria.status) params.append('status', criteria.status);
    if (criteria.offset) params.append('offset', criteria.offset.toString());
    if (criteria.limit) params.append('limit', criteria.limit.toString());

    console.log(params);

    const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '口座検索に失敗しました。');
    }

    return result.accounts;
  }

  /**
   * 口座残高取得
   */
  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    await this.simulateApiDelay();

    const response = await fetch(`${this.baseUrl}/${accountId}/balance`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '口座残高の取得に失敗しました。');
    }

    return result.balance;
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
