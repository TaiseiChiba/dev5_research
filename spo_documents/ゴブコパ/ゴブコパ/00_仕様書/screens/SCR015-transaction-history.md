# SCR015: 取引履歴画面

## 基本情報

- **画面ID**: SCR015
- **画面名**: 取引履歴画面
- **URL**: `/transactions/history`
- **実装ファイル**: `src/components/transaction/TransactionHistory.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **メインテーブル**: `transactions`
- **関連テーブル**: `accounts`, `customers`, `workflow_history`, `users`
- **操作種別**: SELECT（取引履歴・詳細取得）

### 取引履歴一覧取得SQL

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
  t.verified_by,
  t.verified_at,
  t.executed_by,
  t.executed_at,
  sa.account_number as source_account_number,
  sc.name as source_customer_name,
  da.account_number as destination_account_number,
  dc.name as destination_customer_name,
  cu.name as created_by_name,
  vu.name as verified_by_name,
  eu.name as executed_by_name
FROM transactions t
LEFT JOIN accounts sa ON t.source_account_id = sa.account_id
LEFT JOIN customers sc ON sa.customer_id = sc.customer_id
LEFT JOIN accounts da ON t.destination_account_id = da.account_id
LEFT JOIN customers dc ON da.customer_id = dc.customer_id
LEFT JOIN users cu ON t.created_by = cu.user_id
LEFT JOIN users vu ON t.verified_by = vu.user_id
LEFT JOIN users eu ON t.executed_by = eu.user_id
WHERE ($1::text IS NULL OR t.transaction_type = $1)
  AND ($2::decimal IS NULL OR t.amount >= $2)
  AND ($3::decimal IS NULL OR t.amount <= $3)
  AND ($4::date IS NULL OR DATE(t.created_at) >= $4)
  AND ($5::date IS NULL OR DATE(t.created_at) <= $5)
  AND ($6::text IS NULL OR t.status = $6)
  AND ($7::text IS NULL OR (
    sc.name ILIKE '%' || $7 || '%' OR
    dc.name ILIKE '%' || $7 || '%' OR
    sa.account_number ILIKE '%' || $7 || '%' OR
    da.account_number ILIKE '%' || $7 || '%'
  ))
ORDER BY t.created_at DESC
LIMIT $8 OFFSET $9;
```

### ワークフロー履歴取得SQL

```sql
SELECT
  wh.step_id,
  wh.from_status,
  wh.to_status,
  wh.performed_by,
  wh.performed_at,
  wh.comments,
  u.name as performed_by_name
FROM workflow_history wh
LEFT JOIN users u ON wh.performed_by = u.user_id
WHERE wh.transaction_id = $1
ORDER BY wh.performed_at ASC;
```

## 画面項目

### 検索・フィルター

| 項目ID | 項目名          | 種別             | 必須 | 制約                                                           | 初期値 | DB項目 |
| ------ | --------------- | ---------------- | ---- | -------------------------------------------------------------- | ------ | ------ |
| TRH001 | 取引ID          | テキスト入力     | -    | 20文字以内                                                     | 空     | -      |
| TRH002 | 取引タイプ      | セレクトボックス | -    | ALL/TRANSFER/DEPOSIT/WITHDRAWAL                                | ALL    | -      |
| TRH003 | ステータス      | セレクトボックス | -    | ALL/PENDING_VERIFICATION/APPROVED/REJECTED/COMPLETED/CANCELLED | ALL    | -      |
| TRH004 | 金額範囲From    | 数値入力         | -    | 0以上                                                          | 空     | -      |
| TRH005 | 金額範囲To      | 数値入力         | -    | From以上                                                       | 空     | -      |
| TRH006 | 取引日From      | 日付入力         | -    | -                                                              | 空     | -      |
| TRH007 | 取引日To        | 日付入力         | -    | From以降                                                       | 空     | -      |
| TRH008 | 顧客・口座      | テキスト入力     | -    | 50文字以内（顧客名・口座番号での部分一致検索）                 | 空     | -      |
| TRH009 | 検索ボタン      | ボタン           | -    | -                                                              | -      | -      |
| TRH010 | クリアボタン    | ボタン           | -    | -                                                              | -      | -      |
| TRH011 | CSVエクスポート | ボタン           | -    | -                                                              | -      | -      |

### 取引一覧テーブル

| 項目ID | 項目名           | 種別       | 必須 | 制約 | 初期値     | DB項目           |
| ------ | ---------------- | ---------- | ---- | ---- | ---------- | ---------------- |
| TRH012 | 取引一覧テーブル | テーブル   | -    | -    | 取引データ | `transactions.*` |
| TRH013 | 件数表示         | 表示項目   | -    | -    | 件数       | COUNT(\*)        |
| TRH014 | ページネーション | ページング | -    | -    | 1ページ目  | -                |

### 取引テーブル列定義

| 列ID   | 列名       | データ型      | 表示形式         | DB項目                                                    |
| ------ | ---------- | ------------- | ---------------- | --------------------------------------------------------- |
| TXN001 | 取引ID     | VARCHAR(20)   | そのまま         | `transactions.transaction_id`                             |
| TXN002 | 取引タイプ | ENUM          | チップ表示       | `transactions.transaction_type`                           |
| TXN003 | 振込元     | VARCHAR       | 顧客名：口座番号 | `source_customer_name`, `source_account_number`           |
| TXN004 | 振込先     | VARCHAR       | 顧客名：口座番号 | `destination_customer_name`, `destination_account_number` |
| TXN005 | 金額       | DECIMAL(15,2) | 通貨フォーマット | `transactions.amount`                                     |
| TXN006 | ステータス | ENUM          | チップ表示       | `transactions.status`                                     |
| TXN007 | 取引内容   | TEXT          | 省略表示         | `transactions.description`                                |
| TXN008 | 作成日時   | TIMESTAMP     | YYYY/MM/DD HH:mm | `transactions.created_at`                                 |
| TXN009 | 操作       | ボタン        | 詳細ボタン       | -                                                         |

### 取引詳細モーダル

| 項目ID | 項目名           | 種別     | 必須 | 制約 | 初期値 | DB項目 |
| ------ | ---------------- | -------- | ---- | ---- | ------ | ------ |
| TRH015 | 詳細表示         | モーダル | -    | -    | -      | -      |
| TRH016 | 基本情報タブ     | タブ     | -    | -    | -      | -      |
| TRH017 | ワークフロータブ | タブ     | -    | -    | -      | -      |
| TRH018 | 閉じるボタン     | ボタン   | -    | -    | -      | -      |

### 基本情報表示項目

| 項目ID | 項目名     | 種別     | 必須 | 制約 | 初期値 | DB項目                          |
| ------ | ---------- | -------- | ---- | ---- | ------ | ------------------------------- |
| TRH019 | 取引ID     | 表示項目 | -    | -    | DB値   | `transactions.transaction_id`   |
| TRH020 | 取引タイプ | 表示項目 | -    | -    | DB値   | `transactions.transaction_type` |
| TRH021 | 振込元口座 | 表示項目 | -    | -    | DB値   | `source_*`                      |
| TRH022 | 振込先口座 | 表示項目 | -    | -    | DB値   | `destination_*`                 |
| TRH023 | 金額       | 表示項目 | -    | -    | DB値   | `transactions.amount`           |
| TRH024 | 取引内容   | 表示項目 | -    | -    | DB値   | `transactions.description`      |
| TRH025 | ステータス | 表示項目 | -    | -    | DB値   | `transactions.status`           |
| TRH026 | 作成者     | 表示項目 | -    | -    | DB値   | `created_by_name`               |
| TRH027 | 作成日時   | 表示項目 | -    | -    | DB値   | `transactions.created_at`       |
| TRH028 | 承認者     | 表示項目 | -    | -    | DB値   | `verified_by_name`              |
| TRH029 | 承認日時   | 表示項目 | -    | -    | DB値   | `transactions.verified_at`      |
| TRH030 | 実行者     | 表示項目 | -    | -    | DB値   | `executed_by_name`              |
| TRH031 | 実行日時   | 表示項目 | -    | -    | DB値   | `transactions.executed_at`      |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **セッション確認**
   - ログイン状態確認
   - ユーザー権限確認

2. **取引履歴データ取得**
   - `GET /api/transactions/history` 呼び出し
   - デフォルト条件で最新50件取得

3. **画面表示**
   - 検索フィルター表示
   - 取引一覧テーブル表示
   - ページネーション表示

### E002: 検索ボタン押下

**処理順序**:

1. **検索条件取得**
   - フィルター項目の値を取得
   - 条件の妥当性チェック

2. **検索API呼び出し**
   - `GET /api/transactions/history` 呼び出し
   - 検索条件をクエリパラメータで送信

3. **結果表示**
   - 検索結果をテーブルに表示
   - ページネーション更新
   - 件数更新

### E003: クリアボタン押下

**処理順序**:

1. **フィルター初期化**
   - 全検索条件をクリア
   - 初期状態に戻す

2. **全件再取得**
   - 条件なしで取引履歴を再取得

### E004: ページネーション操作

**処理順序**:

1. **ページ番号取得**
   - クリックされたページ番号を取得

2. **データ取得**
   - 現在の検索条件を維持
   - 指定ページのデータを取得

3. **表示更新**
   - テーブル内容を更新
   - ページネーション状態更新

### E005: 取引詳細表示

**処理順序**:

1. **取引ID取得**
   - テーブル行から`transactionId`取得

2. **詳細データ取得**
   - `GET /api/transactions/:transactionId` 呼び出し
   - 取引詳細情報取得

3. **ワークフロー履歴取得**
   - `GET /api/transactions/:transactionId/workflow` 呼び出し
   - ワークフロー履歴取得

4. **モーダル表示**
   - 取引詳細をモーダルで表示
   - 基本情報タブとワークフロータブ表示

### E006: CSVエクスポートボタン押下

**処理順序**:

1. **エクスポート条件確認**
   - 現在の検索条件を取得
   - 件数制限チェック（最大10,000件）

2. **CSVデータ取得**
   - `GET /api/transactions/export` 呼び出し
   - CSV形式でデータ取得

3. **ファイルダウンロード**
   - ブラウザのダウンロード機能を使用
   - ファイル名: `transactions_YYYYMMDD_HHmmss.csv`

## エラーハンドリング

| エラー種別         | 条件                       | メッセージ                               | 対応テーブル   |
| ------------------ | -------------------------- | ---------------------------------------- | -------------- |
| データ取得失敗     | SQL実行エラー              | 「取引履歴の読み込みに失敗しました」     | `transactions` |
| 検索条件エラー     | 不正な検索条件             | 「検索条件を正しく入力してください」     | -              |
| 取引不存在         | 該当取引なし               | 「取引が見つかりません」                 | `transactions` |
| エクスポート失敗   | CSV生成エラー              | 「CSVファイルの生成に失敗しました」      | `transactions` |
| 件数制限超過       | エクスポート件数が上限超過 | 「エクスポート可能な件数を超えています」 | -              |
| セッション期限切れ | 認証情報無効               | 「セッションが期限切れです」             | `users`        |
| ネットワークエラー | API通信失敗                | 「通信エラーが発生しました」             | -              |

## 表示フォーマット

### 取引タイプ表示

| DB値       | 表示名 | 色      |
| ---------- | ------ | ------- |
| TRANSFER   | 振込   | primary |
| DEPOSIT    | 入金   | success |
| WITHDRAWAL | 出金   | warning |

### ステータス表示

| DB値                 | 表示名   | 色      |
| -------------------- | -------- | ------- |
| PENDING_VERIFICATION | 検証待ち | warning |
| APPROVED             | 承認済み | info    |
| REJECTED             | 却下     | error   |
| COMPLETED            | 完了     | success |
| CANCELLED            | 取消     | default |

### 口座表示フォーマット

- **形式**: `顧客名：口座番号`
- **例**: `田中太郎：1234567890`
- **未設定時**: `-`

### 金額表示フォーマット

- **形式**: `¥1,234,567`
- **色**: プライマリカラー

### 日付表示フォーマット

- **一覧**: `YYYY/MM/DD HH:mm`
- **詳細**: `YYYY年MM月DD日 HH:mm:ss`

### 取引内容表示

- **一覧**: 30文字で省略 `取引内容が長い場合は...`
- **詳細**: 全文表示

## API仕様

### GET /api/transactions/history

**クエリパラメータ**:

```
?transactionId=TXN20240101001&type=TRANSFER&status=COMPLETED&amountFrom=10000&amountTo=100000&createdFrom=2024-01-01&createdTo=2024-01-31&search=田中&page=1&limit=50
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
      "status": "COMPLETED",
      "createdBy": "USER001",
      "createdAt": "2024-01-01T09:00:00Z",
      "verifiedBy": "USER002",
      "verifiedAt": "2024-01-01T10:00:00Z",
      "executedBy": "USER003",
      "executedAt": "2024-01-01T11:00:00Z",
      "sourceAccountNumber": "1234567890",
      "sourceCustomerName": "田中太郎",
      "destinationAccountNumber": "0987654321",
      "destinationCustomerName": "佐藤花子",
      "createdByName": "入力者",
      "verifiedByName": "承認者",
      "executedByName": "実行者"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### GET /api/transactions/:transactionId

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "transactionId": "TXN20240101001",
    "transactionType": "TRANSFER",
    "sourceAccountId": "ACC001",
    "destinationAccountId": "ACC002",
    "amount": 100000,
    "description": "振込手数料の詳細説明がここに入ります",
    "status": "COMPLETED",
    "createdBy": "USER001",
    "createdAt": "2024-01-01T09:00:00Z",
    "verifiedBy": "USER002",
    "verifiedAt": "2024-01-01T10:00:00Z",
    "executedBy": "USER003",
    "executedAt": "2024-01-01T11:00:00Z",
    "sourceAccount": {
      "accountId": "ACC001",
      "accountNumber": "1234567890",
      "customerName": "田中太郎"
    },
    "destinationAccount": {
      "accountId": "ACC002",
      "accountNumber": "0987654321",
      "customerName": "佐藤花子"
    },
    "createdByName": "入力者",
    "verifiedByName": "承認者",
    "executedByName": "実行者"
  }
}
```

### GET /api/transactions/:transactionId/workflow

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "stepId": "STEP001",
      "fromStatus": null,
      "toStatus": "PENDING_VERIFICATION",
      "performedBy": "USER001",
      "performedAt": "2024-01-01T09:00:00Z",
      "comments": "取引作成",
      "performedByName": "入力者"
    },
    {
      "stepId": "STEP002",
      "fromStatus": "PENDING_VERIFICATION",
      "toStatus": "APPROVED",
      "performedBy": "USER002",
      "performedAt": "2024-01-01T10:00:00Z",
      "comments": "承認",
      "performedByName": "承認者"
    },
    {
      "stepId": "STEP003",
      "fromStatus": "APPROVED",
      "toStatus": "COMPLETED",
      "performedBy": "USER003",
      "performedAt": "2024-01-01T11:00:00Z",
      "comments": "取引確定・実行完了",
      "performedByName": "実行者"
    }
  ]
}
```

### GET /api/transactions/export

**クエリパラメータ**: 検索条件と同じ

**レスポンス**: CSV形式のファイル

```csv
取引ID,取引タイプ,振込元顧客名,振込元口座番号,振込先顧客名,振込先口座番号,金額,取引内容,ステータス,作成者,作成日時,承認者,承認日時,実行者,実行日時
TXN20240101001,振込,田中太郎,1234567890,佐藤花子,0987654321,100000,振込手数料,完了,入力者,2024/01/01 09:00:00,承認者,2024/01/01 10:00:00,実行者,2024/01/01 11:00:00
```

## バリデーションルール

### 検索条件バリデーション

| 項目       | ルール     | エラーメッセージ                                 | 検証タイミング |
| ---------- | ---------- | ------------------------------------------------ | -------------- |
| 取引ID     | 20文字以内 | 「取引IDは20文字以内で入力してください」         | 検索時         |
| 金額範囲   | From ≤ To  | 「金額範囲の設定が正しくありません」             | 検索時         |
| 日付範囲   | From ≤ To  | 「日付範囲の設定が正しくありません」             | 検索時         |
| 顧客・口座 | 50文字以内 | 「検索キーワードは50文字以内で入力してください」 | 検索時         |

## テスト項目

### 正常系

- [ ] 取引履歴一覧が正しく表示される
- [ ] 検索フィルターが正常に動作する
- [ ] ページネーションが正常に動作する
- [ ] 取引詳細モーダルが正しく表示される
- [ ] ワークフロー履歴が正しく表示される
- [ ] CSVエクスポートが正常に動作する

### 異常系

- [ ] 検索条件エラー時の適切なエラー表示
- [ ] 存在しない取引IDでアクセス時のエラー表示
- [ ] データベース接続エラー時の適切なエラー表示
- [ ] CSVエクスポート失敗時のエラー表示
- [ ] 件数制限超過時のエラー表示

### セキュリティ

- [ ] セッション検証が適切に動作する
- [ ] 権限チェックが適切に動作する
- [ ] CSVエクスポートの権限チェック

### パフォーマンス

- [ ] 大量データでの検索性能
- [ ] ページネーション処理の性能
- [ ] CSVエクスポートの性能
- [ ] モーダル表示の応答性能

### ユーザビリティ

- [ ] 検索条件の保持機能
- [ ] ソート機能の動作
- [ ] レスポンシブデザインの対応
- [ ] アクセシビリティの対応
