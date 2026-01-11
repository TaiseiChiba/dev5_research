# ゴブコパ - 環境構築手順書

## プロジェクト概要

ゴブコパは銀行業務向けのWebアプリケーションです。フロントエンドはReact + TypeScript、バックエンドはExpress + TypeScript、データベースはPostgreSQLを使用しています。

## 前提条件

開発を始める前に、以下のソフトウェアをインストールしてください：

### Node.js のインストール

**Windows:**

1. [Node.js公式サイト](https://nodejs.org/)から LTS版をダウンロード
2. ダウンロードした `.msi` ファイルを実行してインストール
3. インストール完了後、コマンドプロンプトで確認：

```bash
node --version
npm --version
```

**macOS:**

```bash
# Homebrewを使用する場合（推奨）
brew install node

# または公式サイトからダウンロード
# https://nodejs.org/
```

**Linux (Ubuntu/Debian):**

```bash
# NodeSourceリポジトリを使用（推奨）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# または snapを使用
sudo snap install node --classic
```

### PostgreSQL のインストール

**Windows:**

1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード
2. インストーラーを実行し、以下の設定で進める：
   - ポート: 5432（デフォルト）
   - スーパーユーザー（postgres）のパスワードを設定
   - ロケール: Japanese, Japan
3. インストール完了後、サービスが自動起動することを確認

**macOS:**

```bash
# Homebrewを使用する場合（推奨）
brew install postgresql@15
brew services start postgresql@15

# または Postgres.appを使用
# https://postgresapp.com/
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Git のインストール

**Windows:**

1. [Git公式サイト](https://git-scm.com/download/win)からインストーラーをダウンロード
2. インストーラーを実行（基本的にデフォルト設定でOK）
3. Git Bashまたはコマンドプロンプトで確認：

```bash
git --version
```

**macOS:**

```bash
# Homebrewを使用する場合
brew install git

# またはXcode Command Line Toolsに含まれている
xcode-select --install
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install git
```

### インストール確認

すべてのソフトウェアが正しくインストールされているか確認：

```bash
# バージョン確認
node --version    # v18.0.0以上
npm --version     # v9.0.0以上
git --version     # 最新版
psql --version    # v14以上
```

## 1. リポジトリのクローン

```bash
# Cドライブ直下に任意のディレクトリを作成
git bashを開く

cd  c:

mkdir dev5_research

cd dev5_research

# リポジトリをクローン
git clone git@github.com:TaiseiChiba/dev5_research.git

# プロジェクトディレクトリに移動
cd dev5_research
```

## 2. 依存関係のインストール

```bash
# 依存関係をインストール
npm install
```

## 3. データベースの設定

### 3.1 PostgreSQLの準備

PostgreSQLがインストールされていない場合は、以下の方法でインストールしてください：

**Windows:**

```bash
# Chocolateyを使用する場合
choco install postgresql

# または公式サイトからダウンロード
# https://www.postgresql.org/download/windows/
```

**macOS:**

```bash
# Homebrewを使用する場合
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.2 データベースの作成

PostgreSQLにpostgresユーザーでログインしてデータベースを作成します：

**Windows:**

```bash
# コマンドプロンプトまたはPowerShellで実行
psql -U postgres
```

**macOS/Linux:**

```bash
# ターミナルで実行
sudo -u postgres psql
```

PostgreSQLにログイン後、以下のコマンドを実行：

```sql
-- データベースを作成
CREATE DATABASE financial_business_app;

-- データベース一覧を確認
\l

-- 作成したデータベースに接続
\c financial_business_app

-- 終了
\q
```

## 4. 環境変数の設定

プロジェクトルートに `.env` ファイルが既に存在しますが、PostgreSQLのpostgresユーザー設定に合わせて調整してください：

```bash
# .env ファイルの内容（PostgreSQLのpostgresユーザーを使用）
DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/financial_business_app?schema=public"
API_PORT=3001
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001/api
```

**重要**: `your_postgres_password` の部分は、PostgreSQLインストール時に設定したpostgresユーザーのパスワードに置き換えてください。

## 5. データベースの初期化

```bash
# Prismaクライアントを生成
npx prisma generate

# データベースマイグレーションを実行
npx prisma migrate dev

# 初期データを投入
npm run db:seed
```

## 6. 開発サーバーの起動

### 6.1 フロントエンドとバックエンドを同時に起動

```bash
# フロントエンドとAPIサーバーを同時に起動
npm run dev:full
```

### 6.2 個別に起動する場合

**ターミナル1（APIサーバー）:**

```bash
npm run dev:api
```

**ターミナル2（フロントエンド）:**

```bash
npm run dev
```

## 7. 動作確認

- **フロントエンド**: http://localhost:5173
- **APIサーバー**: http://localhost:3001
- **Prisma Studio**: `npm run db:studio` で起動後、http://localhost:5555

## 8. 開発ワークフロー

### 8.1 コード品質チェック

```bash
# ESLintでコードをチェック
npm run lint

# 自動修正
npm run lint:fix

# Prettierでフォーマット
npm run format
```

### 8.2 テストの実行

```bash
# テストを実行
npm test

# ウォッチモードでテスト
npm run test:watch
```

### 8.3 ビルド

```bash
# プロダクション用ビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## 9. Git ワークフロー

### 9.1 ブランチ戦略

- `main`: 本番環境用の安定版
- `develop`: 開発用の統合ブランチ
- `feature/機能名`: 新機能開発用
- `bugfix/バグ名`: バグ修正用

### 9.2 開発手順

```bash
# 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 新しい機能ブランチを作成
git checkout -b feature/新機能名

# 開発作業...

# コミット前のチェック
npm run lint
npm test

# コミット
git add .
git commit -m "feat: 新機能の説明"

# プッシュ
git push origin feature/新機能名

# GitHub上でプルリクエストを作成
```

### 9.3 コミットメッセージ規約

```
type(scope): subject

例:
feat(auth): ログイン機能を追加
fix(customer): 顧客検索のバグを修正
docs(setup): 環境構築手順を更新
```

**Type:**

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードスタイル
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

## 10. トラブルシューティング

### 10.1 よくある問題

**Node.jsのバージョンエラー:**

```bash
# Node.jsのバージョンを確認
node --version

# nvmを使用してバージョンを切り替え（推奨）
nvm install 20
nvm use 20
```

**データベース接続エラー:**

PostgreSQLが起動しているか確認：

```bash
# Windows（サービスの確認）
sc query postgresql-x64-15

# サービスが停止している場合は起動
net start postgresql-x64-15

# macOS/Linux
sudo systemctl status postgresql

# 停止している場合は起動
sudo systemctl start postgresql
```

PostgreSQLに接続できない場合：

```bash
# 接続テスト
psql -U postgres -h localhost -p 5432

# パスワードが分からない場合は、PostgreSQLを再インストールするか
# pg_hba.confファイルを編集してtrust認証に変更
```

**ポートが使用中のエラー:**

```bash
# ポートを使用しているプロセスを確認
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :5173
lsof -i :3001
```

### 10.2 データベースのリセット

```bash
# データベースを完全にリセット
npm run db:reset
```

## 11. 開発環境の確認

すべてが正しく設定されているか確認するためのチェックリスト：

- [ ] Node.js v18以上がインストールされている（`node --version`）
- [ ] PostgreSQL v14以上がインストールされている（`psql --version`）
- [ ] Git がインストールされている（`git --version`）
- [ ] PostgreSQLサービスが起動している
- [ ] PostgreSQLにpostgresユーザーで接続できる
- [ ] `npm install` が正常に完了している
- [ ] `.env` ファイルのDATABASE_URLが正しく設定されている
- [ ] `npx prisma migrate dev` が正常に完了している
- [ ] `npm run dev:full` でフロントエンドとAPIが起動する
- [ ] http://localhost:5173 でアプリケーションにアクセスできる
- [ ] `npm test` でテストが通る
- [ ] `npm run lint` でエラーが出ない

## 12. 追加リソース

- [Prisma ドキュメント](https://www.prisma.io/docs/)
- [React ドキュメント](https://react.dev/)
- [Vite ドキュメント](https://vitejs.dev/)
- [Material-UI ドキュメント](https://mui.com/)

## サポート

問題が発生した場合は、以下の手順で対応してください：

1. このドキュメントのトラブルシューティングセクションを確認
2. GitHubのIssuesで既存の問題を検索
3. 新しいIssueを作成して詳細を報告

---

**最終更新**: 2026年1月4日
