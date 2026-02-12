# SCR014: 取引確定画面

## 基本情報

- **画面ID**: SCR014
- **画面名**: 取引確定画面
- **URL**: `/transactions/final-confirmation`
- **実装ファイル**: `src/components/transaction/TransactionFinalConfirmation.tsx`
- **アクセス権限**: 認証済みユーザー（管理者のみ）

## データベース操作

### 使用テーブル

- **メインテーブル**: `transactions`
- **関連テーブル**: `accounts`, `customers`, `workflow_history`, `audit_logs`
- **操作種別**: SELECT（取引詳細取得）、UPDATE（ステータス更新・残高更新）

### 承認済み取引一覧取得SQL

```sql
SELECT
  t.transaction_id,
  t.transaction_type,
  t.source_account_id,
  t.destination_account_id,
  t.amount,
  t.description,
  t.status,
  t.verified_by,
  t.verified_at,
  t.created_at,
  sa.account_number as source_account_number,
  sa.balance as source_balance,
  sc.name as source_customer_name,
  da.account_number as destination_account_number,
  da.balance as destination_balance,
  dc.name as destination_customer_name,
  u.name as verified_by_name
FROM transactions t
LEFT JOIN accounts sa ON t.source_account_id = sa.account_id
LEFT JOIN customers sc ON sa.customer_id = sc.customer_id
LEFT JOIN accounts da ON t.destination_account_id = da.account_id
LEFT JOIN customers dc ON da.customer_id = dc.customer_id
LEFT JOIN users u ON t.verified_by = u.user_id
WHERE t.status = 'APPROVED'
ORDER BY t.verified_at ASC;
```

### 取引確定処理SQL（振込の場合）

```sql
-- トランザクション開始
BEGIN;

-- 振込元口座の残高更新
UPDATE accounts
SET
  balance = balance - $1,
  updated_at = NOW()
WHERE account_id = $2
  AND balance >= $1;

-- 振込先口座の残高更新
UPDATE accounts
SET
  balance = balance + $1,
  updated_at = NOW()
WHERE account_id = $3;

-- 取引ステータス更新
UPDATE transactions
SET
  status = 'COMPLETED',
  executed_by = $4,
  executed_at = NOW(),
  updated_at = NOW()
WHERE transaction_id = $5
  AND status = 'APPROVED';

-- コミット
COMMIT;
```

### ワークフロー履歴記録SQL

```sql
INSERT INTO workflow_history (
  step_id,
  transaction_id,
  from_status,
  to_status,
  performed_by,
  performed_at,
  comments
) VALUES (
  $1, -- UUID
  $2, -- transaction_id
  'APPROVED',
  'COMPLETED',
  $3, -- performed_by (user_id)
  NOW(),
  '取引確定・実行完了'
);
```

## 画面項目

### 検索・フィルター

| 項目ID | 項目名       | 種別             | 必須 | 制約                            | 初期値 | DB項目 |
| ------ | ------------ | ---------------- | ---- | ------------------------------- | ------ | ------ |
| TFC001 | 取引タイプ   | セレクトボックス | -    | ALL/TRANSFER/DEPOSIT/WITHDRAWAL | ALL    | -      |
| TFC002 | 金額範囲From | 数値入力         | -    | 0以上                           | 空     | -      |
| TFC003 | 金額範囲To   | 数値入力         | -    | From以上                        | 空     | -      |
| TFC004 | 承認日From   | 日付入力         | -    | -                               | 空     | -      |
| TFC005 | 承認日To     | 日付入力         | -    | From以降                        | 空     | -      |
| TFC006 | 承認者       | テキスト入力     | -    | 50文字以内                      | 空     | -      |
| TFC007 | 検索ボタン   | ボタン           | -    | -                               | -      | -      |
| TFC008 | クリアボタン | ボタン           | -    | -                               | -      | -      |

### 取引一覧テーブル

| 項目ID | 項目名           | 種別     | 必須 | 制約 | 初期値     | DB項目           |
| ------ | ---------------- | -------- | ---- | ---- | ---------- | ---------------- |
| TFC009 | 取引一覧テーブル | テーブル | -    | -    | 取引データ | `transactions.*` |
| TFC010 | 件数表示         | 表示項目 | -    | -    | 件数       | COUNT(\*)        |

### 取引テーブル列定義

| 列ID   | 列名       | データ型      | 表示形式         | DB項目                                                    |
| ------ | ---------- | ------------- | ---------------- | --------------------------------------------------------- |
| TXN001 | 取引ID     | VARCHAR(20)   | そのまま         | `transactions.transaction_id`                             |
| TXN002 | 取引タイプ | ENUM          | チップ表示       | `transactions.transaction_type`                           |
| TXN003 | 振込元     | VARCHAR       | 顧客名：口座番号 | `source_customer_name`, `source_account_number`           |
| TXN004 | 振込先     | VARCHAR       | 顧客名：口座番号 | `destination_customer_name`, `destination_account_number` |
| TXN005 | 金額       | DECIMAL(15,2) | 通貨フォーマット | `transactions.amount`                                     |
| TXN006 | 取引内容   | TEXT          | 省略表示         | `transactions.description`                                |
| TXN007 | 承認者     | VARCHAR       | そのまま         | `verified_by_name`                                        |
| TXN008 | 承認日時   | TIMESTAMP     | YYYY/MM/DD HH:mm | `transactions.verified_at`                                |
| TXN009 | 操作       | ボタン        | 確定・取消ボタン | -                                                         |

### 取引詳細モーダル

| 項目ID | 項目名       | 種別           | 必須 | 制約       | 初期値 | DB項目 |
| ------ | ------------ | -------------- | ---- | ---------- | ------ | ------ |
| TFC011 | 詳細表示     | モーダル       | -    | -          | -      | -      |
| TFC012 | 確定ボタン   | ボタン         | -    | -          | -      | -      |
| TFC013 | 取消ボタン   | ボタン         | -    | -          | -      | -      |
| TFC014 | 取消理由     | テキストエリア | ※    | 取消時必須 | 空     | -      |
| TFC015 | 閉じるボタン | ボタン         | -    | -          | -      | -      |

### 残高確認表示

| 項目ID | 項目名           | 種別     | 必須 | 制約 | 初期値 | DB項目                |
| ------ | ---------------- | -------- | ---- | ---- | ------ | --------------------- |
| TFC016 | 振込元現在残高   | 表示項目 | -    | -    | DB値   | `source_balance`      |
| TFC017 | 振込元実行後残高 | 表示項目 | -    | -    | 計算値 | -                     |
| TFC018 | 振込先現在残高   | 表示項目 | -    | -    | DB値   | `destination_balance` |
| TFC019 | 振込先実行後残高 | 表示項目 | -    | -    | 計算値 | -                     |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **権限確認**
   - ユーザーが管理者であることを確認
   - 一般行員の場合はアクセス拒否（403エラー）

2. **承認済み取引データ取得**
   - `GET /api/transactions/approved` 呼び出し
   - `transactions`テーブルから承認済み取引取得

3. **画面表示**
   - 検索フィルター表示
   - 取引一覧テーブル表示
   - 件数表示

### E002: 検索ボタン押下

**処理順序**:

1. **検索条件取得**
   - フィルター項目の値を取得
   - 条件の妥当性チェック

2. **検索API呼び出し**
   - `GET /api/transactions/approved` 呼び出し
   - 検索条件をクエリパラメータで送信

3. **結果表示**
   - 検索結果をテーブルに表示
   - 件数更新

### E003: クリアボタン押下

**処理順序**:

1. **フィルター初期化**
   - 全検索条件をクリア
   - 初期状態に戻す

2. **全件再取得**
   - 条件なしで取引一覧を再取得

### E004: 取引詳細表示

**処理順序**:

1. **取引ID取得**
   - テーブル行から`transactionId`取得

2. **詳細データ取得**
   - `GET /api/transactions/:transactionId` 呼び出し
   - 取引詳細情報取得

3. **残高計算**
   - 実行後残高の計算
   - 残高不足チェック

4. **モーダル表示**
   - 取引詳細をモーダルで表示
   - 残高情報表示
   - 確定・取消ボタン表示

### E005: 確定ボタン押下

**処理順序**:

1. **最終残高確認**
   - 振込元口座の最新残高取得
   - 残高不足チェック

2. **確定確認ダイアログ表示**
   - 「この取引を確定・実行しますか？」
   - 実行後残高を表示

3. **取引確定処理**
   - `PUT /api/transactions/:transactionId/execute` 呼び出し
   - データベーストランザクション実行

4. **処理結果**
   - **成功時**: 成功メッセージ表示、一覧から削除
   - **失敗時**: エラーメッセージ表示

5. **ワークフロー記録**
   - `workflow_history`に確定履歴記録
   - `audit_logs`に監査ログ記録

### E006: 取消ボタン押下

**処理順序**:

1. **取消理由入力確認**
   - 取消理由が入力されているかチェック
   - 未入力の場合はエラー表示

2. **取消確認ダイアログ表示**
   - 「この取引を取り消しますか？」
   - 取消理由を表示

3. **取消処理**
   - `PUT /api/transactions/:transactionId/cancel` 呼び出し
   - ステータスを`CANCELLED`に更新

4. **処理結果**
   - **成功時**: 成功メッセージ表示、一覧から削除
   - **失敗時**: エラーメッセージ表示

5. **ワークフロー記録**
   - `workflow_history`に取消履歴記録
   - `audit_logs`に監査ログ記録

## データベース操作詳細

### 残高不足チェックSQL

```sql
SELECT
  a.balance,
  (a.balance - $1) as balance_after_transaction
FROM accounts a
WHERE a.account_id = $2
  AND a.status = 'ACTIVE'
  AND a.balance >= $1;
```

### 監査ログ記録（確定時）

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
  'EXECUTE_TRANSACTION',
  'TRANSACTION',
  $3, -- transaction_id
  '{"status": "APPROVED"}',
  '{"status": "COMPLETED"}',
  NOW()
);
```

### 口座残高変更ログ記録

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
  'UPDATE_ACCOUNT_BALANCE',
  'ACCOUNT',
  $3, -- account_id
  $4, -- '{"balance": 旧残高}'
  $5, -- '{"balance": 新残高}'
  NOW()
);
```

## エラーハンドリング

| エラー種別           | 条件                   | メッセージ                         | 対応テーブル   |
| -------------------- | ---------------------- | ---------------------------------- | -------------- |
| 権限不足             | 一般行員がアクセス     | 「取引を確定する権限がありません」 | `users`        |
| 取引不存在           | 該当取引なし           | 「取引が見つかりません」           | `transactions` |
| ステータス不正       | 承認済み以外の取引     | 「この取引は確定できません」       | `transactions` |
| 残高不足             | 振込元口座の残高不足   | 「残高が不足しています」           | `accounts`     |
| 口座状態異常         | 口座が無効・停止中     | 「口座が利用できない状態です」     | `accounts`     |
| 取消理由未入力       | 取消時に理由が空       | 「取消理由を入力してください」     | -              |
| 同時更新エラー       | 他ユーザーが先に処理   | 「この取引は既に処理されています」 | `transactions` |
| トランザクション失敗 | データベース処理エラー | 「取引の実行に失敗しました」       | `transactions` |
| ネットワークエラー   | API通信失敗            | 「通信エラーが発生しました」       | -              |

## 画面遷移

| 遷移先                              | 条件       | 方法             | 使用データ |
| ----------------------------------- | ---------- | ---------------- | ---------- |
| 取引履歴（`/transactions/history`） | 確定完了後 | 自動リダイレクト | -          |
| 取引履歴（`/transactions/history`） | 取消完了後 | 自動リダイレクト | -          |

## 表示フォーマット

### 取引タイプ表示

| DB値       | 表示名 | 色      |
| ---------- | ------ | ------- |
| TRANSFER   | 振込   | primary |
| DEPOSIT    | 入金   | success |
| WITHDRAWAL | 出金   | warning |

### 口座表示フォーマット

- **形式**: `顧客名：口座番号`
- **例**: `田中太郎：1234567890`
- **未設定時**: `-`

### 金額・残高表示フォーマット

- **形式**: `¥1,234,567`
- **色**:
  - 正の値: 黒色
  - 負の値: 赤色
  - 残高不足警告: 赤色背景

### 日付表示フォーマット

- **形式**: `YYYY/MM/DD HH:mm`
- **例**: `2024/01/01 09:00`

### 残高変動表示

- **現在残高**: `¥1,000,000`
- **実行後残高**: `¥900,000 (▼¥100,000)`
- **増加時**: 緑色矢印 `▲`
- **減少時**: 赤色矢印 `▼`

## API仕様

### GET /api/transactions/approved

**クエリパラメータ**:

```
?type=TRANSFER&amountFrom=10000&amountTo=100000&verifiedFrom=2024-01-01&verifiedTo=2024-01-31&verifiedBy=管理者
```

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "transactionId": "TXN20240101001",
      "transactionType": "TRANSFER",
      "sourceAccountId": "ACC001",
      "destinationAccountId": "ACC002",
      "amount": 100000,
      "description": "振込手数料",
      "status": "APPROVED",
      "verifiedBy": "USER002",
      "verifiedAt": "2024-01-01T10:00:00Z",
      "createdAt": "2024-01-01T09:00:00Z",
      "sourceAccountNumber": "1234567890",
      "sourceBalance": 1000000,
      "sourceCustomerName": "田中太郎",
      "destinationAccountNumber": "0987654321",
      "destinationBalance": 500000,
      "destinationCustomerName": "佐藤花子",
      "verifiedByName": "管理者"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 50
  }
}
```

### PUT /api/transactions/:transactionId/execute

**レスポンス（成功）**:

```json
{
  "success": true,
  "message": "取引が正常に実行されました",
  "data": {
    "transactionId": "TXN20240101001",
    "status": "COMPLETED",
    "executedBy": "USER003",
    "executedAt": "2024-01-01T11:00:00Z",
    "balanceChanges": {
      "sourceAccount": {
        "accountId": "ACC001",
        "oldBalance": 1000000,
        "newBalance": 900000
      },
      "destinationAccount": {
        "accountId": "ACC002",
        "oldBalance": 500000,
        "newBalance": 600000
      }
    }
  }
}
```

### PUT /api/transactions/:transactionId/cancel

**リクエスト**:

```json
{
  "reason": "顧客からの取消依頼"
}
```

**レスポンス（成功）**:

```json
{
  "success": true,
  "message": "取引が取り消されました",
  "data": {
    "transactionId": "TXN20240101001",
    "status": "CANCELLED",
    "executedBy": "USER003",
    "executedAt": "2024-01-01T11:00:00Z",
    "cancellationReason": "顧客からの取消依頼"
  }
}
```

## バリデーションルール

### 検索条件バリデーション

| 項目     | ルール         | エラーメッセージ                            | 検証タイミング |
| -------- | -------------- | ------------------------------------------- | -------------- |
| 金額範囲 | From ≤ To      | 「金額範囲の設定が正しくありません」        | 検索時         |
| 日付範囲 | From ≤ To      | 「日付範囲の設定が正しくありません」        | 検索時         |
| 取消理由 | 必須（取消時） | 「取消理由を入力してください」              | 取消時         |
| 取消理由 | 500文字以内    | 「取消理由は500文字以内で入力してください」 | 取消時         |

### 業務ルールバリデーション

| 項目         | ルール               | エラーメッセージ               | 検証タイミング |
| ------------ | -------------------- | ------------------------------ | -------------- |
| 残高チェック | 振込元口座の残高確認 | 「残高が不足しています」       | 確定時         |
| 口座状態     | アクティブ口座のみ   | 「口座が利用できない状態です」 | 確定時         |

## テスト項目

### 正常系

- [ ] 承認済み取引一覧が正しく表示される
- [ ] 検索フィルターが正常に動作する
- [ ] 取引詳細モーダルが正しく表示される
- [ ] 残高計算が正確に表示される
- [ ] 確定処理が正常に完了する
- [ ] 取消処理が正常に完了する
- [ ] 口座残高が正しく更新される

### 異常系

- [ ] 確定権限なしでアクセス時のエラー表示
- [ ] 存在しない取引IDでアクセス時のエラー表示
- [ ] 残高不足時のエラー表示
- [ ] 取消理由未入力時のバリデーションエラー
- [ ] 同時更新エラー時の適切なエラー表示
- [ ] トランザクション失敗時のロールバック

### セキュリティ

- [ ] 権限チェックが適切に動作する
- [ ] 確定・取消操作の監査ログが記録される
- [ ] 残高変更の監査ログが記録される
- [ ] セッション検証が適切に動作する

### パフォーマンス

- [ ] 大量取引データでの検索性能
- [ ] トランザクション処理の性能
- [ ] 残高計算の応答性能
- [ ] モーダル表示の応答性能
