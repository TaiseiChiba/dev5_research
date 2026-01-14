# SCR013: 取引検証画面

## 基本情報

- **画面ID**: SCR013
- **画面名**: 取引検証画面
- **URL**: `/transactions/verification`
- **実装ファイル**: `src/components/transaction/TransactionVerification.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **メインテーブル**: `transactions`
- **関連テーブル**: `accounts`, `customers`, `workflow_history`, `audit_logs`
- **操作種別**: SELECT（取引一覧・詳細取得）、UPDATE（ステータス更新）

### 検証待ち取引一覧取得SQL

```sql
SELECT
  t.transaction_id,
  t.transaction_type,
  t.source_account_id,
  t.destination_account_id,
  t.amount,
  t.description,
  t.status,
  t.created_by,
  t.created_at,
  sa.account_number as source_account_number,
  sc.name as source_customer_name,
  da.account_number as destination_account_number,
  dc.name as destination_customer_name,
  u.name as created_by_name
FROM transactions t
LEFT JOIN accounts sa ON t.source_account_id = sa.account_id
LEFT JOIN customers sc ON sa.customer_id = sc.customer_id
LEFT JOIN accounts da ON t.destination_account_id = da.account_id
LEFT JOIN customers dc ON da.customer_id = dc.customer_id
LEFT JOIN users u ON t.created_by = u.user_id
WHERE t.status = 'PENDING_VERIFICATION'
ORDER BY t.created_at ASC;
```

### 取引ステータス更新SQL

```sql
UPDATE transactions
SET
  status = $1,
  verified_by = $2,
  verified_at = NOW(),
  updated_at = NOW()
WHERE transaction_id = $3
  AND status = 'PENDING_VERIFICATION';
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
  'PENDING_VERIFICATION',
  $3, -- to_status (APPROVED/REJECTED)
  $4, -- performed_by (user_id)
  NOW(),
  $5  -- comments
);
```

## 画面項目

### 検索・フィルター

| 項目ID | 項目名       | 種別             | 必須 | 制約                            | 初期値 | DB項目 |
| ------ | ------------ | ---------------- | ---- | ------------------------------- | ------ | ------ |
| TRV001 | 取引タイプ   | セレクトボックス | -    | ALL/TRANSFER/DEPOSIT/WITHDRAWAL | ALL    | -      |
| TRV002 | 金額範囲From | 数値入力         | -    | 0以上                           | 空     | -      |
| TRV003 | 金額範囲To   | 数値入力         | -    | From以上                        | 空     | -      |
| TRV004 | 作成日From   | 日付入力         | -    | -                               | 空     | -      |
| TRV005 | 作成日To     | 日付入力         | -    | From以降                        | 空     | -      |
| TRV006 | 作成者       | テキスト入力     | -    | 50文字以内                      | 空     | -      |
| TRV007 | 検索ボタン   | ボタン           | -    | -                               | -      | -      |
| TRV008 | クリアボタン | ボタン           | -    | -                               | -      | -      |

### 取引一覧テーブル

| 項目ID | 項目名           | 種別     | 必須 | 制約 | 初期値     | DB項目           |
| ------ | ---------------- | -------- | ---- | ---- | ---------- | ---------------- |
| TRV009 | 取引一覧テーブル | テーブル | -    | -    | 取引データ | `transactions.*` |
| TRV010 | 件数表示         | 表示項目 | -    | -    | 件数       | COUNT(\*)        |

### 取引テーブル列定義

| 列ID   | 列名       | データ型      | 表示形式         | DB項目                                                    |
| ------ | ---------- | ------------- | ---------------- | --------------------------------------------------------- |
| TXN001 | 取引ID     | VARCHAR(20)   | そのまま         | `transactions.transaction_id`                             |
| TXN002 | 取引タイプ | ENUM          | チップ表示       | `transactions.transaction_type`                           |
| TXN003 | 振込元     | VARCHAR       | 顧客名：口座番号 | `source_customer_name`, `source_account_number`           |
| TXN004 | 振込先     | VARCHAR       | 顧客名：口座番号 | `destination_customer_name`, `destination_account_number` |
| TXN005 | 金額       | DECIMAL(15,2) | 通貨フォーマット | `transactions.amount`                                     |
| TXN006 | 取引内容   | TEXT          | 省略表示         | `transactions.description`                                |
| TXN007 | 作成者     | VARCHAR       | そのまま         | `created_by_name`                                         |
| TXN008 | 作成日時   | TIMESTAMP     | YYYY/MM/DD HH:mm | `transactions.created_at`                                 |
| TXN009 | 操作       | ボタン        | 承認・却下ボタン | -                                                         |

### 取引詳細モーダル

| 項目ID | 項目名       | 種別           | 必須 | 制約       | 初期値 | DB項目 |
| ------ | ------------ | -------------- | ---- | ---------- | ------ | ------ |
| TRV011 | 詳細表示     | モーダル       | -    | -          | -      | -      |
| TRV012 | 承認ボタン   | ボタン         | -    | -          | -      | -      |
| TRV013 | 却下ボタン   | ボタン         | -    | -          | -      | -      |
| TRV014 | 却下理由     | テキストエリア | ※    | 却下時必須 | 空     | -      |
| TRV015 | 閉じるボタン | ボタン         | -    | -          | -      | -      |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **権限確認**
   - ユーザーがログイン済みであることを確認
   - 一般行員と管理者の両方がアクセス可能

2. **検証待ち取引データ取得**
   - `GET /api/transactions/pending-verification` 呼び出し
   - `transactions`テーブルから検証待ち取引取得

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
   - `GET /api/transactions/pending-verification` 呼び出し
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

3. **モーダル表示**
   - 取引詳細をモーダルで表示
   - 承認・却下ボタン表示

### E005: 承認ボタン押下

**処理順序**:

1. **承認確認ダイアログ表示**
   - 「この取引を承認しますか？」

2. **承認処理**
   - `PUT /api/transactions/:transactionId/approve` 呼び出し
   - ステータスを`APPROVED`に更新

3. **処理結果**
   - **成功時**: 成功メッセージ表示、一覧から削除
   - **失敗時**: エラーメッセージ表示

4. **ワークフロー記録**
   - `workflow_history`に承認履歴記録
   - `audit_logs`に監査ログ記録

### E006: 却下ボタン押下

**処理順序**:

1. **却下理由入力確認**
   - 却下理由が入力されているかチェック
   - 未入力の場合はエラー表示

2. **却下確認ダイアログ表示**
   - 「この取引を却下しますか？」
   - 却下理由を表示

3. **却下処理**
   - `PUT /api/transactions/:transactionId/reject` 呼び出し
   - ステータスを`REJECTED`に更新

4. **処理結果**
   - **成功時**: 成功メッセージ表示、一覧から削除
   - **失敗時**: エラーメッセージ表示

5. **ワークフロー記録**
   - `workflow_history`に却下履歴記録
   - `audit_logs`に監査ログ記録

## データベース操作詳細

### 監査ログ記録（承認時）

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
  'APPROVE_TRANSACTION',
  'TRANSACTION',
  $3, -- transaction_id
  '{"status": "PENDING_VERIFICATION"}',
  '{"status": "APPROVED"}',
  NOW()
);
```

### 監査ログ記録（却下時）

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
  'REJECT_TRANSACTION',
  'TRANSACTION',
  $3, -- transaction_id
  '{"status": "PENDING_VERIFICATION"}',
  $4, -- '{"status": "REJECTED", "reason": "却下理由"}'
  NOW()
);
```

## エラーハンドリング

| エラー種別         | 条件                 | メッセージ                           | 対応テーブル   |
| ------------------ | -------------------- | ------------------------------------ | -------------- |
| 権限不足           | 未ログイン           | 「ログインが必要です」               | `users`        |
| 取引不存在         | 該当取引なし         | 「取引が見つかりません」             | `transactions` |
| ステータス不正     | 検証待ち以外の取引   | 「この取引は検証できません」         | `transactions` |
| 却下理由未入力     | 却下時に理由が空     | 「却下理由を入力してください」       | -              |
| 同時更新エラー     | 他ユーザーが先に処理 | 「この取引は既に処理されています」   | `transactions` |
| データ取得失敗     | SQL実行エラー        | 「取引情報の読み込みに失敗しました」 | `transactions` |
| ネットワークエラー | API通信失敗          | 「通信エラーが発生しました」         | -              |

## 画面遷移

| 遷移先                                         | 条件       | 方法             | 使用データ |
| ---------------------------------------------- | ---------- | ---------------- | ---------- |
| 取引確定（`/transactions/final-confirmation`） | 承認完了後 | 自動リダイレクト | -          |
| 取引履歴（`/transactions/history`）            | 却下完了後 | 自動リダイレクト | -          |

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

### 金額表示フォーマット

- **形式**: `¥1,234,567`
- **色**: プライマリカラー

### 日付表示フォーマット

- **形式**: `YYYY/MM/DD HH:mm`
- **例**: `2024/01/01 09:00`

### 取引内容表示

- **最大文字数**: 30文字
- **省略表示**: `取引内容が長い場合は...`

## API仕様

### GET /api/transactions/pending-verification

**クエリパラメータ**:

```
?type=TRANSFER&amountFrom=10000&amountTo=100000&createdFrom=2024-01-01&createdTo=2024-01-31&createdBy=田中
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
      "status": "PENDING_VERIFICATION",
      "createdBy": "USER001",
      "createdAt": "2024-01-01T09:00:00Z",
      "sourceAccountNumber": "1234567890",
      "sourceCustomerName": "田中太郎",
      "destinationAccountNumber": "0987654321",
      "destinationCustomerName": "佐藤花子",
      "createdByName": "管理者"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50
  }
}
```

### PUT /api/transactions/:transactionId/approve

**レスポンス（成功）**:

```json
{
  "success": true,
  "message": "取引が承認されました",
  "data": {
    "transactionId": "TXN20240101001",
    "status": "APPROVED",
    "verifiedBy": "USER002",
    "verifiedAt": "2024-01-01T10:00:00Z"
  }
}
```

### PUT /api/transactions/:transactionId/reject

**リクエスト**:

```json
{
  "reason": "口座残高不足のため却下"
}
```

**レスポンス（成功）**:

```json
{
  "success": true,
  "message": "取引が却下されました",
  "data": {
    "transactionId": "TXN20240101001",
    "status": "REJECTED",
    "verifiedBy": "USER002",
    "verifiedAt": "2024-01-01T10:00:00Z",
    "rejectionReason": "口座残高不足のため却下"
  }
}
```

## バリデーションルール

### 検索条件バリデーション

| 項目     | ルール         | エラーメッセージ                            | 検証タイミング |
| -------- | -------------- | ------------------------------------------- | -------------- |
| 金額範囲 | From ≤ To      | 「金額範囲の設定が正しくありません」        | 検索時         |
| 日付範囲 | From ≤ To      | 「日付範囲の設定が正しくありません」        | 検索時         |
| 却下理由 | 必須（却下時） | 「却下理由を入力してください」              | 却下時         |
| 却下理由 | 500文字以内    | 「却下理由は500文字以内で入力してください」 | 却下時         |

## テスト項目

### 正常系

- [ ] 検証待ち取引一覧が正しく表示される
- [ ] 検索フィルターが正常に動作する
- [ ] 取引詳細モーダルが正しく表示される
- [ ] 承認処理が正常に完了する
- [ ] 却下処理が正常に完了する
- [ ] ワークフロー履歴が正しく記録される

### 異常系

- [ ] 未ログインでアクセス時のリダイレクト
- [ ] 存在しない取引IDでアクセス時のエラー表示
- [ ] 却下理由未入力時のバリデーションエラー
- [ ] 同時更新エラー時の適切なエラー表示
- [ ] データベース接続エラー時の適切なエラー表示

### セキュリティ

- [ ] 権限チェックが適切に動作する
- [ ] 承認・却下操作の監査ログが記録される
- [ ] セッション検証が適切に動作する

### パフォーマンス

- [ ] 大量取引データでの検索性能
- [ ] フィルタリング処理の応答性能
- [ ] モーダル表示の応答性能
