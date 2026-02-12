# SCR003: 顧客一覧画面

## 基本情報

- **画面ID**: SCR003
- **画面名**: 顧客一覧画面
- **URL**: `/customers/list`
- **実装ファイル**: `src/components/customer/CustomerManagement.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **メインテーブル**: `customers`
- **操作種別**: SELECT（検索・一覧取得）

### 一覧取得SQL

```sql
SELECT
  customer_id,
  name,
  phonetic_name,
  customer_type,
  contact_info,
  created_at,
  updated_at
FROM customers
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
```

### 検索SQL

```sql
SELECT
  customer_id,
  name,
  phonetic_name,
  customer_type,
  contact_info,
  created_at,
  updated_at
FROM customers
WHERE is_deleted = false
  AND ($1::text IS NULL OR customer_id ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%')
  AND ($3::text IS NULL OR phonetic_name ILIKE '%' || $3 || '%')
  AND ($4::customer_type IS NULL OR customer_type = $4)
ORDER BY created_at DESC
LIMIT $5 OFFSET $6;
```

### 件数取得SQL

```sql
SELECT COUNT(*)
FROM customers
WHERE is_deleted = false
  AND ($1::text IS NULL OR customer_id ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%')
  AND ($3::text IS NULL OR phonetic_name ILIKE '%' || $3 || '%')
  AND ($4::customer_type IS NULL OR customer_type = $4);
```

## 画面項目

### 検索フォーム

| 項目ID | 項目名       | 種別             | 必須 | 制約                 | 初期値 | DB項目                    |
| ------ | ------------ | ---------------- | ---- | -------------------- | ------ | ------------------------- |
| CST001 | 顧客番号     | テキスト入力     | -    | 50文字以内           | 空     | `customers.customer_id`   |
| CST002 | 氏名・法人名 | テキスト入力     | -    | 100文字以内          | 空     | `customers.name`          |
| CST003 | カナ         | テキスト入力     | -    | 100文字以内          | 空     | `customers.phonetic_name` |
| CST004 | 顧客区分     | セレクトボックス | -    | INDIVIDUAL/CORPORATE | すべて | `customers.customer_type` |
| CST005 | 検索ボタン   | ボタン           | -    | -                    | -      | -                         |
| CST006 | クリアボタン | ボタン           | -    | -                    | -      | -                         |

### 一覧表示

| 項目ID | 項目名           | 種別       | 必須 | 制約        | 初期値       | DB項目        |
| ------ | ---------------- | ---------- | ---- | ----------- | ------------ | ------------- |
| CST007 | 顧客一覧テーブル | テーブル   | -    | 10件/ページ | 全顧客データ | `customers.*` |
| CST008 | ページネーション | ページング | -    | -           | 1ページ目    | -             |
| CST009 | 新規登録ボタン   | ボタン     | -    | -           | -            | -             |

### テーブル列定義

| 列ID   | 列名           | データ型     | 表示形式           | DB項目                             |
| ------ | -------------- | ------------ | ------------------ | ---------------------------------- |
| COL001 | 顧客番号       | VARCHAR(50)  | そのまま           | `customers.customer_id`            |
| COL002 | 氏名・法人名   | VARCHAR(100) | そのまま           | `customers.name`                   |
| COL003 | カナ           | VARCHAR(100) | そのまま           | `customers.phonetic_name`          |
| COL004 | 顧客区分       | ENUM         | チップ表示         | `customers.customer_type`          |
| COL005 | メールアドレス | JSON         | contact_info.email | `customers.contact_info->>'email'` |
| COL006 | 電話番号       | JSON         | contact_info.phone | `customers.contact_info->>'phone'` |
| COL007 | 登録日時       | TIMESTAMP    | YYYY/MM/DD HH:mm   | `customers.created_at`             |
| COL008 | 操作           | ボタン       | 詳細・編集ボタン   | -                                  |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **権限チェック**
   - セッション情報から`user_id`取得
   - `users`テーブルでアクティブ状態確認

2. **初期データ取得**
   - 顧客一覧API呼び出し（`GET /api/customers/list`）
   - ページネーション情報取得

3. **画面表示**
   - テーブルにデータ表示
   - ページネーション設定

### E002: 検索ボタン押下

**処理順序**:

1. **検索条件取得・検証**
   - フォーム入力値取得
   - 文字数制限チェック
   - 特殊文字エスケープ

2. **検索API呼び出し**
   - エンドポイント: `GET /api/customers/search`
   - パラメータ:
     ```json
     {
       "customerId": "検索値",
       "name": "検索値",
       "phoneticName": "検索値",
       "customerType": "INDIVIDUAL|CORPORATE",
       "page": 1,
       "limit": 10
     }
     ```

3. **データベース検索実行**
   - 検索条件に応じたWHERE句構築
   - ILIKE演算子による部分一致検索
   - `is_deleted = false`条件を必須で追加

4. **結果表示**
   - テーブル更新
   - ページネーション更新
   - 検索結果件数表示

### E003: クリアボタン押下

**処理順序**:

1. **フォーム初期化**
   - 検索フォームの全項目をクリア
   - 初期値に戻す

2. **全件データ再取得**
   - 検索条件なしで顧客一覧取得
   - ページを1ページ目にリセット

### E004: 詳細ボタン押下

**処理順序**:

1. **顧客ID取得**
   - テーブル行から`customer_id`取得

2. **画面遷移**
   - 顧客詳細画面に遷移（`/customers/{customerId}`）
   - 顧客IDをURLパラメータとして渡す

### E005: 編集ボタン押下

**処理順序**:

1. **顧客ID取得**
   - テーブル行から`customer_id`取得

2. **画面遷移**
   - 顧客編集画面に遷移（`/customers/{customerId}/edit`）
   - 顧客IDをURLパラメータとして渡す

### E006: 新規登録ボタン押下

**処理順序**:

1. **画面遷移**
   - 顧客作成画面に遷移（`/customers/create`）

### E007: ページネーション操作

**処理順序**:

1. **ページ番号取得**
   - クリックされたページ番号取得

2. **データ取得**
   - 該当ページのデータ取得
   - OFFSET値計算: `(page - 1) * limit`

3. **テーブル更新**
   - 新しいページのデータ表示

## データベース操作詳細

### 検索パフォーマンス最適化

- `customers`テーブルのインデックス活用:
  ```sql
  -- 既存インデックス
  CREATE INDEX idx_customers_name ON customers(name);
  CREATE INDEX idx_customers_phonetic_name ON customers(phonetic_name);
  CREATE INDEX idx_customers_customer_type ON customers(customer_type);
  CREATE INDEX idx_customers_is_deleted ON customers(is_deleted);
  CREATE INDEX idx_customers_composite ON customers(name, phonetic_name, customer_type);
  ```

### 論理削除対応

- 物理削除は行わず、`is_deleted`フラグで論理削除
- 検索・一覧では`is_deleted = false`条件を必須

## エラーハンドリング

| エラー種別         | 条件                              | メッセージ                       | 対応テーブル |
| ------------------ | --------------------------------- | -------------------------------- | ------------ |
| データ取得失敗     | `customers`テーブルアクセスエラー | 「顧客一覧の取得に失敗しました」 | `customers`  |
| 検索失敗           | 検索SQL実行エラー                 | 「検索に失敗しました」           | `customers`  |
| 権限エラー         | セッション無効                    | 「認証が必要です」               | `users`      |
| ネットワークエラー | API通信失敗                       | 「通信エラーが発生しました」     | -            |

## 画面遷移

| 遷移先                                    | 条件               | 方法           | 使用データ              |
| ----------------------------------------- | ------------------ | -------------- | ----------------------- |
| 顧客詳細（`/customers/:customerId`）      | 詳細ボタン押下     | ナビゲーション | `customers.customer_id` |
| 顧客編集（`/customers/:customerId/edit`） | 編集ボタン押下     | ナビゲーション | `customers.customer_id` |
| 顧客作成（`/customers/create`）           | 新規登録ボタン押下 | ナビゲーション | -                       |

## API仕様

### GET /api/customers/list

**パラメータ**:

```
?page=1&limit=10
```

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "customerId": "CUST001",
      "name": "田中太郎",
      "phoneticName": "タナカタロウ",
      "customerType": "INDIVIDUAL",
      "contactInfo": {
        "email": "tanaka@example.com",
        "phone": "090-1234-5678"
      },
      "createdAt": "2024-01-01T09:00:00Z",
      "updatedAt": "2024-01-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### GET /api/customers/search

**パラメータ**:

```
?customerId=CUST&name=田中&phoneticName=タナカ&customerType=INDIVIDUAL&page=1&limit=10
```

**レスポンス**: 上記と同じ形式

## バリデーションルール

| 項目         | ルール      | エラーメッセージ                                | 検証タイミング |
| ------------ | ----------- | ----------------------------------------------- | -------------- |
| 顧客番号     | 50文字以内  | 「顧客番号は50文字以内で入力してください」      | 入力時         |
| 氏名・法人名 | 100文字以内 | 「氏名・法人名は100文字以内で入力してください」 | 入力時         |
| カナ         | 100文字以内 | 「カナは100文字以内で入力してください」         | 入力時         |

## テスト項目

### 正常系

- [ ] 顧客一覧が正しく表示される
- [ ] 顧客番号での検索が動作する
- [ ] 氏名での部分一致検索が動作する
- [ ] 顧客区分での絞り込みが動作する
- [ ] ページネーションが正しく動作する
- [ ] 詳細・編集ボタンから正しい画面に遷移する

### 異常系

- [ ] データベース接続エラー時の適切なエラー表示
- [ ] 検索結果が0件の場合の表示
- [ ] 不正な検索条件でのエラーハンドリング

### パフォーマンス

- [ ] 大量データでの検索性能
- [ ] ページネーション性能
- [ ] インデックス効果の確認
