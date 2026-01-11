# SCR008: 口座詳細画面

## 基本情報

- **画面ID**: SCR008
- **画面名**: 口座詳細画面
- **URL**: `/accounts/:accountId`
- **実装ファイル**: `src/components/account/AccountDetail.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **メインテーブル**: `accounts`
- **関連テーブル**: `customers`, `transactions`
- **操作種別**: SELECT（詳細取得・関連取引取得）、UPDATE（ステータス更新）

### 口座詳細取得SQL

```sql
SELECT
  a.account_id,
  a.customer_id,
  a.account_number,
  a.account_type,
  a.status,
  a.balance,
  a.created_at,
  a.updated_at,
  c.name as customer_name,
  c.phonetic_name as customer_phonetic_name,
  c.customer_type,
  c.contact_info
FROM accounts a
INNER JOIN customers c ON a.customer_id = c.customer_id
WHERE a.account_id = $1
  AND c.is_deleted = false;
```

### 関連取引取得SQL

```sql
SELECT
  t.transaction_id,
  t.transaction_type,
  t.amount,
  t.description,
  t.status,
  t.created_at,
  CASE
    WHEN t.source_account_id = $1 THEN 'OUTGOING'
    WHEN t.destination_account_id = $1 THEN 'INCOMING'
    ELSE 'OTHER'
  END as direction,
  CASE
    WHEN t.source_account_id = $1 THEN da.account_number
    WHEN t.destination_account_id = $1 THEN sa.account_number
    ELSE NULL
  END as counterpart_account_number,
  CASE
    WHEN t.source_account_id = $1 THEN dc.name
    WHEN t.destination_account_id = $1 THEN sc.name
    ELSE NULL
  END as counterpart_customer_name
FROM transactions t
LEFT JOIN accounts sa ON t.source_account_id = sa.account_id
LEFT JOIN customers sc ON sa.customer_id = sc.customer_id
LEFT JOIN accounts da ON t.destination_account_id = da.account_id
LEFT JOIN customers dc ON da.customer_id = dc.customer_id
WHERE (t.source_account_id = $1 OR t.destination_account_id = $1)
  AND t.status IN ('COMPLETED', 'CANCELLED')
ORDER BY t.created_at DESC
LIMIT 20;
```

### 口座ステータス更新SQL

```sql
UPDATE accounts
SET
  status = $1,
  updated_at = NOW()
WHERE account_id = $2
  AND status != $1;
```

## 画面項目

### 基本情報表示

| 項目ID | 項目名     | 種別     | 必須 | 制約 | 初期値 | DB項目                    |
| ------ | ---------- | -------- | ---- | ---- | ------ | ------------------------- |
| ACD001 | 口座番号   | 表示項目 | -    | -    | DB値   | `accounts.account_number` |
| ACD002 | 口座種別   | チップ   | -    | -    | DB値   | `accounts.account_type`   |
| ACD003 | ステータス | チップ   | -    | -    | DB値   | `accounts.status`         |
| ACD004 | 残高       | 表示項目 | -    | -    | DB値   | `accounts.balance`        |
| ACD005 | 開設日     | 表示項目 | -    | -    | DB値   | `accounts.created_at`     |
| ACD006 | 最終更新日 | 表示項目 | -    | -    | DB値   | `accounts.updated_at`     |

### 顧客情報表示

| 項目ID | 項目名       | 種別     | 必須 | 制約 | 初期値 | DB項目                             |
| ------ | ------------ | -------- | ---- | ---- | ------ | ---------------------------------- |
| ACD007 | 顧客番号     | 表示項目 | -    | -    | DB値   | `customers.customer_id`            |
| ACD008 | 氏名・法人名 | 表示項目 | -    | -    | DB値   | `customers.name`                   |
| ACD009 | カナ         | 表示項目 | -    | -    | DB値   | `customers.phonetic_name`          |
| ACD010 | 顧客区分     | チップ   | -    | -    | DB値   | `customers.customer_type`          |
| ACD011 | メール       | 表示項目 | -    | -    | DB値   | `customers.contact_info->>'email'` |
| ACD012 | 電話番号     | 表示項目 | -    | -    | DB値   | `customers.contact_info->>'phone'` |

### 操作ボタン

| 項目ID | 項目名         | 種別   | 必須 | 制約 | 初期値 | DB項目 |
| ------ | -------------- | ------ | ---- | ---- | ------ | ------ |
| ACD013 | 戻るボタン     | ボタン | -    | -    | -      | -      |
| ACD014 | 編集ボタン     | ボタン | -    | -    | -      | -      |
| ACD015 | ステータス変更 | ボタン | -    | -    | -      | -      |
| ACD016 | 顧客詳細ボタン | ボタン | -    | -    | -      | -      |

### 関連取引一覧

| 項目ID | 項目名           | 種別     | 必須 | 制約 | 初期値     | DB項目           |
| ------ | ---------------- | -------- | ---- | ---- | ---------- | ---------------- |
| ACD017 | 取引一覧テーブル | テーブル | -    | -    | 取引データ | `transactions.*` |
| ACD018 | 取引件数表示     | 表示項目 | -    | -    | 件数       | COUNT(\*)        |
| ACD019 | 全件表示ボタン   | ボタン   | -    | -    | -          | -                |

### 取引テーブル列定義

| 列ID   | 列名       | データ型      | 表示形式         | DB項目                        |
| ------ | ---------- | ------------- | ---------------- | ----------------------------- |
| TXN001 | 取引ID     | VARCHAR(20)   | そのまま         | `transactions.transaction_id` |
| TXN002 | 取引種別   | ENUM          | 入出金表示       | `direction`                   |
| TXN003 | 相手先     | VARCHAR       | 顧客名：口座番号 | `counterpart_*`               |
| TXN004 | 金額       | DECIMAL(15,2) | 通貨フォーマット | `transactions.amount`         |
| TXN005 | 取引内容   | TEXT          | 省略表示         | `transactions.description`    |
| TXN006 | ステータス | ENUM          | チップ表示       | `transactions.status`         |
| TXN007 | 取引日時   | TIMESTAMP     | YYYY/MM/DD HH:mm | `transactions.created_at`     |
| TXN008 | 操作       | ボタン        | 詳細ボタン       | -                             |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **URLパラメータ取得**
   - `accountId`をURLから取得
   - パラメータ検証

2. **口座詳細データ取得**
   - `GET /api/accounts/:accountId` 呼び出し
   - `accounts`テーブルから詳細情報取得

3. **関連取引データ取得**
   - `GET /api/accounts/:accountId/transactions` 呼び出し
   - `transactions`テーブルから関連取引取得

4. **画面表示**
   - 口座基本情報表示
   - 顧客情報表示
   - 関連取引一覧表示

### E002: 編集ボタン押下

**処理順序**:

1. **口座ID取得**
   - 現在表示中の`accountId`取得

2. **画面遷移**
   - 口座編集画面に遷移（`/accounts/:accountId/edit`）

### E003: ステータス変更ボタン押下

**処理順序**:

1. **現在ステータス確認**
   - 現在の口座ステータスを取得

2. **変更可能ステータス表示**
   - ステータス変更ダイアログ表示
   - 変更可能なステータス選択肢表示

3. **変更確認**
   - 選択されたステータスの確認ダイアログ
   - 「口座ステータスを変更しますか？」

### E004: ステータス変更確認実行

**処理順序**:

1. **業務ルールチェック**
   - 残高がある場合の解約制限
   - 進行中取引がある場合の制限

2. **ステータス更新API呼び出し**
   - `PUT /api/accounts/:accountId/status` 呼び出し
   - ステータス更新実行

3. **更新結果処理**
   - **成功時**: 成功メッセージ表示、画面更新
   - **失敗時**: エラーメッセージ表示

4. **監査ログ記録**
   - `audit_logs`にステータス変更履歴記録

### E005: 顧客詳細ボタン押下

**処理順序**:

1. **顧客ID取得**
   - 口座に紐づく`customerId`取得

2. **画面遷移**
   - 顧客詳細画面に遷移（`/customers/:customerId`）

### E006: 戻るボタン押下

**処理順序**:

1. **画面遷移**
   - 口座一覧画面に遷移（`/accounts/list`）

### E007: 取引詳細ボタン押下

**処理順序**:

1. **取引ID取得**
   - テーブル行から`transactionId`取得

2. **画面遷移**
   - 取引履歴画面に遷移（`/transactions/history?transactionId=xxx`）

### E008: 全件表示ボタン押下

**処理順序**:

1. **画面遷移**
   - 取引履歴画面に遷移（`/transactions/history?accountId=xxx`）

## データベース操作詳細

### ステータス変更制約チェック

```sql
-- 残高チェック（解約時）
SELECT balance
FROM accounts
WHERE account_id = $1
  AND balance != 0;

-- 進行中取引チェック
SELECT COUNT(*)
FROM transactions
WHERE (source_account_id = $1 OR destination_account_id = $1)
  AND status IN ('PENDING_VERIFICATION', 'APPROVED');
```

### 監査ログ記録（ステータス変更時）

```sql
INSERT INTO audit_logs (
  log_id,
  user_id,
  action,
  entity_type,
  entity_id,
  old_values,
  new_values,
  timestamp
) VALUES (
  $1, -- UUID
  $2, -- user_id
  'UPDATE_ACCOUNT_STATUS',
  'ACCOUNT',
  $3, -- account_id
  $4, -- 変更前のステータス情報JSON
  $5, -- 変更後のステータス情報JSON
  NOW()
);
```

## エラーハンドリング

| エラー種別         | 条件                                   | メッセージ                                             | 対応テーブル   |
| ------------------ | -------------------------------------- | ------------------------------------------------------ | -------------- |
| 口座不存在         | `accounts`テーブルに該当レコードなし   | 「口座が見つかりません」                               | `accounts`     |
| 顧客削除済み       | 関連顧客が`is_deleted = true`          | 「この口座の顧客は削除済みです」                       | `customers`    |
| ステータス変更不可 | 残高がある状態での解約                 | 「残高がある口座は解約できません」                     | `accounts`     |
| 進行中取引存在     | 進行中取引がある状態でのステータス変更 | 「進行中の取引があるため、ステータスを変更できません」 | `transactions` |
| データ取得失敗     | SQL実行エラー                          | 「口座情報の読み込みに失敗しました」                   | `accounts`     |
| 更新権限不足       | ステータス変更権限なし                 | 「口座ステータスを変更する権限がありません」           | `users`        |
| ネットワークエラー | API通信失敗                            | 「通信エラーが発生しました」                           | -              |

## 画面遷移

| 遷移先                                  | 条件               | 方法           | 使用データ                    |
| --------------------------------------- | ------------------ | -------------- | ----------------------------- |
| 口座一覧（`/accounts/list`）            | 戻るボタン押下     | ナビゲーション | -                             |
| 口座編集（`/accounts/:accountId/edit`） | 編集ボタン押下     | ナビゲーション | `accounts.account_id`         |
| 顧客詳細（`/customers/:customerId`）    | 顧客詳細ボタン押下 | ナビゲーション | `customers.customer_id`       |
| 取引履歴（`/transactions/history`）     | 取引詳細ボタン押下 | ナビゲーション | `transactions.transaction_id` |
| 取引履歴（`/transactions/history`）     | 全件表示ボタン押下 | ナビゲーション | `accounts.account_id`         |

## 表示フォーマット

### 口座種別表示

| DB値          | 表示名   | アイコン           | 色        |
| ------------- | -------- | ------------------ | --------- |
| SAVINGS       | 普通預金 | AccountBalanceIcon | primary   |
| CHECKING      | 当座預金 | BusinessIcon       | secondary |
| FIXED_DEPOSIT | 定期預金 | SavingsIcon        | success   |

### ステータス表示

| DB値      | 表示名   | 色      |
| --------- | -------- | ------- |
| ACTIVE    | 有効     | success |
| CLOSED    | 解約済み | default |
| SUSPENDED | 停止中   | warning |

### 顧客区分表示

| DB値       | 表示名 | アイコン     | 色        |
| ---------- | ------ | ------------ | --------- |
| INDIVIDUAL | 個人   | PersonIcon   | primary   |
| CORPORATE  | 法人   | BusinessIcon | secondary |

### 取引種別表示

| DB値     | 表示名 | 色      | アイコン      |
| -------- | ------ | ------- | ------------- |
| INCOMING | 入金   | success | ArrowUpIcon   |
| OUTGOING | 出金   | error   | ArrowDownIcon |

### 残高表示フォーマット

- **形式**: `¥1,234,567`
- **負の値**: 赤色表示
- **大きなフォント**: h4サイズ

### 日付フォーマット

- **開設日・更新日**: `YYYY年MM月DD日`
- **取引日時**: `YYYY/MM/DD HH:mm`

## API仕様

### GET /api/accounts/:accountId

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "accountId": "ACC001",
    "customerId": "CUST001",
    "accountNumber": "1234567890",
    "accountType": "SAVINGS",
    "status": "ACTIVE",
    "balance": 1000000,
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-01T09:00:00Z",
    "customer": {
      "customerId": "CUST001",
      "name": "田中太郎",
      "phoneticName": "タナカタロウ",
      "customerType": "INDIVIDUAL",
      "contactInfo": {
        "email": "tanaka@example.com",
        "phone": "090-1234-5678"
      }
    }
  }
}
```

### GET /api/accounts/:accountId/transactions

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "transactionId": "TXN20240101001",
      "transactionType": "TRANSFER",
      "amount": 100000,
      "description": "振込手数料",
      "status": "COMPLETED",
      "createdAt": "2024-01-01T09:00:00Z",
      "direction": "OUTGOING",
      "counterpartAccountNumber": "0987654321",
      "counterpartCustomerName": "佐藤花子"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### PUT /api/accounts/:accountId/status

**リクエスト**:

```json
{
  "status": "SUSPENDED",
  "reason": "不正利用の疑いのため一時停止"
}
```

**レスポンス（成功）**:

```json
{
  "success": true,
  "message": "口座ステータスが更新されました",
  "data": {
    "accountId": "ACC001",
    "oldStatus": "ACTIVE",
    "newStatus": "SUSPENDED",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

**レスポンス（失敗）**:

```json
{
  "success": false,
  "message": "残高がある口座は解約できません",
  "details": {
    "currentBalance": 100000
  }
}
```

## ステータス変更ルール

### 変更可能パターン

| 現在ステータス | 変更可能ステータス | 条件                    |
| -------------- | ------------------ | ----------------------- |
| ACTIVE         | SUSPENDED          | 常に可能                |
| ACTIVE         | CLOSED             | 残高0円、進行中取引なし |
| SUSPENDED      | ACTIVE             | 常に可能                |
| SUSPENDED      | CLOSED             | 残高0円、進行中取引なし |
| CLOSED         | -                  | 変更不可                |

## テスト項目

### 正常系

- [ ] 口座詳細情報が正しく表示される
- [ ] 顧客情報が正しく表示される
- [ ] 関連取引一覧が正しく表示される
- [ ] 編集ボタンから編集画面に遷移する
- [ ] 顧客詳細ボタンから顧客詳細画面に遷移する
- [ ] ステータス変更が正常に動作する
- [ ] 取引詳細ボタンから取引履歴画面に遷移する

### 異常系

- [ ] 存在しない口座IDでアクセス時のエラー表示
- [ ] 削除済み顧客の口座へのアクセス時のエラー表示
- [ ] 残高がある状態での解約制限
- [ ] 進行中取引がある状態でのステータス変更制限
- [ ] データベース接続エラー時の適切なエラー表示

### セキュリティ

- [ ] ステータス変更の監査ログが記録される
- [ ] 権限チェックが適切に動作する
- [ ] セッション検証が適切に動作する

### パフォーマンス

- [ ] 口座詳細データの取得性能
- [ ] 関連取引データの取得性能
- [ ] ステータス更新処理の性能
