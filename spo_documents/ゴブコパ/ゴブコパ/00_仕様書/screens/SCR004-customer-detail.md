# SCR004: 顧客詳細画面

## 基本情報

- **画面ID**: SCR004
- **画面名**: 顧客詳細画面
- **URL**: `/customers/:customerId`
- **実装ファイル**: `src/components/customer/CustomerDetail.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **メインテーブル**: `customers`
- **関連テーブル**: `accounts`
- **操作種別**: SELECT（詳細取得・関連口座取得）、DELETE（論理削除）

### 顧客詳細取得SQL

```sql
SELECT
  customer_id,
  name,
  phonetic_name,
  customer_type,
  contact_info,
  is_deleted,
  created_at,
  updated_at
FROM customers
WHERE customer_id = $1
  AND is_deleted = false;
```

### 関連口座取得SQL

```sql
SELECT
  a.account_id,
  a.account_number,
  a.account_type,
  a.status,
  a.balance,
  a.created_at,
  a.updated_at
FROM accounts a
WHERE a.customer_id = $1
ORDER BY a.created_at DESC;
```

### 顧客削除前チェックSQL

```sql
SELECT COUNT(*)
FROM accounts
WHERE customer_id = $1
  AND status = 'ACTIVE';
```

### 顧客論理削除SQL

```sql
UPDATE customers
SET
  is_deleted = true,
  updated_at = NOW()
WHERE customer_id = $1
  AND is_deleted = false;
```

## 画面項目

### 基本情報表示

| 項目ID | 項目名       | 種別     | 必須 | 制約 | 初期値 | DB項目                                  |
| ------ | ------------ | -------- | ---- | ---- | ------ | --------------------------------------- |
| CSD001 | 顧客番号     | 表示項目 | -    | -    | DB値   | `customers.customer_id`                 |
| CSD002 | 氏名・法人名 | 表示項目 | -    | -    | DB値   | `customers.name`                        |
| CSD003 | カナ         | 表示項目 | -    | -    | DB値   | `customers.phonetic_name`               |
| CSD004 | 顧客区分     | チップ   | -    | -    | DB値   | `customers.customer_type`               |
| CSD005 | メール       | 表示項目 | -    | -    | DB値   | `customers.contact_info->>'email'`      |
| CSD006 | 電話番号     | 表示項目 | -    | -    | DB値   | `customers.contact_info->>'phone'`      |
| CSD007 | 郵便番号     | 表示項目 | -    | -    | DB値   | `customers.contact_info->>'postalCode'` |
| CSD008 | 住所         | 表示項目 | -    | -    | DB値   | `customers.contact_info->>'address'`    |
| CSD009 | 登録日時     | 表示項目 | -    | -    | DB値   | `customers.created_at`                  |
| CSD010 | 更新日時     | 表示項目 | -    | -    | DB値   | `customers.updated_at`                  |

### 操作ボタン

| 項目ID | 項目名     | 種別   | 必須 | 制約 | 初期値 | DB項目 |
| ------ | ---------- | ------ | ---- | ---- | ------ | ------ |
| CSD011 | 戻るボタン | ボタン | -    | -    | -      | -      |
| CSD012 | 編集ボタン | ボタン | -    | -    | -      | -      |
| CSD013 | 削除ボタン | ボタン | -    | -    | -      | -      |

### 関連口座一覧

| 項目ID | 項目名           | 種別     | 必須 | 制約 | 初期値     | DB項目       |
| ------ | ---------------- | -------- | ---- | ---- | ---------- | ------------ |
| CSD014 | 口座一覧テーブル | テーブル | -    | -    | 口座データ | `accounts.*` |
| CSD015 | 口座件数表示     | 表示項目 | -    | -    | 件数       | COUNT(\*)    |

### 口座テーブル列定義

| 列ID   | 列名     | データ型      | 表示形式         | DB項目                    |
| ------ | -------- | ------------- | ---------------- | ------------------------- |
| ACC001 | 口座番号 | VARCHAR(20)   | そのまま         | `accounts.account_number` |
| ACC002 | 口座種別 | ENUM          | 日本語変換       | `accounts.account_type`   |
| ACC003 | 状態     | ENUM          | チップ表示       | `accounts.status`         |
| ACC004 | 残高     | DECIMAL(15,2) | 通貨フォーマット | `accounts.balance`        |
| ACC005 | 開設日   | TIMESTAMP     | YYYY/MM/DD       | `accounts.created_at`     |
| ACC006 | 操作     | ボタン        | 詳細ボタン       | -                         |

## イベント処理

### E001: 画面初期化

**処理順序**:

1. **URLパラメータ取得**
   - `customerId`をURLから取得
   - パラメータ検証

2. **顧客詳細データ取得**
   - `GET /api/customers/:customerId` 呼び出し
   - `customers`テーブルから詳細情報取得

3. **関連口座データ取得**
   - `GET /api/accounts/customer/:customerId` 呼び出し
   - `accounts`テーブルから関連口座取得

4. **画面表示**
   - 顧客基本情報表示
   - 関連口座一覧表示
   - 口座件数表示

### E002: 編集ボタン押下

**処理順序**:

1. **顧客ID取得**
   - 現在表示中の`customerId`取得

2. **画面遷移**
   - 顧客編集画面に遷移（`/customers/:customerId/edit`）

### E003: 削除ボタン押下

**処理順序**:

1. **削除確認ダイアログ表示**
   - 顧客情報を含む確認メッセージ表示
   - 「この操作は取り消すことができません」警告

2. **アクティブ口座チェック**
   - 関連口座の状態確認
   - `accounts.status = 'ACTIVE'`の口座が存在する場合は削除不可

3. **削除不可の場合**
   - 警告メッセージ表示
   - 削除ボタン無効化
   - 「すべての口座を解約してください」ガイダンス

### E004: 削除確認実行

**処理順序**:

1. **最終確認**
   - アクティブ口座の再チェック

2. **削除API呼び出し**
   - `DELETE /api/customers/:customerId` 呼び出し
   - 論理削除実行（`is_deleted = true`）

3. **削除結果処理**
   - **成功時**: 顧客一覧画面に遷移、成功メッセージ表示
   - **失敗時**: エラーメッセージ表示、ダイアログ閉じる

### E005: 戻るボタン押下

**処理順序**:

1. **画面遷移**
   - 顧客一覧画面に遷移（`/customers/list`）

### E006: 口座詳細ボタン押下

**処理順序**:

1. **口座ID取得**
   - テーブル行から`accountId`取得

2. **画面遷移**
   - 口座詳細画面に遷移（`/accounts/:accountId`）

## データベース操作詳細

### 削除制約チェック

```sql
-- アクティブ口座存在チェック
SELECT
  COUNT(*) as active_count,
  STRING_AGG(account_number, ', ') as active_accounts
FROM accounts
WHERE customer_id = $1
  AND status = 'ACTIVE';
```

### 監査ログ記録（削除時）

```sql
INSERT INTO audit_logs (
  log_id,
  user_id,
  action,
  entity_type,
  entity_id,
  old_values,
  timestamp
) VALUES (
  $1, -- UUID
  $2, -- user_id
  'DELETE_CUSTOMER',
  'CUSTOMER',
  $3, -- customer_id
  $4, -- 削除前の顧客情報JSON
  NOW()
);
```

## エラーハンドリング

| エラー種別         | 条件                                  | メッセージ                                                 | 対応テーブル |
| ------------------ | ------------------------------------- | ---------------------------------------------------------- | ------------ |
| 顧客不存在         | `customers`テーブルに該当レコードなし | 「顧客が見つかりません」                                   | `customers`  |
| 顧客削除済み       | `is_deleted = true`                   | 「この顧客は削除済みです」                                 | `customers`  |
| アクティブ口座存在 | 削除時に`status = 'ACTIVE'`口座あり   | 「アクティブな口座があります。先に口座を解約してください」 | `accounts`   |
| データ取得失敗     | SQL実行エラー                         | 「顧客情報の読み込みに失敗しました」                       | `customers`  |
| 削除権限不足       | 削除権限なし                          | 「顧客を削除する権限がありません」                         | `users`      |
| ネットワークエラー | API通信失敗                           | 「通信エラーが発生しました」                               | -            |

## 画面遷移

| 遷移先                                    | 条件               | 方法             | 使用データ              |
| ----------------------------------------- | ------------------ | ---------------- | ----------------------- |
| 顧客一覧（`/customers/list`）             | 戻るボタン押下     | ナビゲーション   | -                       |
| 顧客編集（`/customers/:customerId/edit`） | 編集ボタン押下     | ナビゲーション   | `customers.customer_id` |
| 口座詳細（`/accounts/:accountId`）        | 口座詳細ボタン押下 | ナビゲーション   | `accounts.account_id`   |
| 顧客一覧（削除成功時）                    | 削除完了           | 自動リダイレクト | -                       |

## 表示フォーマット

### 顧客区分表示

| DB値       | 表示名 | アイコン     | 色        |
| ---------- | ------ | ------------ | --------- |
| INDIVIDUAL | 個人   | PersonIcon   | primary   |
| CORPORATE  | 法人   | BusinessIcon | secondary |

### 口座種別表示

| DB値          | 表示名   |
| ------------- | -------- |
| SAVINGS       | 普通預金 |
| CHECKING      | 当座預金 |
| FIXED_DEPOSIT | 定期預金 |

### 口座状態表示

| DB値      | 表示名   | 色      |
| --------- | -------- | ------- |
| ACTIVE    | 有効     | success |
| CLOSED    | 解約済み | default |
| SUSPENDED | 停止中   | warning |

### 日付フォーマット

- **形式**: `YYYY/MM/DD HH:mm`
- **例**: `2024/01/01 09:00`

### 通貨フォーマット

- **形式**: `¥1,234,567`
- **負の値**: 赤色表示

## API仕様

### GET /api/customers/:customerId

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "customerId": "CUST001",
    "name": "田中太郎",
    "phoneticName": "タナカタロウ",
    "customerType": "INDIVIDUAL",
    "contactInfo": {
      "email": "tanaka@example.com",
      "phone": "090-1234-5678",
      "postalCode": "123-4567",
      "address": "東京都渋谷区..."
    },
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-01T09:00:00Z"
  }
}
```

### GET /api/accounts/customer/:customerId

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "accountId": "ACC001",
      "accountNumber": "1234567890",
      "accountType": "SAVINGS",
      "status": "ACTIVE",
      "balance": 1000000,
      "createdAt": "2024-01-01T09:00:00Z",
      "updatedAt": "2024-01-01T09:00:00Z"
    }
  ]
}
```

### DELETE /api/customers/:customerId

**レスポンス（成功）**:

```json
{
  "success": true,
  "message": "顧客が正常に削除されました"
}
```

**レスポンス（失敗）**:

```json
{
  "success": false,
  "message": "アクティブな口座があるため削除できません",
  "details": {
    "activeAccounts": ["1234567890", "0987654321"]
  }
}
```

## テスト項目

### 正常系

- [ ] 顧客詳細情報が正しく表示される
- [ ] 関連口座一覧が正しく表示される
- [ ] 編集ボタンから編集画面に遷移する
- [ ] 戻るボタンで一覧画面に戻る
- [ ] 口座詳細ボタンで口座詳細画面に遷移する
- [ ] アクティブ口座がない場合の削除が成功する

### 異常系

- [ ] 存在しない顧客IDでアクセス時のエラー表示
- [ ] 削除済み顧客へのアクセス時のエラー表示
- [ ] アクティブ口座がある場合の削除制限
- [ ] データベース接続エラー時の適切なエラー表示

### セキュリティ

- [ ] 削除確認ダイアログが適切に表示される
- [ ] 削除操作の監査ログが記録される
- [ ] 権限チェックが適切に動作する
