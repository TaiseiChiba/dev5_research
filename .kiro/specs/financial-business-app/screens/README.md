# 画面仕様書

## 概要

本ディレクトリには、金融系業務アプリケーション「ゴブコパ」の各画面の詳細仕様を格納しています。

## ファイル構成

| ファイル名                                 | 画面名         | URL                                | 実装状況 |
| ------------------------------------------ | -------------- | ---------------------------------- | -------- |
| `SCR001-login.md`                          | ログイン画面   | `/login`                           | ✅完了   |
| `SCR002-dashboard.md`                      | ダッシュボード | `/`                                | ✅完了   |
| `SCR003-customer-list.md`                  | 顧客一覧画面   | `/customers/list`                  | ✅完了   |
| `SCR004-customer-detail.md`                | 顧客詳細画面   | `/customers/:customerId`           | ✅完了   |
| `SCR005-customer-edit.md`                  | 顧客編集画面   | `/customers/:customerId/edit`      | ✅完了   |
| `SCR006-customer-create.md`                | 顧客作成画面   | `/customers/create`                | ✅完了   |
| `SCR007-account-list.md`                   | 口座一覧画面   | `/accounts/list`                   | 🚧進行中 |
| `SCR008-account-detail.md`                 | 口座詳細画面   | `/accounts/:accountId`             | 🚧進行中 |
| `SCR009-account-edit.md`                   | 口座編集画面   | `/accounts/:accountId/edit`        | 🚧進行中 |
| `SCR010-account-create.md`                 | 口座作成画面   | `/accounts/create`                 | 🚧進行中 |
| `SCR011-transaction-input.md`              | 取引入力画面   | `/transactions/input`              | ✅完了   |
| `SCR012-transaction-confirmation.md`       | 取引確認画面   | `/transactions/confirmation`       | ✅完了   |
| `SCR013-transaction-verification.md`       | 取引検証画面   | `/transactions/verification`       | ✅完了   |
| `SCR014-transaction-final-confirmation.md` | 取引確定画面   | `/transactions/final-confirmation` | ✅完了   |
| `SCR015-transaction-history.md`            | 取引履歴画面   | `/transactions/history`            | ✅完了   |

## 共通仕様

各画面仕様書には以下の情報が含まれています：

- **基本情報**: 画面ID、URL、実装ファイル、アクセス権限
- **画面項目**: 項目ID、名称、種別、DB項目との対応
- **データベース操作**: 使用するテーブル、SQL操作の詳細
- **イベント処理**: 処理順序、API呼び出し、エラーハンドリング
- **バリデーション**: 入力制約、エラーメッセージ
- **画面遷移**: 遷移条件、遷移先

## データベース対応表

### テーブル一覧

- `users`: 利用者情報
- `customers`: 顧客情報
- `accounts`: 口座情報
- `transactions`: 取引情報
- `workflow_history`: ワークフロー履歴
- `audit_logs`: 監査ログ

詳細なスキーマ情報は `prisma/schema.prisma` を参照してください。
