/**
 * サービスファクトリー
 *
 * アプリケーション全体で使用するサービスインスタンスを管理します。
 */

import { AuthService } from '../auth/authService.js';
import { CustomerService } from '../customer/customerService.js';
import { AccountService } from '../account/accountService.js';
import { TransactionService } from '../transaction/transactionService.js';
import { WorkflowService } from '../workflow/workflowService.js';
import { initializeMockData } from '../../data/mockData.js';

/**
 * サービスファクトリークラス
 */
export class ServiceFactory {
  private static instance: ServiceFactory;

  private authService: AuthService;
  private customerService: CustomerService;
  private accountService: AccountService;
  private transactionService: TransactionService;
  private workflowService: WorkflowService;

  private constructor() {
    // サービスインスタンスを初期化
    this.authService = new AuthService();
    this.customerService = new CustomerService();
    this.accountService = new AccountService();
    this.transactionService = new TransactionService();
    this.workflowService = new WorkflowService();
  }

  /**
   * シングルトンインスタンス取得
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * アプリケーション初期化
   */
  public async initialize(): Promise<void> {
    try {
      // モックデータが存在しない場合は初期化
      if (!localStorage.getItem('mockUsers')) {
        console.log('Initializing mock data...');
        initializeMockData();
      }

      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 認証サービス取得
   */
  public getAuthService(): AuthService {
    return this.authService;
  }

  /**
   * 顧客サービス取得
   */
  public getCustomerService(): CustomerService {
    return this.customerService;
  }

  /**
   * 口座サービス取得
   */
  public getAccountService(): AccountService {
    return this.accountService;
  }

  /**
   * 取引サービス取得
   */
  public getTransactionService(): TransactionService {
    return this.transactionService;
  }

  /**
   * ワークフローサービス取得
   */
  public getWorkflowService(): WorkflowService {
    return this.workflowService;
  }

  /**
   * 全サービスのリセット（テスト用）
   */
  public reset(): void {
    // LocalStorageをクリア
    localStorage.clear();

    // サービスインスタンスを再作成
    this.authService = new AuthService();
    this.customerService = new CustomerService();
    this.accountService = new AccountService();
    this.transactionService = new TransactionService();
    this.workflowService = new WorkflowService();

    // モックデータを再初期化
    initializeMockData();
  }
}
