/**
 * 取引サービス
 *
 * 取引処理とワークフロー管理機能を提供します。
 * 実際のAPIサーバーと連携してPostgreSQLデータベースを更新します。
 */

import {
  Transaction,
  TransactionInput,
  TransactionVerification,
  TransactionResult,
  TransactionSearchCriteria,
  BaseApiResponse,
} from '../../types/index.js';

/**
 * API呼び出しをシミュレートする遅延
 */
const API_DELAY = 400;

/**
 * 取引サービスクラス
 */
export class TransactionService {
  private baseUrl = 'http://localhost:3001/api';

  /**
   * 取引作成
   */
  async createTransaction(
    transactionData: TransactionInput,
    createdBy: string
  ): Promise<Transaction> {
    await this.simulateApiDelay();

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...transactionData,
        createdBy,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '取引の作成に失敗しました。');
    }

    return this.convertApiTransaction(result.data);
  }

  /**
   * 検証待ち取引取得
   */
  async getTransactionsPendingVerification(): Promise<Transaction[]> {
    await this.simulateApiDelay();

    const response = await fetch(`${this.baseUrl}/transactions/pending`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'データの取得に失敗しました。');
    }

    return result.data.map(this.convertApiTransaction);
  }

  /**
   * 取引検証
   */
  async verifyTransaction(
    transactionId: string,
    verification: TransactionVerification
  ): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    const response = await fetch(
      `${this.baseUrl}/transactions/${transactionId}/verify`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verification),
      }
    );

    const result = await response.json();

    return {
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 確定準備完了取引取得
   */
  async getTransactionsReadyForConfirmation(): Promise<Transaction[]> {
    await this.simulateApiDelay();

    const response = await fetch(`${this.baseUrl}/transactions/ready`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'データの取得に失敗しました。');
    }

    return result.data.map(this.convertApiTransaction);
  }

  /**
   * 取引確定
   */
  async confirmTransaction(
    transactionId: string,
    confirmedBy: string
  ): Promise<TransactionResult> {
    await this.simulateApiDelay();

    const response = await fetch(
      `${this.baseUrl}/transactions/${transactionId}/confirm`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmedBy }),
      }
    );

    const result = await response.json();

    return {
      transactionId,
      success: result.success,
      newBalance: result.newBalance,
      message: result.message,
    };
  }

  /**
   * 取引取消
   */
  async cancelTransaction(transactionId: string): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    const response = await fetch(
      `${this.baseUrl}/transactions/${transactionId}/cancel`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    return {
      success: result.success,
      message: result.message,
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

    const params = new URLSearchParams();

    if (criteria.dateFrom) {
      params.append('dateFrom', criteria.dateFrom.toISOString());
    }
    if (criteria.dateTo) {
      params.append('dateTo', criteria.dateTo.toISOString());
    }
    if (criteria.type) {
      params.append('type', criteria.type);
    }
    if (criteria.sourceAccountId) {
      params.append('sourceAccountId', criteria.sourceAccountId);
    }
    if (criteria.destinationAccountId) {
      params.append('destinationAccountId', criteria.destinationAccountId);
    }

    const response = await fetch(
      `${this.baseUrl}/transactions/history?${params}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'データの取得に失敗しました。');
    }

    return result.data.map(this.convertApiTransaction);
  }

  /**
   * 取引状態変更
   */
  async changeTransactionStatus(
    transactionId: string,
    newStatus: string,
    userId: string,
    comments?: string
  ): Promise<BaseApiResponse> {
    await this.simulateApiDelay();

    // 状態に応じて適切なAPIエンドポイントを呼び出し
    switch (newStatus) {
      case 'verification_complete':
      case 'on_hold':
      case 'returned_for_correction':
        // 検証系の状態変更
        return this.verifyTransaction(transactionId, {
          action: this.mapStatusToAction(newStatus) as
            | 'approve'
            | 'hold'
            | 'return',
          verifiedBy: userId,
          comments,
        });

      case 'confirmed':
        // 取引確定
        const confirmResult = await this.confirmTransaction(
          transactionId,
          userId
        );
        return {
          success: confirmResult.success,
          message: confirmResult.message,
          timestamp: new Date().toISOString(),
        };

      case 'cancelled':
        // 取引取消
        return this.cancelTransaction(transactionId);

      default:
        return {
          success: false,
          message: `未対応の状態変更です: ${newStatus}`,
          timestamp: new Date().toISOString(),
        };
    }
  }

  /**
   * 状態を検証アクションにマッピング
   */
  private mapStatusToAction(status: string): 'approve' | 'hold' | 'return' {
    const statusActionMap: Record<string, 'approve' | 'hold' | 'return'> = {
      verification_complete: 'approve',
      on_hold: 'hold',
      returned_for_correction: 'return',
    };
    return statusActionMap[status] || 'approve';
  }

  /**
   * APIレスポンスをフロントエンド用のTransaction型に変換
   */
  private convertApiTransaction(apiTransaction: any): Transaction {
    return {
      transactionId: apiTransaction.transactionId,
      type: apiTransaction.transactionType.toLowerCase(),
      sourceAccountId: apiTransaction.sourceAccountId,
      destinationAccountId: apiTransaction.destinationAccountId,
      amount: parseFloat(apiTransaction.amount),
      description: apiTransaction.description,
      status: apiTransaction.status.toLowerCase(),
      createdBy: apiTransaction.createdBy,
      verifiedBy: apiTransaction.verifiedBy,
      confirmedBy: apiTransaction.confirmedBy,
      createdAt: new Date(apiTransaction.createdAt),
      verifiedAt: apiTransaction.verifiedAt
        ? new Date(apiTransaction.verifiedAt)
        : undefined,
      confirmedAt: apiTransaction.confirmedAt
        ? new Date(apiTransaction.confirmedAt)
        : undefined,
    };
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
