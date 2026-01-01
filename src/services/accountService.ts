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

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '口座開設に失敗しました。');
      }

      // 日付文字列をDateオブジェクトに変換
      const account = {
        ...result.account,
        createdAt: new Date(result.account.createdAt),
        updatedAt: new Date(result.account.updatedAt),
        balance: parseFloat(result.account.balance), // Decimal型を数値に変換
      };

      return account;
    } catch (error) {
      console.error('Account creation error:', error);
      throw new Error('口座開設に失敗しました。サーバーに接続できません。');
    }
  }

  /**
   * 口座一覧取得
   */
  async listAccounts(): Promise<Account[]> {
    await this.simulateApiDelay();

    try {
      const response = await fetch(`${this.baseUrl}/list`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '口座一覧の取得に失敗しました。');
      }

      // 日付文字列をDateオブジェクトに変換
      const accounts = result.accounts.map((account: any) => ({
        ...account,
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt),
        balance: parseFloat(account.balance), // Decimal型を数値に変換
      }));

      return accounts;
    } catch (error) {
      console.error('Account list error:', error);
      throw new Error(
        '口座一覧の取得に失敗しました。サーバーに接続できません。'
      );
    }
  }

  /**
   * 口座更新
   */
  async updateAccount(
    accountId: string,
    updates: Partial<AccountData>
  ): Promise<Account> {
    await this.simulateApiDelay();

    try {
      const response = await fetch(`${this.baseUrl}/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '口座更新に失敗しました。');
      }

      // 日付文字列をDateオブジェクトに変換
      const account = {
        ...result.account,
        createdAt: new Date(result.account.createdAt),
        updatedAt: new Date(result.account.updatedAt),
        balance: parseFloat(result.account.balance), // Decimal型を数値に変換
      };

      return account;
    } catch (error) {
      console.error('Account update error:', error);
      throw new Error('口座更新に失敗しました。サーバーに接続できません。');
    }
  }

  /**
   * 口座解約
   */
  async closeAccount(accountId: string): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    try {
      const response = await fetch(`${this.baseUrl}/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        timestamp: result.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Account closure error:', error);
      return {
        success: false,
        message: '口座解約に失敗しました。サーバーに接続できません。',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 口座取得
   */
  async getAccount(accountId: string): Promise<Account> {
    await this.simulateApiDelay();

    try {
      const response = await fetch(
        `${this.baseUrl}/details?accountId=${accountId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '口座が見つかりません。');
      }

      // 日付文字列をDateオブジェクトに変換
      const account = {
        ...result.account,
        createdAt: new Date(result.account.createdAt),
        updatedAt: new Date(result.account.updatedAt),
        balance: parseFloat(result.account.balance), // Decimal型を数値に変換
      };

      return account;
    } catch (error) {
      console.error('Account get error:', error);
      throw new Error('口座の取得に失敗しました。サーバーに接続できません。');
    }
  }

  /**
   * 顧客別口座取得
   */
  async getAccountsByCustomer(customerId: string): Promise<Account[]> {
    await this.simulateApiDelay();

    try {
      const response = await fetch(`${this.baseUrl}/customer/${customerId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '口座の取得に失敗しました。');
      }

      // 日付文字列をDateオブジェクトに変換
      const accounts = result.accounts.map((account: any) => ({
        ...account,
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt),
        balance: parseFloat(account.balance), // Decimal型を数値に変換
      }));

      return accounts;
    } catch (error) {
      console.error('Customer accounts error:', error);
      throw new Error(
        '顧客の口座取得に失敗しました。サーバーに接続できません。'
      );
    }
  }

  /**
   * 口座検索
   */
  async searchAccounts(criteria: AccountSearchCriteria): Promise<Account[]> {
    await this.simulateApiDelay();

    try {
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

      const response = await fetch(
        `${this.baseUrl}/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '口座検索に失敗しました。');
      }

      // 日付文字列をDateオブジェクトに変換
      const accounts = result.accounts.map((account: any) => ({
        ...account,
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt),
        balance: parseFloat(account.balance), // Decimal型を数値に変換
      }));

      return accounts;
    } catch (error) {
      console.error('Account search error:', error);
      throw new Error('口座検索に失敗しました。サーバーに接続できません。');
    }
  }

  /**
   * 口座残高取得
   */
  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    await this.simulateApiDelay();

    try {
      const response = await fetch(`${this.baseUrl}/${accountId}/balance`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '口座残高の取得に失敗しました。');
      }

      return result.balance;
    } catch (error) {
      console.error('Account balance error:', error);
      throw new Error(
        '口座残高の取得に失敗しました。サーバーに接続できません。'
      );
    }
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
