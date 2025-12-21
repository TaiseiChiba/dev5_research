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
 * 口座サービスクラス
 */
export class AccountService {
  /**
   * 口座開設
   */
  async openAccount(accountData: AccountData): Promise<Account> {
    await this.simulateApiDelay();

    // 顧客の存在確認
    const customers = getStorageData('mockCustomers');
    const customer = customers.find(
      (c: any) => c.customerId === accountData.customerId && !c.isDeleted
    );

    if (!customer) {
      throw new Error('指定された顧客が見つかりません。');
    }

    const accounts = reviveDatesInArray(
      getStorageData<Account>('mockAccounts')
    );

    // 口座番号生成（簡易版）
    const accountNumber = this.generateAccountNumber(accountData.customerId);

    const newAccount: Account = {
      accountId: generateId('ACC'),
      customerId: accountData.customerId,
      accountNumber,
      accountType: accountData.accountType,
      status: AccountStatus.ACTIVE,
      balance: accountData.initialBalance || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    accounts.push(newAccount);
    setStorageData('mockAccounts', accounts);

    return newAccount;
  }

  /**
   * 口座更新
   */
  async updateAccount(
    accountId: string,
    updates: Partial<AccountData>
  ): Promise<Account> {
    await this.simulateApiDelay();

    const accounts = reviveDatesInArray(
      getStorageData<Account>('mockAccounts')
    );
    const accountIndex = accounts.findIndex(a => a.accountId === accountId);

    if (accountIndex === -1) {
      throw new Error('口座が見つかりません。');
    }

    const updatedAccount: Account = {
      ...accounts[accountIndex],
      ...updates,
      updatedAt: new Date(),
    };

    accounts[accountIndex] = updatedAccount;
    setStorageData('mockAccounts', accounts);

    return updatedAccount;
  }

  /**
   * 口座解約
   */
  async closeAccount(accountId: string): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    const accounts = reviveDatesInArray(
      getStorageData<Account>('mockAccounts')
    );
    const accountIndex = accounts.findIndex(a => a.accountId === accountId);

    if (accountIndex === -1) {
      return {
        success: false,
        message: '口座が見つかりません。',
        timestamp: new Date().toISOString(),
      };
    }

    const account = accounts[accountIndex];

    // 残高チェック
    if (account.balance !== 0) {
      return {
        success: false,
        message: '残高がゼロでないため、口座を解約できません。',
        timestamp: new Date().toISOString(),
      };
    }

    // 口座状態を解約済みに変更
    accounts[accountIndex].status = AccountStatus.CLOSED;
    accounts[accountIndex].updatedAt = new Date();
    setStorageData('mockAccounts', accounts);

    return {
      success: true,
      message: '口座が正常に解約されました。',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 口座取得
   */
  async getAccount(accountId: string): Promise<Account> {
    await this.simulateApiDelay();

    const accounts = reviveDatesInArray(
      getStorageData<Account>('mockAccounts')
    );
    const account = accounts.find(a => a.accountId === accountId);

    if (!account) {
      throw new Error('口座が見つかりません。');
    }

    return account;
  }

  /**
   * 顧客別口座取得
   */
  async getAccountsByCustomer(customerId: string): Promise<Account[]> {
    await this.simulateApiDelay();

    const accounts = reviveDatesInArray(
      getStorageData<Account>('mockAccounts')
    );
    return accounts.filter(a => a.customerId === customerId);
  }

  /**
   * 口座検索
   */
  async searchAccounts(criteria: AccountSearchCriteria): Promise<Account[]> {
    await this.simulateApiDelay();

    let accounts = reviveDatesInArray(getStorageData<Account>('mockAccounts'));

    // 検索条件を適用
    if (criteria.accountId) {
      accounts = accounts.filter(a =>
        a.accountId.toLowerCase().includes(criteria.accountId!.toLowerCase())
      );
    }

    if (criteria.customerId) {
      accounts = accounts.filter(a => a.customerId === criteria.customerId);
    }

    if (criteria.accountNumber) {
      accounts = accounts.filter(a =>
        a.accountNumber
          .toLowerCase()
          .includes(criteria.accountNumber!.toLowerCase())
      );
    }

    if (criteria.accountType) {
      accounts = accounts.filter(a => a.accountType === criteria.accountType);
    }

    if (criteria.status) {
      accounts = accounts.filter(a => a.status === criteria.status);
    }

    // ページネーション
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 50;

    return accounts.slice(offset, offset + limit);
  }

  /**
   * 口座残高取得
   */
  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    await this.simulateApiDelay();

    const account = await this.getAccount(accountId);

    return {
      accountId: account.accountId,
      accountNumber: account.accountNumber,
      balance: account.balance,
      availableBalance: account.balance, // 簡易版では同じ値
      lastUpdated: account.updatedAt,
    };
  }

  /**
   * 口座番号生成（簡易版）
   */
  private generateAccountNumber(customerId: string): string {
    const customerNum = customerId.replace('CUST', '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');

    return `${customerNum}-${timestamp}-${random}`;
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
