# SCR007: 口座一覧画面

## 基本情報

- **画面ID**: SCR007
- **画面名**: 口座一覧画面
- **URL**: `/accounts/list`
- **実装ファイル**: `src/components/account/AccountList.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **メインテーブル**: `accounts`
- **関連テーブル**: `customers`
- **操作種別**: SELECT（一覧取得・検索）

### 口座一覧取得SQL

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
  c.customer_type
FROM accounts a
INNER JOIN customers c ON a.customer_id = c.customer_id
WHERE c.is_deleted = false
  AND ($1::text IS NULL OR a.account_type = $1)
  AND ($2::text IS NULL OR a.status = $2)
  AND ($3::decimal IS NULL OR a.balance >= $3)
  AND ($4::decimal IS NULL OR a.balance <= $4)
  AND ($5::text IS NULL OR (
    c.name ILIKE '%' || $5 || '%' OR
    c.phonetic_name ILIKE '%' || $5 || '%' OR
    a.account_number ILIKE '%' || $5 || '%'
  ))
ORDER BY a.created_at DESC
LIMIT $6 OFFSET $7;
```

### 口座件数取得SQL

```sql
SELECT COUNT(*)
FROM accounts a
INNER JOIN customers c ON a.customer_id = c.customer_id
WHERE c.is_deleted = false
  AND ($1::text IS NULL OR a.account_type = $1)
  AND ($2::text IS NULL OR a.status = $2)
  AND ($3::decimal IS NULL OR a.balance >= $3)
  AND ($4::decimal IS NULL OR a.balance <= $4)
  AND ($5::text IS NULL OR (
    c.name ILIKE '%' || $5 || '%' OR
    c.phonetic_name ILIKE '%' || $5 || '%' OR
    a.account_number ILIKE '%' || $5 || '%'
  ));
```

## 画面項目

### 検索・フィルター

| 項目ID | 項目名       | 種別             | 必須 | 制約                               | 初期値 | DB項目 |
| ------ | ------------ | ---------------- | ---- | ---------------------------------- | ------ | ------ |
| ACL001 | 口座番号     | テキスト入力     | -    | 20文字以内                         | 空     | -      |
| ACL002 | 顧客名       | テキスト入力     | -    | 50文字以内                         | 空     | -      |
| ACL003 | 口座種別     | セレクトボックス | -    | ALL/SAVINGS/CHECKING/FIXED_DEPOSIT | ALL    | -      |
| ACL004 | ステータス   | セレクトボックス | -    | ALL/ACTIVE/CLOSED/SUSPENDED        | ALL    | -      |
| ACL005 | 残高範囲From | 数値入力         | -    | 0以上                              | 空     | -      |
| ACL006 | 残高範囲To   | 数値入力         | -    | From以上                           | 空     | -      |
| ACL007 | 検索ボタン   | ボタン           | -    | -                                  | -      | -      |
| ACL008 | クリアボタン | ボタン           | -    | -                                  | -      | -      |

### 操作ボタン

| 項目ID | 項目名          | 種別   | 必須 | 制約 | 初期値 | DB項目 |
| ------ | --------------- | ------ | ---- | ---- | ------ | ------ |
| ACL009 | 新規作成ボタン  | ボタン | -    | -    | -      | -      |
| ACL010 | CSVエクスポート | ボタン | -    | -    | -      | -      |

### 口座一覧テーブル

| 項目ID | 項目名           | 種別       | 必須 | 制約 | 初期値     | DB項目       |
| ------ | ---------------- | ---------- | ---- | ---- | ---------- | ------------ |
| ACL011 | 口座一覧テーブル | テーブル   | -    | -    | 口座データ | `accounts.*` |
| ACL012 | 件数表示         | 表示項目   | -    | -    | 件数       | COUNT(\*)    |
| ACL013 | ページネーション | ページング | -    | -    | 1ページ目  | -            |

### 口座テーブル列定義

| 列ID   | 列名       | データ型      | 表示形式         | DB項目                    |
| ------ | ---------- | ------------- | ---------------- | ------------------------- |
| ACC001 | 口座番号   | VARCHAR(20)   | そのまま         | `accounts.account_number` |
| ACC002 | 顧客名     | VARCHAR(100)  | そのまま         | `customers.name`          |
| ACC003 | 口座種別   | ENUM          | 日本語変換       | `accounts.account_type`   |
| ACC004 | ステータス | ENUM          | チップ表示       | `accounts.status`         |
| ACC005 | 残高       | DECIMAL(15,2) | 通貨フォーマット | `accounts.balance`        |
| ACC006 | 開設日     | TIMESTAMP     | YYYY/MM/DD       | `accounts.created_at`     |
| ACC007 | 操作       | ボタン        | 詳細・編集ボタン | -                         |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **セッション確認**
   - ログイン状態確認
   - ユーザー権限確認

2. **口座一覧データ取得**
   - `GET /api/accounts/list` 呼び出し
   - デフォルト条件で最新50件取得

3. **画面表示**
   - 検索フィルター表示
   - 口座一覧テーブル表示
   - ページネーション表示

### E002: 検索ボタン押下

**処理順序**:

1. **検索条件取得**
   - フィルター項目の値を取得
   - 条件の妥当性チェック

2. **検索API呼び出し**
   - `GET /api/accounts/list` 呼び出し
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
   - 条件なしで口座一覧を再取得

### E004: 新規作成ボタン押下

**処理順序**:

1. **画面遷移**
   - 口座作成画面に遷移（`/accounts/create`）

### E005: 詳細ボタン押下

**処理順序**:

1. **口座ID取得**
   - テーブル行から`accountId`取得

2. **画面遷移**
   - 口座詳細画面に遷移（`/accounts/:accountId`）

### E006: 編集ボタン押下

**処理順序**:

1. **口座ID取得**
   - テーブル行から`accountId`取得

2. **画面遷移**
   - 口座編集画面に遷移（`/accounts/:accountId/edit`）

### E007: ページネーション操作

**処理順序**:

1. **ページ番号取得**
   - クリックされたページ番号を取得

2. **データ取得**
   - 現在の検索条件を維持
   - 指定ページのデータを取得

3. **表示更新**
   - テーブル内容を更新
   - ページネーション状態更新

### E008: CSVエクスポートボタン押下

**処理順序**:

1. **エクスポート条件確認**
   - 現在の検索条件を取得
   - 件数制限チェック（最大10,000件）

2. **CSVデータ取得**
   - `GET /api/accounts/export` 呼び出し
   - CSV形式でデータ取得

3. **ファイルダウンロード**
   - ブラウザのダウンロード機能を使用
   - ファイル名: `accounts_YYYYMMDD_HHmmss.csv`

## エラーハンドリング

| エラー種別         | 条件                       | メッセージ                               | 対応テーブル |
| ------------------ | -------------------------- | ---------------------------------------- | ------------ |
| データ取得失敗     | SQL実行エラー              | 「口座一覧の読み込みに失敗しました」     | `accounts`   |
| 検索条件エラー     | 不正な検索条件             | 「検索条件を正しく入力してください」     | -            |
| エクスポート失敗   | CSV生成エラー              | 「CSVファイルの生成に失敗しました」      | `accounts`   |
| 件数制限超過       | エクスポート件数が上限超過 | 「エクスポート可能な件数を超えています」 | -            |
| セッション期限切れ | 認証情報無効               | 「セッションが期限切れです」             | `users`      |
| 権限不足           | 口座一覧閲覧権限なし       | 「口座一覧を閲覧する権限がありません」   | `users`      |
| ネットワークエラー | API通信失敗                | 「通信エラーが発生しました」             | -            |

## 画面遷移

| 遷移先                                  | 条件               | 方法           | 使用データ            |
| --------------------------------------- | ------------------ | -------------- | --------------------- |
| 口座作成（`/accounts/create`）          | 新規作成ボタン押下 | ナビゲーション | -                     |
| 口座詳細（`/accounts/:accountId`）      | 詳細ボタン押下     | ナビゲーション | `accounts.account_id` |
| 口座編集（`/accounts/:accountId/edit`） | 編集ボタン押下     | ナビゲーション | `accounts.account_id` |

## 表示フォーマット

### 口座種別表示

| DB値          | 表示名   |
| ------------- | -------- |
| SAVINGS       | 普通預金 |
| CHECKING      | 当座預金 |
| FIXED_DEPOSIT | 定期預金 |

### ステータス表示

| DB値      | 表示名   | 色      |
| --------- | -------- | ------- |
| ACTIVE    | 有効     | success |
| CLOSED    | 解約済み | default |
| SUSPENDED | 停止中   | warning |

### 残高表示フォーマット

- **形式**: `¥1,234,567`
- **負の値**: 赤色表示
- **ゼロ**: グレー表示

### 日付表示フォーマット

- **形式**: `YYYY/MM/DD`
- **例**: `2024/01/01`

## API仕様

### GET /api/accounts/list

**クエリパラメータ**:

```
?accountNumber=1234567890&customerName=田中&accountType=SAVINGS&status=ACTIVE&balanceFrom=100000&balanceTo=1000000&page=1&limit=50
```

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "accountId": "ACC001",
      "customerId": "CUST001",
      "accountNumber": "1234567890",
      "accountType": "SAVINGS",
      "status": "ACTIVE",
      "balance": 1000000,
      "createdAt": "2024-01-01T09:00:00Z",
      "updatedAt": "2024-01-01T09:00:00Z",
      "customerName": "田中太郎",
      "customerPhoneticName": "タナカタロウ",
      "customerType": "INDIVIDUAL"
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

### GET /api/accounts/export

**クエリパラメータ**: 検索条件と同じ

**レスポンス**: CSV形式のファイル

```csv
口座番号,顧客名,口座種別,ステータス,残高,開設日
1234567890,田中太郎,普通預金,有効,1000000,2024/01/01
0987654321,佐藤花子,当座預金,有効,500000,2024/01/02
```

## バリデーションルール

### 検索条件バリデーション

| 項目     | ルール     | エラーメッセージ                           | 検証タイミング |
| -------- | ---------- | ------------------------------------------ | -------------- |
| 口座番号 | 20文字以内 | 「口座番号は20文字以内で入力してください」 | 検索時         |
| 顧客名   | 50文字以内 | 「顧客名は50文字以内で入力してください」   | 検索時         |
| 残高範囲 | From ≤ To  | 「残高範囲の設定が正しくありません」       | 検索時         |
| 残高範囲 | 0以上      | 「残高は0以上で入力してください」          | 検索時         |

## テスト項目

### 正常系

- [ ] 口座一覧が正しく表示される
- [ ] 検索フィルターが正常に動作する
- [ ] ページネーションが正常に動作する
- [ ] 新規作成ボタンで作成画面に遷移する
- [ ] 詳細ボタンで詳細画面に遷移する
- [ ] 編集ボタンで編集画面に遷移する
- [ ] CSVエクスポートが正常に動作する

### 異常系

- [ ] 検索条件エラー時の適切なエラー表示
- [ ] データベース接続エラー時の適切なエラー表示
- [ ] CSVエクスポート失敗時のエラー表示
- [ ] 件数制限超過時のエラー表示
- [ ] 権限不足時のエラー表示

### セキュリティ

- [ ] セッション検証が適切に動作する
- [ ] 権限チェックが適切に動作する
- [ ] CSVエクスポートの権限チェック

### パフォーマンス

- [ ] 大量データでの検索性能
- [ ] ページネーション処理の性能
- [ ] CSVエクスポートの性能
- [ ] テーブル表示の応答性能

### ユーザビリティ

- [ ] 検索条件の保持機能
- [ ] ソート機能の動作
- [ ] レスポンシブデザインの対応
- [ ] アクセシビリティの対応
