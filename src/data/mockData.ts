/**
 * モックデータ定義
 *
 * テストとデモンストレーション用のサンプルデータを提供します。
 */

import {
  Customer,
  CustomerType,
  Account,
  AccountType,
  AccountStatus,
  Transaction,
  TransactionType,
  TransactionStatus,
  User,
  UserRole,
} from '../types/index.js';

/**
 * サンプル利用者データ
 */
export const mockUsers: User[] = [
  {
    userId: 'staff001',
    userRole: UserRole.GENERAL_STAFF,
    isActive: true,
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  },
  {
    userId: 'staff002',
    userRole: UserRole.GENERAL_STAFF,
    isActive: true,
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  },
  {
    userId: 'admin001',
    userRole: UserRole.ADMINISTRATOR,
    isActive: true,
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  },
];

/**
 * サンプル顧客データ
 */
export const mockCustomers: Customer[] = [
  {
    customerId: 'CUST001',
    name: '田中太郎',
    phoneticName: 'タナカタロウ',
    customerType: CustomerType.INDIVIDUAL,
    contactInfo: {
      email: 'tanaka@example.com',
      phone: '03-1234-5678',
      address: '東京都千代田区丸の内1-1-1',
      postalCode: '100-0005',
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    isDeleted: false,
  },
  {
    customerId: 'CUST002',
    name: '佐藤花子',
    phoneticName: 'サトウハナコ',
    customerType: CustomerType.INDIVIDUAL,
    contactInfo: {
      email: 'sato@example.com',
      phone: '03-2345-6789',
      address: '東京都新宿区西新宿2-2-2',
      postalCode: '160-0023',
    },
    createdAt: new Date('2024-01-20T11:00:00Z'),
    updatedAt: new Date('2024-01-20T11:00:00Z'),
    isDeleted: false,
  },
  {
    customerId: 'CUST003',
    name: '株式会社サンプル商事',
    phoneticName: 'カブシキガイシャサンプルショウジ',
    customerType: CustomerType.CORPORATE,
    contactInfo: {
      email: 'info@sample-corp.com',
      phone: '03-3456-7890',
      address: '東京都港区六本木3-3-3',
      postalCode: '106-0032',
    },
    createdAt: new Date('2024-02-01T09:30:00Z'),
    updatedAt: new Date('2024-02-01T09:30:00Z'),
    isDeleted: false,
  },
  {
    customerId: 'CUST004',
    name: '山田次郎',
    phoneticName: 'ヤマダジロウ',
    customerType: CustomerType.INDIVIDUAL,
    contactInfo: {
      email: 'yamada@example.com',
      phone: '03-4567-8901',
      address: '東京都渋谷区渋谷4-4-4',
      postalCode: '150-0002',
    },
    createdAt: new Date('2024-02-10T14:00:00Z'),
    updatedAt: new Date('2024-02-10T14:00:00Z'),
    isDeleted: false,
  },
];

/**
 * サンプル口座データ
 */
export const mockAccounts: Account[] = [
  {
    accountId: 'ACC001',
    customerId: 'CUST001',
    accountNumber: '1001-001-12345',
    accountType: AccountType.SAVINGS,
    status: AccountStatus.ACTIVE,
    balance: 1500000,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-12-19T09:00:00Z'),
  },
  {
    accountId: 'ACC002',
    customerId: 'CUST001',
    accountNumber: '1001-002-12346',
    accountType: AccountType.CHECKING,
    status: AccountStatus.ACTIVE,
    balance: 250000,
    createdAt: new Date('2024-01-15T10:45:00Z'),
    updatedAt: new Date('2024-12-18T15:30:00Z'),
  },
  {
    accountId: 'ACC003',
    customerId: 'CUST002',
    accountNumber: '1002-001-23456',
    accountType: AccountType.SAVINGS,
    status: AccountStatus.ACTIVE,
    balance: 800000,
    createdAt: new Date('2024-01-20T11:30:00Z'),
    updatedAt: new Date('2024-12-17T10:15:00Z'),
  },
  {
    accountId: 'ACC004',
    customerId: 'CUST003',
    accountNumber: '1003-001-34567',
    accountType: AccountType.CHECKING,
    status: AccountStatus.ACTIVE,
    balance: 5000000,
    createdAt: new Date('2024-02-01T10:00:00Z'),
    updatedAt: new Date('2024-12-19T08:45:00Z'),
  },
  {
    accountId: 'ACC005',
    customerId: 'CUST004',
    accountNumber: '1004-001-45678',
    accountType: AccountType.SAVINGS,
    status: AccountStatus.ACTIVE,
    balance: 320000,
    createdAt: new Date('2024-02-10T14:30:00Z'),
    updatedAt: new Date('2024-12-16T16:20:00Z'),
  },
];

/**
 * サンプル取引データ
 */
export const mockTransactions: Transaction[] = [
  {
    transactionId: 'TXN001',
    type: TransactionType.DEPOSIT,
    destinationAccountId: 'ACC001',
    amount: 100000,
    description: '給与振込',
    status: TransactionStatus.CONFIRMED,
    createdBy: 'staff001',
    verifiedBy: 'staff002',
    confirmedBy: 'admin001',
    createdAt: new Date('2024-12-18T09:00:00Z'),
    verifiedAt: new Date('2024-12-18T09:15:00Z'),
    confirmedAt: new Date('2024-12-18T09:30:00Z'),
  },
  {
    transactionId: 'TXN002',
    type: TransactionType.TRANSFER,
    sourceAccountId: 'ACC001',
    destinationAccountId: 'ACC003',
    amount: 50000,
    description: '家賃支払い',
    status: TransactionStatus.CONFIRMED,
    createdBy: 'staff002',
    verifiedBy: 'staff001',
    confirmedBy: 'admin001',
    createdAt: new Date('2024-12-17T14:00:00Z'),
    verifiedAt: new Date('2024-12-17T14:20:00Z'),
    confirmedAt: new Date('2024-12-17T14:45:00Z'),
  },
  {
    transactionId: 'TXN003',
    type: TransactionType.WITHDRAWAL,
    sourceAccountId: 'ACC002',
    amount: 30000,
    description: 'ATM出金',
    status: TransactionStatus.PENDING_VERIFICATION,
    createdBy: 'staff001',
    createdAt: new Date('2024-12-19T10:00:00Z'),
  },
  {
    transactionId: 'TXN004',
    type: TransactionType.TRANSFER,
    sourceAccountId: 'ACC004',
    destinationAccountId: 'ACC005',
    amount: 200000,
    description: '業務委託費支払い',
    status: TransactionStatus.VERIFICATION_COMPLETE,
    createdBy: 'staff002',
    verifiedBy: 'admin001',
    createdAt: new Date('2024-12-19T11:00:00Z'),
    verifiedAt: new Date('2024-12-19T11:30:00Z'),
  },
  {
    transactionId: 'TXN005',
    type: TransactionType.DEPOSIT,
    destinationAccountId: 'ACC003',
    amount: 75000,
    description: 'ボーナス振込',
    status: TransactionStatus.ON_HOLD,
    createdBy: 'staff001',
    verifiedBy: 'staff002',
    createdAt: new Date('2024-12-19T13:00:00Z'),
    verifiedAt: new Date('2024-12-19T13:15:00Z'),
  },
];

/**
 * 認証用のモックパスワード（実際のアプリケーションでは使用しない）
 */
export const mockPasswords: Record<string, string> = {
  staff001: 'password123',
  staff002: 'password123',
  admin001: 'admin123',
};

/**
 * データ初期化関数
 */
export function initializeMockData(): void {
  // LocalStorageにモックデータを保存
  localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
  localStorage.setItem('mockCustomers', JSON.stringify(mockCustomers));
  localStorage.setItem('mockAccounts', JSON.stringify(mockAccounts));
  localStorage.setItem('mockTransactions', JSON.stringify(mockTransactions));
  localStorage.setItem('mockPasswords', JSON.stringify(mockPasswords));
}

/**
 * データリセット関数
 */
export function resetMockData(): void {
  localStorage.removeItem('mockUsers');
  localStorage.removeItem('mockCustomers');
  localStorage.removeItem('mockAccounts');
  localStorage.removeItem('mockTransactions');
  localStorage.removeItem('mockPasswords');
  localStorage.removeItem('currentSession');

  // 初期データを再設定
  initializeMockData();
}
