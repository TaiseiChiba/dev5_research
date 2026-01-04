# SCR002: ダッシュボード

## 基本情報

- **画面ID**: SCR002
- **画面名**: ダッシュボード
- **URL**: `/`
- **実装ファイル**: `src/components/workflow/Dashboard.tsx`
- **アクセス権限**: 認証済みユーザー

## データベース操作

### 使用テーブル

- **参照テーブル**: `users`（セッション情報の検証）
- **操作種別**: SELECT（セッション検証）

### セッション検証SQL

```sql
SELECT
  user_id,
  user_role,
  is_active
FROM users
WHERE user_id = $1
  AND is_active = true;
```

## 画面項目

| 項目ID | 項目名             | 種別     | 必須 | 制約 | 初期値               | DB項目            |
| ------ | ------------------ | -------- | ---- | ---- | -------------------- | ----------------- |
| DSH001 | 利用者ID表示       | 表示項目 | -    | -    | セッション情報       | `users.user_id`   |
| DSH002 | 利用者役割表示     | 表示項目 | -    | -    | セッション情報       | `users.user_role` |
| DSH003 | 利用者切替ボタン   | ボタン   | -    | -    | -                    | -                 |
| DSH004 | ログアウトボタン   | ボタン   | -    | -    | -                    | -                 |
| DSH005 | 機能メニューリスト | リスト   | -    | -    | 権限に応じた機能一覧 | `users.user_role` |

## 機能メニュー項目

| メニューID | メニュー名   | 遷移先                             | 権限条件   | DB権限チェック                      |
| ---------- | ------------ | ---------------------------------- | ---------- | ----------------------------------- |
| MNU001     | 顧客情報管理 | `/customers/list`                  | 全ユーザー | `users.is_active = true`            |
| MNU002     | 口座管理     | `/accounts/list`                   | 全ユーザー | `users.is_active = true`            |
| MNU003     | 取引入力     | `/transactions/input`              | 全ユーザー | `users.is_active = true`            |
| MNU004     | 取引検証     | `/transactions/verification`       | 全ユーザー | `users.is_active = true`            |
| MNU005     | 取引確定     | `/transactions/final-confirmation` | 管理者のみ | `users.user_role = 'ADMINISTRATOR'` |
| MNU006     | 取引履歴     | `/transactions/history`            | 全ユーザー | `users.is_active = true`            |

## イベント処理

### E001: 利用者切替ボタン押下

**処理順序**:

1. **利用者切替モーダル表示**
   - UserSwitchModal コンポーネント表示
   - 現在のセッション情報を渡す

2. **新しい認証情報入力待ち**
   - 利用者ID・パスワード入力フォーム表示
   - 入力値検証

3. **認証処理**
   - `POST /api/auth/login` 呼び出し
   - `users`テーブルで認証確認

4. **セッション更新**
   - 認証成功時: LocalStorageのセッション情報更新
   - 画面リフレッシュ
   - 監査ログ記録

### E002: ログアウトボタン押下

**処理順序**:

1. **確認ダイアログ表示**
   - 「ログアウトしますか？」確認

2. **ログアウト処理**
   - `POST /api/auth/logout` 呼び出し
   - LocalStorageのセッション情報削除

3. **監査ログ記録**

   ```sql
   INSERT INTO audit_logs (
     log_id, user_id, action, entity_type, entity_id, timestamp
   ) VALUES (
     $1, $2, 'LOGOUT', 'USER', $3, NOW()
   );
   ```

4. **画面遷移**
   - ログイン画面（`/login`）にリダイレクト

### E003: 機能メニュー選択

**処理順序**:

1. **権限チェック**
   - セッション情報から`user_role`取得
   - 選択された機能の必要権限と比較
   - `users`テーブルで最新の権限状態確認

2. **権限確認SQL**

   ```sql
   SELECT user_role, is_active
   FROM users
   WHERE user_id = $1;
   ```

3. **遷移処理**
   - **権限あり**: 対象画面に遷移
   - **権限なし**: エラーメッセージ表示

## データベース更新処理

### ログアウト時の監査ログ

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
  'LOGOUT',
  'USER',
  $3, -- user_id
  $4, -- セッション情報JSON
  NOW()
);
```

### 利用者切替時の監査ログ

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
  $2, -- 新しいuser_id
  'USER_SWITCH',
  'USER',
  $3, -- 新しいuser_id
  $4, -- 前のセッション情報JSON
  $5, -- 新しいセッション情報JSON
  NOW()
);
```

## エラーハンドリング

| エラー種別         | 条件                               | メッセージ                                             | 対応テーブル      |
| ------------------ | ---------------------------------- | ------------------------------------------------------ | ----------------- |
| セッション期限切れ | セッション情報が無効               | 「セッションが期限切れです。再度ログインしてください」 | `users`           |
| 権限不足           | 管理者限定機能への一般職員アクセス | 「この機能を利用する権限がありません」                 | `users.user_role` |
| アカウント無効     | `is_active = false`                | 「アカウントが無効化されています」                     | `users.is_active` |
| ネットワークエラー | API通信失敗                        | 「通信エラーが発生しました」                           | -                 |

## 画面遷移

| 遷移先                   | 条件           | 方法             | 使用データ        |
| ------------------------ | -------------- | ---------------- | ----------------- |
| ログイン画面（`/login`） | ログアウト実行 | 自動リダイレクト | -                 |
| 各機能画面               | メニュー選択   | ナビゲーション   | `users.user_role` |
| 認証エラー画面（`/401`） | 権限不足       | 自動リダイレクト | `users.user_role` |

## 権限制御

### 表示制御

- **管理者のみ表示**: 取引確定メニュー
- **全ユーザー表示**: その他すべてのメニュー

### 権限チェックSQL

```sql
-- 管理者権限チェック
SELECT COUNT(*)
FROM users
WHERE user_id = $1
  AND user_role = 'ADMINISTRATOR'
  AND is_active = true;

-- 一般権限チェック
SELECT COUNT(*)
FROM users
WHERE user_id = $1
  AND is_active = true;
```

## セッション管理

### セッション情報構造

```json
{
  "userId": "USER001",
  "userRole": "GENERAL_STAFF",
  "sessionId": "uuid-string",
  "expiresAt": "2024-01-01T12:00:00Z",
  "loginAt": "2024-01-01T09:00:00Z"
}
```

### セッション検証

- 画面表示時に`users`テーブルでアカウント状態確認
- `is_active = false`の場合は強制ログアウト
- セッション期限切れの場合は自動ログイン画面遷移

## API仕様

### POST /api/auth/logout

**リクエスト**:

```json
{
  "sessionId": "uuid-string"
}
```

**レスポンス**:

```json
{
  "success": true,
  "message": "ログアウトが完了しました"
}
```

## テスト項目

### 正常系

- [ ] 一般職員でログイン後、適切なメニューが表示される
- [ ] 管理者でログイン後、管理者限定メニューが表示される
- [ ] 利用者切替が正常に動作する
- [ ] ログアウトが正常に動作する

### 異常系

- [ ] セッション期限切れ時に自動ログイン画面遷移
- [ ] 無効化されたアカウントで強制ログアウト
- [ ] 一般職員が管理者限定機能にアクセス時にエラー表示

### セキュリティ

- [ ] 権限チェックが適切に動作する
- [ ] セッション情報が適切に管理される
- [ ] 監査ログが正しく記録される
