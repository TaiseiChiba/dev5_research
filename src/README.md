# ゴブコパ - ソースコード構成

## 概要

このディレクトリには、ゴブコパのフロントエンドソースコードが含まれています。

## ディレクトリ構成

```
src/
├── types/              # TypeScript型定義
│   ├── index.ts        # 型定義のエクスポート
│   ├── auth.ts         # 認証・認可関連の型
│   ├── customer.ts     # 顧客管理関連の型
│   ├── account.ts      # 口座管理関連の型
│   ├── transaction.ts  # 取引管理関連の型
│   ├── workflow.ts     # ワークフロー関連の型
│   ├── api.ts          # API関連の型
│   └── common.ts       # 共通型定義
│
├── data/               # モックデータ
│   └── mockData.ts     # サンプルデータ定義
│
├── services/           # サービス層（APIシミュレーション）
│   ├── index.ts        # サービスのエクスポート
│   ├── storageService.ts      # LocalStorage管理
│   ├── authService.ts         # 認証サービス
│   ├── customerService.ts     # 顧客サービス
│   ├── accountService.ts      # 口座サービス
│   ├── transactionService.ts  # 取引サービス
│   ├── workflowService.ts     # ワークフローサービス
│   └── serviceFactory.ts      # サービスファクトリー
│
├── styles/             # スタイルシート
│   └── main.css        # メインスタイル
│
└── main.ts             # アプリケーションエントリーポイント
```

## 実装済み機能

### 1. TypeScript型定義（タスク 2.1）

以下の型定義を実装しました：

- **認証・認可**: User, UserRole, AuthResult, UserSession
- **顧客管理**: Customer, CustomerType, CustomerData, CustomerSearchCriteria
- **口座管理**: Account, AccountType, AccountStatus, AccountData, AccountBalance
- **取引管理**: Transaction, TransactionType, TransactionStatus, TransactionInput
- **ワークフロー**: WorkflowStep, WorkflowTransitionRule
- **API**: 各サービスのAPIインターフェース定義
- **共通**: PaginationOptions, PaginatedResult, ContactInfo

### 2. モックデータとAPIサービス層（タスク 2.2）

#### モックデータ

- サンプル利用者データ（3名：一般行員2名、管理者1名）
- サンプル顧客データ（4件：個人3件、法人1件）
- サンプル口座データ（5件：普通預金、当座預金）
- サンプル取引データ（5件：振込、入金、出金）

#### サービス層

すべてのサービスはLocalStorageを使用してデータを永続化し、実際のAPIコールをシミュレートします：

1. **AuthService（認証サービス）**
   - ログイン/ログアウト
   - ユーザー切替
   - セッション検証

2. **CustomerService（顧客サービス）**
   - 顧客作成/更新/削除
   - 顧客検索/一覧取得
   - ページネーション対応

3. **AccountService（口座サービス）**
   - 口座開設/更新/解約
   - 口座検索/残高照会
   - 顧客別口座取得

4. **TransactionService（取引サービス）**
   - 取引作成/確定/取消
   - 取引検証（ダブルチェック）
   - 取引履歴照会
   - 残高更新処理

5. **WorkflowService（ワークフローサービス）**
   - 状態遷移検証
   - ダブルチェックルール強制
   - ワークフロー履歴管理

6. **ServiceFactory（サービスファクトリー）**
   - サービスインスタンス管理
   - アプリケーション初期化
   - データリセット機能

## 使用方法

### サービスの初期化

```typescript
import { ServiceFactory } from './services/serviceFactory';

// サービスファクトリーのインスタンス取得
const serviceFactory = ServiceFactory.getInstance();

// 初期化（モックデータの読み込み）
await serviceFactory.initialize();
```

### サービスの使用例

```typescript
// 認証サービスの使用
const authService = serviceFactory.getAuthService();
const result = await authService.login({
  userId: 'staff001',
  password: 'password123',
});

// 顧客サービスの使用
const customerService = serviceFactory.getCustomerService();
const customers = await customerService.listCustomers({
  page: 1,
  limit: 10,
});

// 取引サービスの使用
const transactionService = serviceFactory.getTransactionService();
const transaction = await transactionService.createTransaction(
  {
    type: TransactionType.DEPOSIT,
    destinationAccountId: 'ACC001',
    amount: 10000,
    description: '入金',
  },
  'staff001'
);
```

## テスト

```bash
# すべてのテストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch
```

## ビルド

```bash
# 本番用ビルド
npm run build

# 開発サーバー起動
npm run dev
```

## 次のステップ

次のタスクでは、以下の機能を実装します：

1. 認証・セッション管理UIの実装（タスク 3）
2. 顧客管理画面の実装（タスク 4）
3. 口座管理画面の実装（タスク 5）
4. 取引入力画面の実装（タスク 7）

## 注意事項

- すべてのサービスはLocalStorageを使用してデータを保存します
- API呼び出しは遅延（200-500ms）をシミュレートします
- 認証情報はモックデータとして保存されています（本番環境では使用しないでください）
- データリセットは `serviceFactory.reset()` で実行できます
