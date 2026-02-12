# SCR012: 取引確認画面

## 基本情報

- **画面ID**: SCR012
- **画面名**: 取引確認画面
- **URL**: `/transactions/confirmation`
- **実装ファイル**: `src/components/transaction/TransactionConfirmation.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **参照テーブル**: `accounts`, `customers`
- **作成テーブル**: `transactions`, `workflow_history`, `audit_logs`
- **操作種別**: SELECT（口座・顧客情報取得）、INSERT（取引作成）

### 口座詳細取得SQL

```sql
SELECT
  a.account_id,
  a.customer_id,
  a.account_number,
  a.account_type,
  a.status,
  a.balance,
  c.name as customer_name
FROM accounts a
INNER JOIN customers c ON a.customer_id = c.customer_id
WHERE a.account_id = $1
  AND a.status = 'ACTIVE'
  AND c.is_deleted = false;
```

### 取引作成SQL

```sql
INSERT INTO transactions (
  transaction_id,
  transaction_type,
  source_account_id,
  destination_account_id,
  amount,
  description,
  status,
  created_by,
  created_at
) VALUES (
  $1, -- 自動生成されたID
  $2, -- transaction_type
  $3, -- source_account_id
  $4, -- destination_account_id
  $5, -- amount
  $6, -- description
  'PENDING_VERIFICATION', -- 初期状態
  $7, -- created_by (user_id)
  NOW()
);
```

### ワークフロー履歴作成SQL

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
  NULL, -- 初回作成時はfrom_statusはNULL
  'PENDING_VERIFICATION',
  $3, -- performed_by (user_id)
  NOW(),
  '取引作成'
);
```

## 画面項目

### 取引情報表示

| 項目ID | 項目名     | 種別     | 必須 | 制約 | 初期値     | DB項目       |
| ------ | ---------- | -------- | ---- | ---- | ---------- | ------------ |
| TRC001 | 取引タイプ | チップ   | -    | -    | 入力データ | -            |
| TRC002 | 振込元口座 | 表示項目 | -    | -    | 入力データ | `accounts.*` |
| TRC003 | 振込先口座 | 表示項目 | -    | -    | 入力データ | `accounts.*` |
| TRC004 | 金額       | 表示項目 | -    | -    | 入力データ | -            |
| TRC005 | 取引日     | 表示項目 | -    | -    | 入力データ | -            |
| TRC006 | 取引内容   | 表示項目 | -    | -    | 入力データ | -            |

### 操作ボタン

| 項目ID | 項目名               | 種別   | 必須 | 制約 | 初期値 | DB項目 |
| ------ | -------------------- | ------ | ---- | ---- | ------ | ------ |
| TRC007 | キャンセルボタン     | ボタン | -    | -    | -      | -      |
| TRC008 | 修正ボタン           | ボタン | -    | -    | -      | -      |
| TRC009 | 確認・取引作成ボタン | ボタン | -    | -    | -      | -      |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **取引データ取得**
   - location.stateから取引入力データを取得
   - データ存在チェック

2. **口座・顧客情報取得**
   - 関連口座の詳細情報取得
   - 顧客情報の結合

3. **データ検証**
   - 口座の有効性確認
   - 残高確認（出金・振込元の場合）

4. **画面表示**
   - 取引内容の確認表示
   - 口座情報の詳細表示

### E002: 修正ボタン押下

**処理順序**:

1. **データ引き継ぎ準備**
   - 現在の確認データを取引入力形式に変換

2. **画面遷移**
   - 取引入力画面に遷移（`/transactions/input`）
   - 確認データをstateで引き継ぎ

### E003: キャンセルボタン押下

**処理順序**:

1. **キャンセル確認ダイアログ表示**
   - 「取引をキャンセルしますか？入力した内容は保存されません。」

2. **確認結果処理**
   - **キャンセル実行**: 取引履歴画面に遷移
   - **キャンセル中止**: ダイアログを閉じて画面維持

### E004: 確認・取引作成ボタン押下

**処理順序**:

1. **最終データ検証**
   - セッション情報確認
   - 取引データの整合性確認
   - 口座状態の再確認

2. **取引ID生成**
   - 一意の取引IDを生成
   - 形式: `TXN` + タイムスタンプ + 連番

3. **取引作成API呼び出し**
   - `POST /api/transactions` 呼び出し
   - 取引データを送信

4. **データベース処理**
   - `transactions`テーブルに新規レコード作成
   - 初期状態を`PENDING_VERIFICATION`に設定
   - `workflow_history`に作成履歴を記録
   - `audit_logs`に監査ログを記録

5. **作成結果処理**
   - **成功時**:
     - 成功メッセージ表示（取引ID含む）
     - 3秒後に取引検証画面に自動遷移
   - **失敗時**:
     - エラーメッセージ表示
     - 画面状態維持

## データベース操作詳細

### 取引ID生成ロジック

```sql
-- 取引ID生成（例：TXN20240101001）
SELECT
  'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') ||
  LPAD((
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(transaction_id FROM 12) AS INTEGER)
    ), 0) + 1
    FROM transactions
    WHERE transaction_id LIKE 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || '%'
  )::TEXT, 3, '0') as new_transaction_id;
```

### 監査ログ記録（作成時）

```sql
INSERT INTO audit_logs (
  log_id,
  user_id,
  action,
  entity_type,
  entity_id,
  new_values,
  timestamp
) VALUES (
  $1, -- UUID
  $2, -- user_id
  'CREATE_TRANSACTION',
  'TRANSACTION',
  $3, -- transaction_id
  $4, -- 作成された取引情報JSON
  NOW()
);
```

## 表示フォーマット

### 取引タイプ表示

| DB値       | 表示名 | 色      |
| ---------- | ------ | ------- |
| TRANSFER   | 振込   | primary |
| DEPOSIT    | 入金   | success |
| WITHDRAWAL | 出金   | warning |

### 口座表示フォーマット

- **形式**: `顧客名：口座番号 (残高: ¥1,234,567)`
- **例**: `田中太郎：1234567890 (残高: ¥1,000,000)`

### 金額表示フォーマット

- **形式**: `¥1,234,567`
- **色**: プライマリカラー
- **フォントサイズ**: 大きめ（h6）

### 日付表示フォーマット

- **形式**: `2024年1月1日（月曜日）`
- **例**: `2024年1月1日（月曜日）`

## エラーハンドリング

| エラー種別         | 条件                    | メッセージ                                                         | 対応テーブル   |
| ------------------ | ----------------------- | ------------------------------------------------------------------ | -------------- |
| データ不存在       | 取引データがstate未設定 | 「取引データが見つかりません。取引入力画面からやり直してください」 | -              |
| 口座情報取得失敗   | 口座詳細取得エラー      | 「口座情報の取得に失敗しました」                                   | `accounts`     |
| 口座状態変更       | 口座が無効化された      | 「選択された口座は現在利用できません」                             | `accounts`     |
| 残高不足           | 出金・振込時の残高不足  | 「残高が不足しています」                                           | `accounts`     |
| 取引作成失敗       | データベース作成エラー  | 「取引の作成に失敗しました」                                       | `transactions` |
| セッション期限切れ | 認証情報無効            | 「セッションが期限切れです。再度ログインしてください」             | `users`        |
| ネットワークエラー | API通信失敗             | 「通信エラーが発生しました」                                       | -              |

## 画面遷移

| 遷移先                                   | 条件           | 方法             | 使用データ |
| ---------------------------------------- | -------------- | ---------------- | ---------- |
| 取引入力（`/transactions/input`）        | 修正ボタン押下 | ナビゲーション   | 確認データ |
| 取引履歴（`/transactions/history`）      | キャンセル実行 | ナビゲーション   | -          |
| 取引検証（`/transactions/verification`） | 取引作成成功   | 自動リダイレクト | -          |

## API仕様

### POST /api/transactions

**リクエスト**:

```json
{
  "type": "TRANSFER",
  "sourceAccountId": "ACC001",
  "destinationAccountId": "ACC002",
  "amount": 100000,
  "description": "振込手数料",
  "transactionDate": "2024-01-01T00:00:00Z"
}
```

**レスポンス（成功）**:

```json
{
  "success": true,
  "data": {
    "transactionId": "TXN20240101001",
    "type": "TRANSFER",
    "sourceAccountId": "ACC001",
    "destinationAccountId": "ACC002",
    "amount": 100000,
    "description": "振込手数料",
    "status": "PENDING_VERIFICATION",
    "createdBy": "USER001",
    "createdAt": "2024-01-01T09:00:00Z"
  },
  "message": "取引が正常に作成されました"
}
```

**レスポンス（失敗）**:

```json
{
  "success": false,
  "message": "残高が不足しています",
  "details": {
    "currentBalance": 50000,
    "requestedAmount": 100000
  }
}
```

## 確認項目チェックリスト

### 取引内容確認

- [ ] 取引タイプが正しく表示されている
- [ ] 振込元口座が正しく表示されている（該当時）
- [ ] 振込先口座が正しく表示されている（該当時）
- [ ] 金額が正しく表示されている
- [ ] 取引日が正しく表示されている
- [ ] 取引内容が正しく表示されている

### 口座情報確認

- [ ] 口座番号が正しく表示されている
- [ ] 顧客名が正しく表示されている
- [ ] 残高情報が最新である
- [ ] 口座状態がアクティブである

### 業務ルール確認

- [ ] 残高が十分である（出金・振込元の場合）
- [ ] 取引日が営業日である
- [ ] 振込元と振込先が異なる口座である（振込の場合）

## テスト項目

### 正常系

- [ ] 振込取引の確認が正しく表示される
- [ ] 入金取引の確認が正しく表示される
- [ ] 出金取引の確認が正しく表示される
- [ ] 修正ボタンで入力画面に戻る
- [ ] 取引作成が正常に完了する
- [ ] 作成成功後に検証画面に遷移する

### 異常系

- [ ] 取引データなしでアクセス時のエラー表示
- [ ] 口座情報取得失敗時のエラー表示
- [ ] 残高不足時のエラー表示
- [ ] 取引作成失敗時のエラー表示
- [ ] セッション期限切れ時のエラー表示

### セキュリティ

- [ ] 取引作成の監査ログが記録される
- [ ] 権限チェックが適切に動作する
- [ ] セッション検証が適切に動作する

### パフォーマンス

- [ ] 口座情報取得の性能
- [ ] 取引作成処理の性能
- [ ] 画面表示の応答性能
