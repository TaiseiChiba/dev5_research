/**
 * API関連の型定義
 */

import { BaseApiResponse, PaginatedResult } from './common.js';
import { Customer, CustomerData, CustomerSearchCriteria } from './customer.js';
import {
  Account,
  AccountData,
  AccountBalance,
  AccountSearchCriteria,
} from './account.js';
import {
  Transaction,
  TransactionInput,
  TransactionVerification,
  TransactionResult,
  TransactionSearchCriteria,
} from './transaction.js';
import {
  AuthResult,
  LoginRequest,
  SwitchUserRequest,
  UserSession,
} from './auth.js';
import { WorkflowStep } from './workflow.js';

/**
 * 認証サービスAPI
 */
export interface AuthenticationServiceApi {
  login(request: LoginRequest): Promise<AuthResult>;
  logout(sessionId: string): Promise<BaseApiResponse>;
  switchUser(request: SwitchUserRequest): Promise<AuthResult>;
  validateSession(sessionId: string): Promise<UserSession>;
}

/**
 * 顧客サービスAPI
 */
export interface CustomerServiceApi {
  createCustomer(customerData: CustomerData): Promise<Customer>;
  updateCustomer(
    customerId: string,
    updates: Partial<CustomerData>
  ): Promise<Customer>;
  deleteCustomer(customerId: string): Promise<BaseApiResponse>;
  getCustomer(customerId: string): Promise<Customer>;
  searchCustomers(criteria: CustomerSearchCriteria): Promise<Customer[]>;
  listCustomers(pagination: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<Customer>>;
}

/**
 * 口座サービスAPI
 */
export interface AccountServiceApi {
  openAccount(accountData: AccountData): Promise<Account>;
  updateAccount(
    accountId: string,
    updates: Partial<AccountData>
  ): Promise<Account>;
  closeAccount(accountId: string): Promise<BaseApiResponse>;
  getAccount(accountId: string): Promise<Account>;
  getAccountsByCustomer(customerId: string): Promise<Account[]>;
  searchAccounts(criteria: AccountSearchCriteria): Promise<Account[]>;
  getAccountBalance(accountId: string): Promise<AccountBalance>;
}

/**
 * 取引サービスAPI
 */
export interface TransactionServiceApi {
  createTransaction(transactionData: TransactionInput): Promise<Transaction>;
  getTransactionsPendingVerification(): Promise<Transaction[]>;
  verifyTransaction(
    transactionId: string,
    verification: TransactionVerification
  ): Promise<BaseApiResponse>;
  getTransactionsReadyForConfirmation(): Promise<Transaction[]>;
  confirmTransaction(transactionId: string): Promise<TransactionResult>;
  cancelTransaction(transactionId: string): Promise<BaseApiResponse>;
  getTransactionHistory(
    criteria: TransactionSearchCriteria
  ): Promise<Transaction[]>;
}

/**
 * ワークフローサービスAPI
 */
export interface WorkflowServiceApi {
  validateTransactionTransition(
    transactionId: string,
    newStatus: string,
    userId: string
  ): Promise<boolean>;
  enforceDoubleCheckRule(
    transactionId: string,
    verifyingUserId: string
  ): Promise<boolean>;
  processStatusChange(
    transactionId: string,
    newStatus: string,
    comments?: string
  ): Promise<BaseApiResponse>;
  getWorkflowHistory(transactionId: string): Promise<WorkflowStep[]>;
}

/**
 * API応答型
 */
export interface ApiResponse<T> extends BaseApiResponse {
  data?: T;
}

/**
 * APIエラー応答
 */
export interface ApiErrorResponse extends BaseApiResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
