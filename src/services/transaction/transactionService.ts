/**
 * 取引サービス
 *
 * 取引処理とワークフロー管理機能を提供します。
 */

import {
  Transaction,
  TransactionInput,
  TransactionVerification,
  TransactionResult,
  TransactionSearchCriteria,
  TransactionStatus,
  BaseApiResponse,
} from '../../types/index.js';
import { Account, AccountStatus } from '../../types/account.js';
import {
  getStorageData,
  setStorageData,
  generateId,
  reviveDatesInArray,
} from '../common/storageService.js';
import { ServiceFactory } from '../common/serviceFactory.js';

/**
 * API呼び出しをシミュレートする遅延
 */
const API_DELAY = 400;

/**
 * 取引サービスクラス
 */
export class TransactionService {
  /**
   * 取引作成
   */
  async createTransaction(
    transactionData: TransactionInput,
    createdBy: string
  ): Promise<Transaction> {
    await this.simulateApiDelay();

    // 口座の存在確認
    await this.validateAccounts(transactionData);

    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );

    const newTransaction: Transaction = {
      transactionId: generateId('TXN'),
      type: transactionData.type,
      sourceAccountId: transactionData.sourceAccountId,
      destinationAccountId: transactionData.destinationAccountId,
      amount: transactionData.amount,
      description: transactionData.description,
      status: TransactionStatus.PENDING_VERIFICATION,
      createdBy,
      createdAt: new Date(),
    };

    transactions.push(newTransaction);
    setStorageData('mockTransactions', transactions);

    return newTransaction;
  }

  /**
   * 検証待ち取引取得
   */
  async getTransactionsPendingVerification(): Promise<Transaction[]> {
    await this.simulateApiDelay();

    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );
    return transactions.filter(
      t => t.status === TransactionStatus.PENDING_VERIFICATION
    );
  }

  /**
   * 取引検証
   */
  async verifyTransaction(
    transactionId: string,
    verification: TransactionVerification
  ): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );
    const transactionIndex = transactions.findIndex(
      t => t.transactionId === transactionId
    );

    if (transactionIndex === -1) {
      return {
        success: false,
        message: '取引が見つかりません。',
        timestamp: new Date().toISOString(),
      };
    }

    const transaction = transactions[transactionIndex];

    // 自己検証防止
    if (transaction.createdBy === verification.verifiedBy) {
      return {
        success: false,
        message: '自分が作成した取引は検証できません。',
        timestamp: new Date().toISOString(),
      };
    }

    // 状態更新
    let newStatus: TransactionStatus;
    let actionMessage: string;
    switch (verification.action) {
      case 'approve':
        newStatus = TransactionStatus.VERIFICATION_COMPLETE;
        actionMessage = '取引が承認されました。';
        break;
      case 'hold':
        newStatus = TransactionStatus.ON_HOLD;
        actionMessage = '取引が保留されました。';
        break;
      case 'return':
        newStatus = TransactionStatus.RETURNED_FOR_CORRECTION;
        actionMessage = '取引が差し戻されました。';
        break;
      default:
        return {
          success: false,
          message: '無効な検証アクションです。',
          timestamp: new Date().toISOString(),
        };
    }

    // ワークフローサービスを使用して状態変更を処理
    const workflowService = ServiceFactory.getInstance().getWorkflowService();
    const statusChangeResult = await workflowService.processStatusChange(
      transactionId,
      newStatus,
      verification.verifiedBy,
      verification.comments
    );

    if (!statusChangeResult.success) {
      return statusChangeResult;
    }

    // 取引データを更新
    transactions[transactionIndex] = {
      ...transaction,
      status: newStatus,
      verifiedBy: verification.verifiedBy,
      verifiedAt: new Date(),
    };

    setStorageData('mockTransactions', transactions);

    return {
      success: true,
      message: actionMessage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 確定準備完了取引取得
   */
  async getTransactionsReadyForConfirmation(): Promise<Transaction[]> {
    await this.simulateApiDelay();

    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );
    return transactions.filter(
      t => t.status === TransactionStatus.VERIFICATION_COMPLETE
    );
  }

  /**
   * 取引確定
   */
  async confirmTransaction(
    transactionId: string,
    confirmedBy: string
  ): Promise<TransactionResult> {
    await this.simulateApiDelay();

    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );
    const transactionIndex = transactions.findIndex(
      t => t.transactionId === transactionId
    );

    if (transactionIndex === -1) {
      return {
        transactionId,
        success: false,
        message: '取引が見つかりません。',
      };
    }

    const transaction = transactions[transactionIndex];

    if (transaction.status !== TransactionStatus.VERIFICATION_COMPLETE) {
      return {
        transactionId,
        success: false,
        message: '取引が確定可能な状態ではありません。',
      };
    }

    try {
      // 残高更新
      const newBalances = await this.updateAccountBalances(transaction);

      // 取引状態更新
      transactions[transactionIndex] = {
        ...transaction,
        status: TransactionStatus.CONFIRMED,
        confirmedBy,
        confirmedAt: new Date(),
      };

      setStorageData('mockTransactions', transactions);

      return {
        transactionId,
        success: true,
        newBalance: newBalances,
        message: '取引が正常に確定されました。',
      };
    } catch (error) {
      return {
        transactionId,
        success: false,
        message: `取引確定中にエラーが発生しました: ${error}`,
      };
    }
  }

  /**
   * 取引状態変更（汎用）
   */
  async changeTransactionStatus(
    transactionId: string,
    newStatus: TransactionStatus,
    userId: string,
    comments?: string
  ): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );
    const transactionIndex = transactions.findIndex(
      t => t.transactionId === transactionId
    );

    if (transactionIndex === -1) {
      return {
        success: false,
        message: '取引が見つかりません。',
        timestamp: new Date().toISOString(),
      };
    }

    const transaction = transactions[transactionIndex];

    // ワークフローサービスを使用して状態変更を検証・処理
    const workflowService = ServiceFactory.getInstance().getWorkflowService();

    // 状態遷移の検証
    const isValidTransition =
      await workflowService.validateTransactionTransition(
        transactionId,
        newStatus,
        userId
      );

    if (!isValidTransition) {
      return {
        success: false,
        message: '無効な状態遷移です。',
        timestamp: new Date().toISOString(),
      };
    }

    // 自己検証防止（検証系の状態変更の場合）
    if (this.isVerificationStatus(newStatus)) {
      const canVerify = await workflowService.enforceDoubleCheckRule(
        transactionId,
        userId
      );

      if (!canVerify) {
        return {
          success: false,
          message: '自分が作成した取引は検証できません。',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // ワークフロー履歴を記録
    const statusChangeResult = await workflowService.processStatusChange(
      transactionId,
      newStatus,
      userId,
      comments
    );

    if (!statusChangeResult.success) {
      return statusChangeResult;
    }

    // 取引データを更新
    const updatedTransaction = { ...transaction, status: newStatus };

    // 状態に応じて追加フィールドを更新
    if (this.isVerificationStatus(newStatus)) {
      updatedTransaction.verifiedBy = userId;
      updatedTransaction.verifiedAt = new Date();
    } else if (newStatus === TransactionStatus.CONFIRMED) {
      updatedTransaction.confirmedBy = userId;
      updatedTransaction.confirmedAt = new Date();
    }

    transactions[transactionIndex] = updatedTransaction;
    setStorageData('mockTransactions', transactions);

    return {
      success: true,
      message: this.getStatusChangeMessage(newStatus),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 検証系の状態かどうかを判定
   */
  private isVerificationStatus(status: TransactionStatus): boolean {
    return [
      TransactionStatus.VERIFICATION_COMPLETE,
      TransactionStatus.ON_HOLD,
      TransactionStatus.RETURNED_FOR_CORRECTION,
    ].includes(status);
  }

  /**
   * 状態変更メッセージを取得
   */
  private getStatusChangeMessage(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.VERIFICATION_COMPLETE:
        return '取引が承認されました。';
      case TransactionStatus.ON_HOLD:
        return '取引が保留されました。';
      case TransactionStatus.RETURNED_FOR_CORRECTION:
        return '取引が差し戻されました。';
      case TransactionStatus.CONFIRMED:
        return '取引が確定されました。';
      case TransactionStatus.CANCELLED:
        return '取引が取消されました。';
      default:
        return '取引状態が変更されました。';
    }
  }

  /**
   * 取引取消
   */
  async cancelTransaction(transactionId: string): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    const transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    );
    const transactionIndex = transactions.findIndex(
      t => t.transactionId === transactionId
    );

    if (transactionIndex === -1) {
      return {
        success: false,
        message: '取引が見つかりません。',
        timestamp: new Date().toISOString(),
      };
    }

    const transaction = transactions[transactionIndex];

    // 当日取引のみ取消可能
    const today = new Date();
    const transactionDate = new Date(
      transaction.confirmedAt || transaction.createdAt
    );

    if (transactionDate.toDateString() !== today.toDateString()) {
      return {
        success: false,
        message: '当日の取引のみ取消可能です。',
        timestamp: new Date().toISOString(),
      };
    }

    if (transaction.status === TransactionStatus.CONFIRMED) {
      // 残高を元に戻す
      await this.reverseAccountBalances(transaction);
    }

    transactions[transactionIndex].status = TransactionStatus.CANCELLED;
    setStorageData('mockTransactions', transactions);

    return {
      success: true,
      message: '取引が正常に取消されました。',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 取引履歴取得
   */
  async getTransactionHistory(
    criteria: TransactionSearchCriteria
  ): Promise<Transaction[]> {
    await this.simulateApiDelay();

    let transactions = reviveDatesInArray(
      getStorageData<Transaction>('mockTransactions')
    ).filter(t => t.status === TransactionStatus.CONFIRMED);

    // 検索条件を適用
    if (criteria.transactionId) {
      transactions = transactions.filter(t =>
        t.transactionId
          .toLowerCase()
          .includes(criteria.transactionId!.toLowerCase())
      );
    }

    if (criteria.type) {
      transactions = transactions.filter(t => t.type === criteria.type);
    }

    if (criteria.sourceAccountId) {
      transactions = transactions.filter(
        t => t.sourceAccountId === criteria.sourceAccountId
      );
    }

    if (criteria.destinationAccountId) {
      transactions = transactions.filter(
        t => t.destinationAccountId === criteria.destinationAccountId
      );
    }

    if (criteria.createdBy) {
      transactions = transactions.filter(
        t => t.createdBy === criteria.createdBy
      );
    }

    if (criteria.dateFrom) {
      transactions = transactions.filter(
        t => new Date(t.confirmedAt || t.createdAt) >= criteria.dateFrom!
      );
    }

    if (criteria.dateTo) {
      transactions = transactions.filter(
        t => new Date(t.confirmedAt || t.createdAt) <= criteria.dateTo!
      );
    }

    if (criteria.amountMin !== undefined) {
      transactions = transactions.filter(t => t.amount >= criteria.amountMin!);
    }

    if (criteria.amountMax !== undefined) {
      transactions = transactions.filter(t => t.amount <= criteria.amountMax!);
    }

    // ページネーション
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 50;

    return transactions.slice(offset, offset + limit);
  }

  /**
   * 口座の存在確認
   */
  private async validateAccounts(
    transactionData: TransactionInput
  ): Promise<void> {
    // AccountServiceを使用して口座データを取得
    const accountService = ServiceFactory.getInstance().getAccountService();
    const accounts = await accountService.listAccounts();

    if (transactionData.sourceAccountId) {
      const sourceAccount = accounts.find(
        (a: Account) => a.accountId === transactionData.sourceAccountId
      );
      if (!sourceAccount || sourceAccount.status !== AccountStatus.ACTIVE) {
        throw new Error('振込元口座が見つからないか、無効な状態です。');
      }
    }

    if (transactionData.destinationAccountId) {
      const destAccount = accounts.find(
        (a: Account) => a.accountId === transactionData.destinationAccountId
      );
      if (!destAccount || destAccount.status !== AccountStatus.ACTIVE) {
        throw new Error('振込先口座が見つからないか、無効な状態です。');
      }
    }
  }

  /**
   * 口座残高更新
   */
  private async updateAccountBalances(
    transaction: Transaction
  ): Promise<Record<string, number>> {
    const accounts = reviveDatesInArray(
      getStorageData<Account>('mockAccounts')
    );
    const newBalances: Record<string, number> = {};

    // 振込元口座から減額
    if (transaction.sourceAccountId) {
      const sourceIndex = accounts.findIndex(
        a => a.accountId === transaction.sourceAccountId
      );
      if (sourceIndex !== -1) {
        if (accounts[sourceIndex].balance < transaction.amount) {
          throw new Error('残高不足です。');
        }
        accounts[sourceIndex].balance -= transaction.amount;
        accounts[sourceIndex].updatedAt = new Date();
        newBalances[transaction.sourceAccountId] =
          accounts[sourceIndex].balance;
      }
    }

    // 振込先口座に加算
    if (transaction.destinationAccountId) {
      const destIndex = accounts.findIndex(
        a => a.accountId === transaction.destinationAccountId
      );
      if (destIndex !== -1) {
        accounts[destIndex].balance += transaction.amount;
        accounts[destIndex].updatedAt = new Date();
        newBalances[transaction.destinationAccountId] =
          accounts[destIndex].balance;
      }
    }

    setStorageData('mockAccounts', accounts);
    return newBalances;
  }

  /**
   * 口座残高を元に戻す
   */
  private async reverseAccountBalances(
    transaction: Transaction
  ): Promise<void> {
    const accounts = reviveDatesInArray(
      getStorageData<Account>('mockAccounts')
    );

    // 振込元口座に加算（元に戻す）
    if (transaction.sourceAccountId) {
      const sourceIndex = accounts.findIndex(
        a => a.accountId === transaction.sourceAccountId
      );
      if (sourceIndex !== -1) {
        accounts[sourceIndex].balance += transaction.amount;
        accounts[sourceIndex].updatedAt = new Date();
      }
    }

    // 振込先口座から減額（元に戻す）
    if (transaction.destinationAccountId) {
      const destIndex = accounts.findIndex(
        a => a.accountId === transaction.destinationAccountId
      );
      if (destIndex !== -1) {
        accounts[destIndex].balance -= transaction.amount;
        accounts[destIndex].updatedAt = new Date();
      }
    }

    setStorageData('mockAccounts', accounts);
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
