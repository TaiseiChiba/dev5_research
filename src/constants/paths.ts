/**
 * アプリケーション内のルートパス定義
 *
 * 全画面のURLパスを一元管理し、型安全性を確保します。
 */

export const PATHS = {
  // 認証関連
  LOGIN: '/login',

  // ダッシュボード
  DASHBOARD: '/',

  // 顧客管理
  CUSTOMERS: '/customers',
  CUSTOMER_LIST: '/customers/list',
  CUSTOMER_DETAIL: '/customers/:customerId',
  CUSTOMER_EDIT: '/customers/:customerId/edit',
  CUSTOMER_CREATE: '/customers/create',

  // 口座管理
  ACCOUNTS: '/accounts',
  ACCOUNT_LIST: '/accounts/list',
  ACCOUNT_DETAIL: '/accounts/:accountId',
  ACCOUNT_EDIT: '/accounts/:accountId/edit',
  ACCOUNT_CREATE: '/accounts/create',
  ACCOUNT_BY_CUSTOMER: '/customers/:customerId/accounts',

  // 取引管理
  TRANSACTIONS: '/transactions',
  TRANSACTION_INPUT: '/transactions/input',
  TRANSACTION_VERIFICATION: '/transactions/verification',
  TRANSACTION_CONFIRMATION: '/transactions/confirmation',
  TRANSACTION_FINAL_CONFIRMATION: '/transactions/final-confirmation',
  TRANSACTION_DETAIL: '/transactions/:transactionId',
  TRANSACTION_HISTORY: '/transactions/history',

  // ワークフロー管理
  WORKFLOW: '/workflow',
  WORKFLOW_PENDING: '/workflow/pending',
  WORKFLOW_READY: '/workflow/ready',
  WORKFLOW_HISTORY: '/workflow/history',

  // 設定・管理
  SETTINGS: '/settings',
  USER_MANAGEMENT: '/settings/users',
  SYSTEM_CONFIG: '/settings/system',

  // エラーページ
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  SERVER_ERROR: '/500',
} as const;

/**
 * 動的パラメータを含むパスを生成するヘルパー関数
 */
export const generatePath = {
  customerDetail: (customerId: string) => `/customers/${customerId}`,
  customerEdit: (customerId: string) => `/customers/${customerId}/edit`,
  accountDetail: (accountId: string) => `/accounts/${accountId}`,
  accountEdit: (accountId: string) => `/accounts/${accountId}/edit`,
  accountByCustomer: (customerId: string) =>
    `/customers/${customerId}/accounts`,
  transactionDetail: (transactionId: string) =>
    `/transactions/${transactionId}`,
} as const;

/**
 * パンくずナビゲーション用のパス階層定義
 */
export const PATH_HIERARCHY = {
  [PATHS.DASHBOARD]: { label: 'ダッシュボード', parent: null },

  // 顧客管理階層
  [PATHS.CUSTOMERS]: { label: '顧客管理', parent: PATHS.DASHBOARD },
  [PATHS.CUSTOMER_LIST]: { label: '顧客一覧', parent: PATHS.CUSTOMERS },
  [PATHS.CUSTOMER_CREATE]: {
    label: '新規顧客登録',
    parent: PATHS.CUSTOMER_LIST,
  },
  [PATHS.CUSTOMER_DETAIL]: { label: '顧客詳細', parent: PATHS.CUSTOMER_LIST },
  [PATHS.CUSTOMER_EDIT]: { label: '顧客編集', parent: PATHS.CUSTOMER_DETAIL },

  // 口座管理階層
  [PATHS.ACCOUNTS]: { label: '口座管理', parent: PATHS.DASHBOARD },
  [PATHS.ACCOUNT_LIST]: { label: '口座一覧', parent: PATHS.ACCOUNTS },
  [PATHS.ACCOUNT_CREATE]: { label: '新規口座開設', parent: PATHS.ACCOUNT_LIST },
  [PATHS.ACCOUNT_DETAIL]: { label: '口座詳細', parent: PATHS.ACCOUNT_LIST },
  [PATHS.ACCOUNT_EDIT]: { label: '口座編集', parent: PATHS.ACCOUNT_DETAIL },
  [PATHS.ACCOUNT_BY_CUSTOMER]: {
    label: '顧客別口座',
    parent: PATHS.CUSTOMER_DETAIL,
  },

  // 取引管理階層
  [PATHS.TRANSACTIONS]: { label: '取引管理', parent: PATHS.DASHBOARD },
  [PATHS.TRANSACTION_INPUT]: { label: '取引入力', parent: PATHS.TRANSACTIONS },
  [PATHS.TRANSACTION_VERIFICATION]: {
    label: '取引検証',
    parent: PATHS.TRANSACTIONS,
  },
  [PATHS.TRANSACTION_CONFIRMATION]: {
    label: '取引確認',
    parent: PATHS.TRANSACTIONS,
  },
  [PATHS.TRANSACTION_FINAL_CONFIRMATION]: {
    label: '取引確定',
    parent: PATHS.TRANSACTIONS,
  },
  [PATHS.TRANSACTION_DETAIL]: {
    label: '取引詳細',
    parent: PATHS.TRANSACTION_HISTORY,
  },
  [PATHS.TRANSACTION_HISTORY]: {
    label: '取引履歴',
    parent: PATHS.TRANSACTIONS,
  },

  // ワークフロー管理階層
  [PATHS.WORKFLOW]: { label: 'ワークフロー', parent: PATHS.DASHBOARD },
  [PATHS.WORKFLOW_PENDING]: { label: '検証待ち', parent: PATHS.WORKFLOW },
  [PATHS.WORKFLOW_READY]: { label: '確定準備完了', parent: PATHS.WORKFLOW },
  [PATHS.WORKFLOW_HISTORY]: {
    label: 'ワークフロー履歴',
    parent: PATHS.WORKFLOW,
  },

  // 設定管理階層
  [PATHS.SETTINGS]: { label: '設定', parent: PATHS.DASHBOARD },
  [PATHS.USER_MANAGEMENT]: { label: 'ユーザー管理', parent: PATHS.SETTINGS },
  [PATHS.SYSTEM_CONFIG]: { label: 'システム設定', parent: PATHS.SETTINGS },
} as const;

/**
 * 認証が必要なパスの定義
 */
export const PROTECTED_PATHS = [
  PATHS.DASHBOARD,
  PATHS.CUSTOMERS,
  PATHS.CUSTOMER_LIST,
  PATHS.CUSTOMER_DETAIL,
  PATHS.CUSTOMER_EDIT,
  PATHS.CUSTOMER_CREATE,
  PATHS.ACCOUNTS,
  PATHS.ACCOUNT_LIST,
  PATHS.ACCOUNT_DETAIL,
  PATHS.ACCOUNT_EDIT,
  PATHS.ACCOUNT_CREATE,
  PATHS.ACCOUNT_BY_CUSTOMER,
  PATHS.TRANSACTIONS,
  PATHS.TRANSACTION_INPUT,
  PATHS.TRANSACTION_VERIFICATION,
  PATHS.TRANSACTION_CONFIRMATION,
  PATHS.TRANSACTION_FINAL_CONFIRMATION,
  PATHS.TRANSACTION_DETAIL,
  PATHS.TRANSACTION_HISTORY,
  PATHS.WORKFLOW,
  PATHS.WORKFLOW_PENDING,
  PATHS.WORKFLOW_READY,
  PATHS.WORKFLOW_HISTORY,
  PATHS.SETTINGS,
  PATHS.USER_MANAGEMENT,
  PATHS.SYSTEM_CONFIG,
] as const;

/**
 * 管理者のみアクセス可能なパスの定義
 */
export const ADMIN_ONLY_PATHS = [
  PATHS.USER_MANAGEMENT,
  PATHS.SYSTEM_CONFIG,
  PATHS.TRANSACTION_FINAL_CONFIRMATION,
] as const;

/**
 * パス関連のユーティリティ型定義
 */
export type PathKey = keyof typeof PATHS;
export type PathValue = (typeof PATHS)[PathKey];
export type ProtectedPath = (typeof PROTECTED_PATHS)[number];
export type AdminOnlyPath = (typeof ADMIN_ONLY_PATHS)[number];
