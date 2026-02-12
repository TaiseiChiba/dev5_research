# ゴブコパ

銀行業務向けのゴブコパのフロントエンド実装です。

## 技術スタック

- **言語**: TypeScript
- **ビルドツール**: Vite
- **テストフレームワーク**: Jest
- **コード品質**: ESLint + Prettier
- **スタイル**: CSS3

## セットアップ

### 前提条件

- Node.js (v16以上)
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# または yarn を使用
yarn install
```

### 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# または yarn を使用
yarn dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認できます。

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクション用にビルド
- `npm run preview` - ビルド結果をプレビュー
- `npm run test` - テストを実行
- `npm run test:watch` - テストをウォッチモードで実行
- `npm run lint` - ESLintでコードをチェック
- `npm run lint:fix` - ESLintでコードを自動修正
- `npm run format` - Prettierでコードをフォーマット

## プロジェクト構造

```
├── src/                    # ソースコード
│   ├── main.ts            # メインエントリーポイント
│   └── styles/            # スタイルファイル
├── tests/                 # テストファイル
├── index.html             # HTMLテンプレート
├── package.json           # プロジェクト設定
├── tsconfig.json          # TypeScript設定
├── vite.config.ts         # Vite設定
├── jest.config.js         # Jest設定
├── .eslintrc.json         # ESLint設定
└── .prettierrc            # Prettier設定
```

## 開発ガイドライン

### コーディング規約

- TypeScriptの厳密モードを使用
- ESLint + Prettierによるコード品質管理
- 関数には適切な型注釈を付与
- テストカバレッジ80%以上を維持

### コミット前のチェック

```bash
# コードの品質チェック
npm run lint

# テストの実行
npm run test

# コードのフォーマット
npm run format
```

## 要件仕様

詳細な要件仕様は以下のファイルを参照してください：

- [要件定義書](.kiro/specs/app-name-change/requirements.md)
- [設計文書](.kiro/specs/app-name-change/design.md)
- [実装計画](.kiro/specs/app-name-change/tasks.md)
