# Design Document

## Overview

アプリケーション名を「金融系業務アプリケーション」から「ゴブコパ」に変更するための設計文書。この変更は、ユーザーインターフェース、設定ファイル、ドキュメント、およびソースコード内のすべての参照を対象とする包括的な更新作業です。

## Architecture

### 変更対象の分類

1. **ユーザーインターフェース層**
   - React コンポーネント内の表示テキスト
   - HTML ファイルのタイトルタグ
   - ブラウザタイトルとページヘッダー

2. **設定・メタデータ層**
   - package.json の name と description フィールド
   - HTML メタタグ
   - Prisma スキーマのコメント

3. **ドキュメント層**
   - README ファイル
   - ソースコードコメント
   - スペックファイルの参照

4. **コード参照層**
   - TypeScript ファイル内のコメント
   - CSS ファイルのコメント
   - ログ出力メッセージ

## Components and Interfaces

### 名前変更マッピング

| 変更前                     | 変更後   | 用途                 |
| -------------------------- | -------- | -------------------- |
| 金融系業務アプリケーション | ゴブコパ | UI表示、ドキュメント |
| financial-business-app     | gobkopa  | パッケージ名、識別子 |
| 金融業務アプリ             | ゴブコパ | モバイル表示用短縮名 |

### 変更対象ファイル

**設定ファイル:**

- `package.json` - name, description フィールド
- `package-lock.json` - name フィールド（npm install で自動更新）
- `index.html` - title タグ
- `debug.html` - title タグ

**ソースコード:**

- `src/types/index.ts` - ファイルヘッダーコメント
- `src/styles/main.css` - ファイルヘッダーコメント
- `src/main.tsx` - ファイルヘッダーコメント
- `src/main.ts` - ファイルヘッダーコメント、ログメッセージ、ウェルカムメッセージ
- `src/components/MainApplication.tsx` - ウェルカムメッセージ
- `src/components/account/AppLayout.tsx` - アプリケーション名表示

**ドキュメント:**

- `README.md` - タイトル、説明文、スペックファイル参照
- `src/README.md` - タイトル、説明文
- `src/components/shared/README.md` - 説明文、スペックファイル参照
- `prisma/schema.prisma` - ファイルヘッダーコメント

**スペックファイル参照:**

- 既存スペックファイルのディレクトリ名は保持（履歴として）
- 新しい参照は新しい名前を使用

## Data Models

### 変更データ構造

```typescript
interface NameChangeMapping {
  oldName: string;
  newName: string;
  fileType: 'ui' | 'config' | 'documentation' | 'code';
  context: string;
}

interface FileUpdateTask {
  filePath: string;
  changes: NameChangeMapping[];
  updateType: 'replace' | 'modify';
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: UI Components Display New Name

_For any_ UI component file, the rendered content should contain "ゴブコパ" and should not contain "金融系業務アプリケーション"
**Validates: Requirements 1.1**

### Property 2: HTML Files Use New Name

_For any_ HTML file, the title tags and meta descriptions should contain "ゴブコパ" and should not contain "金融系業務アプリケーション"
**Validates: Requirements 1.2, 2.2**

### Property 3: Documentation References New Name

_For any_ documentation file (README, comments, schema), the content should reference "ゴブコパ" or "gobkopa" and should not contain "金融系業務アプリケーション" or "financial-business-app"
**Validates: Requirements 1.3, 2.3, 2.4**

### Property 4: Source Code Uses New Name

_For any_ source code file, comments and string literals should use "ゴブコパ" or appropriate English equivalents and should not contain the old application name
**Validates: Requirements 1.4, 3.4**

## Error Handling

### 変更失敗時の対応

1. **ファイル更新エラー**
   - 権限不足やファイルロックによる更新失敗
   - ロールバック機能は提供しない（Git履歴に依存）

2. **構文エラー**
   - package.json の JSON 構文エラー
   - 更新前にバックアップ作成を推奨

3. **参照整合性**
   - スペックファイル参照の不整合
   - 段階的更新により最小化

## Testing Strategy

### デュアルテスト戦略

**Unit Tests:**

- 特定ファイルの内容確認
- 設定ファイルの構文検証
- 重要なUI コンポーネントの表示確認

**Property Tests:**

- ファイル内容の包括的スキャン
- 名前変更の完全性検証
- 最低100回の反復実行でランダムファイル選択

**Property Test Configuration:**

- Testing Framework: Jest with fast-check
- Minimum 100 iterations per property test
- Tag format: **Feature: app-name-change, Property {number}: {property_text}**
