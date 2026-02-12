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
   * 取引履歴取得（ページネーション付き）
   */
  async getTransactionHistoryPaginated(
    criteria: TransactionSearchCriteria,
    pagination: { page: number; limit: number }
  ): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.simulateApiDelay();

    const params = new URLSearchParams();

    // 検索条件
    if (criteria.dateFrom) {
      params.append('dateFrom', criteria.dateFrom.toISOString());
    }
    if (criteria.dateTo) {
      params.append('dateTo', criteria.dateTo.toISOString());
    }
    if (criteria.type) {
      params.append('type', criteria.type);
    }

    // 口座検索：accountIdがある場合は優先、なければ個別指定
    if (criteria.accountId) {
      params.append('accountId', criteria.accountId);
    } else {
      if (criteria.sourceAccountId) {
        params.append('sourceAccountId', criteria.sourceAccountId);
      }
      if (criteria.destinationAccountId) {
        params.append('destinationAccountId', criteria.destinationAccountId);
      }
    }

    if (criteria.customerId) {
      params.append('customerId', criteria.customerId);
    }

    // ページネーション
    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());

    const response = await fetch(
      `${this.baseUrl}/transactions/history?${params}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'データの取得に失敗しました。');
    }

    return {
      data: result.data.map(this.convertApiTransaction),
      total: result.total || result.data.length,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(
        (result.total || result.data.length) / pagination.limit
      ),
    };
  }

  /**
   * 取引詳細取得
   */
  async getTransactionDetail(transactionId: string): Promise<Transaction> {
    await this.simulateApiDelay();

    const response = await fetch(
      `${this.baseUrl}/transactions/${transactionId}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '取引詳細の取得に失敗しました。');
    }

    return this.convertApiTransaction(result.data);
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

    // フロントエンドのenum値をサーバー側のenum値にマッピング
    const statusMapping: Record<string, string> = {
      pending_verification: 'PENDING_VERIFICATION',
      verification_complete: 'VERIFICATION_COMPLETE',
      on_hold: 'ON_HOLD',
      returned_for_correction: 'RETURNED_FOR_CORRECTION',
      confirmed: 'CONFIRMED',
      cancelled: 'CANCELLED',
    };

    const mappedStatus = statusMapping[newStatus] || newStatus;

    // 状態に応じて適切なAPIエンドポイントを呼び出し
    switch (mappedStatus) {
      case 'VERIFICATION_COMPLETE':
      case 'ON_HOLD':
      case 'RETURNED_FOR_CORRECTION':
        // 検証系の状態変更
        return this.verifyTransaction(transactionId, {
          action: this.mapStatusToAction(mappedStatus) as
            | 'approve'
            | 'hold'
            | 'return',
          verifiedBy: userId,
          comments,
        });

      case 'CONFIRMED':
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

      case 'CANCELLED':
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
      VERIFICATION_COMPLETE: 'approve',
      verification_complete: 'approve',
      ON_HOLD: 'hold',
      on_hold: 'hold',
      RETURNED_FOR_CORRECTION: 'return',
      returned_for_correction: 'return',
    };
    return statusActionMap[status] || 'approve';
  }

  /**
   * APIレスポンスをフロントエンド用のTransaction型に変換
   */
  private convertApiTransaction(apiTransaction: any): Transaction {
    // Prismaのenum値をTypeScriptのenum値にマッピング
    const statusMapping: Record<string, string> = {
      PENDING_VERIFICATION: 'pending_verification',
      VERIFICATION_COMPLETE: 'verification_complete',
      ON_HOLD: 'on_hold',
      RETURNED_FOR_CORRECTION: 'returned_for_correction',
      CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled',
    };

    const typeMapping: Record<string, string> = {
      TRANSFER: 'transfer',
      DEPOSIT: 'deposit',
      WITHDRAWAL: 'withdrawal',
    };

    return {
      transactionId: apiTransaction.transactionId,
      type:
        typeMapping[apiTransaction.transactionType] ||
        typeMapping[apiTransaction.type] ||
        (apiTransaction.type || 'transfer').toLowerCase(),
      sourceAccountId: apiTransaction.sourceAccountId,
      destinationAccountId: apiTransaction.destinationAccountId,
      amount: parseFloat(apiTransaction.amount),
      description: apiTransaction.description,
      status:
        statusMapping[apiTransaction.status] ||
        (apiTransaction.status || 'pending_verification').toLowerCase(),
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
