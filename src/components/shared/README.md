# 統一メッセージシステム

このディレクトリには、要件 8.5, 9.2, 9.3, 9.4 に対応した統一されたエラーハンドリングとメッセージ表示システムが含まれています。

## 概要

ゴブコパにおいて、一貫したユーザーフィードバックを提供するための包括的なメッセージシステムです。

### 主要機能

1. **統一されたエラーメッセージ表示** (要件 8.5)
2. **成功メッセージとフィードバック** (要件 9.2)
3. **具体的なエラーメッセージとガイダンス** (要件 9.3)
4. **一貫したメッセージングパターン** (要件 9.4)
5. **確認ダイアログコンポーネント** (要件 9.1)

## コンポーネント一覧

### MessageDisplay.tsx

- `MessageDisplay`: 統一されたメッセージ表示コンポーネント
- `InlineMessage`: インライン形式のメッセージ表示
- `ToastMessage`: トースト形式のメッセージ表示
- `createMessage`: メッセージ作成ヘルパー関数

### ConfirmationDialog.tsx

- `ConfirmationDialog`: 確認ダイアログコンポーネント
- `createConfirmation`: 確認ダイアログ作成ヘルパー関数

### MessageContext.tsx

- `MessageProvider`: グローバルメッセージ管理プロバイダー
- `useMessage`: メッセージ管理フック
- `useNotification`: 簡単な通知表示フック

### FormValidation.tsx

- `ValidatedTextField`: 検証機能付きテキストフィールド
- `FormValidator`: フォーム検証ヘルパークラス
- `ValidationPatterns`: 共通の検証パターン
- `CommonValidations`: 共通の検証ルール

## 使用方法

### 1. アプリケーションの初期化

```tsx
import { MessageProvider } from './components/shared/MessageContext';

function App() {
  return (
    <MessageProvider>{/* アプリケーションのコンテンツ */}</MessageProvider>
  );
}
```

### 2. トーストメッセージの表示

```tsx
import { useNotification } from './components/shared/MessageContext';

function MyComponent() {
  const notification = useNotification();

  const handleSuccess = () => {
    notification.success('操作が正常に完了しました。');
  };

  const handleError = () => {
    notification.error('エラーが発生しました。');
  };

  return (
    <div>
      <button onClick={handleSuccess}>成功メッセージ</button>
      <button onClick={handleError}>エラーメッセージ</button>
    </div>
  );
}
```

### 3. インラインメッセージの表示

```tsx
import {
  MessageDisplay,
  createMessage,
} from './components/shared/MessageDisplay';

function MyComponent() {
  const [message, setMessage] = useState(null);

  const showValidationError = () => {
    const errorMessage = createMessage.validationError(
      '入力内容に問題があります。',
      [
        {
          field: 'customerName',
          code: 'REQUIRED',
          message: '顧客名は必須です。',
          guidance: '顧客名を入力してください。',
        },
      ]
    );
    setMessage(errorMessage);
  };

  return (
    <div>
      {message && (
        <MessageDisplay
          message={message}
          onClose={() => setMessage(null)}
          variant="inline"
        />
      )}
      <button onClick={showValidationError}>検証エラー表示</button>
    </div>
  );
}
```

### 4. 確認ダイアログの使用

```tsx
import {
  ConfirmationDialog,
  createConfirmation,
} from './components/shared/ConfirmationDialog';

function MyComponent() {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    props: {},
  });

  const handleDelete = () => {
    const confirmation = createConfirmation.delete(
      '選択された顧客を削除しますか？',
      {
        items: [
          { label: '顧客名', value: '田中太郎' },
          { label: '顧客番号', value: '12345678' },
        ],
      }
    );

    setConfirmDialog({
      open: true,
      props: {
        ...confirmation,
        onConfirm: async () => {
          // 削除処理
          await deleteCustomer();
          setConfirmDialog({ open: false, props: {} });
        },
        onCancel: () => {
          setConfirmDialog({ open: false, props: {} });
        },
      },
    });
  };

  return (
    <div>
      <button onClick={handleDelete}>顧客削除</button>
      <ConfirmationDialog {...confirmDialog.props} open={confirmDialog.open} />
    </div>
  );
}
```

### 5. フォーム検証の使用

```tsx
import {
  ValidatedTextField,
  CommonValidations,
} from './components/shared/FormValidation';

function CustomerForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneticName: '',
    email: '',
  });

  return (
    <form>
      <ValidatedTextField
        fullWidth
        name="customerName"
        label="顧客名"
        value={formData.customerName}
        onChange={e =>
          setFormData(prev => ({
            ...prev,
            customerName: e.target.value,
          }))
        }
        validation={CommonValidations.customerName}
      />

      <ValidatedTextField
        fullWidth
        name="phoneticName"
        label="フリガナ"
        value={formData.phoneticName}
        onChange={e =>
          setFormData(prev => ({
            ...prev,
            phoneticName: e.target.value,
          }))
        }
        validation={CommonValidations.phoneticName}
      />

      <ValidatedTextField
        fullWidth
        name="email"
        label="メールアドレス"
        value={formData.email}
        onChange={e =>
          setFormData(prev => ({
            ...prev,
            email: e.target.value,
          }))
        }
        validation={CommonValidations.email}
      />
    </form>
  );
}
```

## メッセージの種類

### 成功メッセージ (SUCCESS)

- 操作の正常完了を通知
- 自動的に4秒後に非表示
- 緑色のアイコンと背景

### エラーメッセージ (ERROR)

- エラーの発生を通知
- 手動で閉じるまで表示継続
- 赤色のアイコンと背景
- ガイダンス情報を含む場合がある

### 警告メッセージ (WARNING)

- 注意が必要な状況を通知
- 手動で閉じるまで表示継続
- 黄色のアイコンと背景

### 情報メッセージ (INFO)

- 一般的な情報を通知
- 自動的に6秒後に非表示
- 青色のアイコンと背景

## 確認ダイアログの種類

- **DELETE**: 削除確認（高重要度、赤色）
- **SAVE**: 保存確認（中重要度、青色）
- **SUBMIT**: 送信確認（中重要度、青色）
- **APPROVE**: 承認確認（高重要度、緑色）
- **REJECT**: 却下確認（高重要度、赤色）

## 検証パターン

### 日本語関連

- `JAPANESE`: 日本語文字（ひらがな、カタカナ、漢字）
- `KATAKANA`: カタカナのみ

### 連絡先情報

- `EMAIL`: メールアドレス形式
- `PHONE`: 電話番号形式
- `POSTAL_CODE`: 郵便番号形式

### 金融業務関連

- `ACCOUNT_NUMBER`: 口座番号（7桁）
- `CUSTOMER_NUMBER`: 顧客番号（8桁）
- `AMOUNT`: 金額（カンマ区切り対応）

## 設計原則

1. **一貫性**: すべてのメッセージが統一されたパターンに従う
2. **具体性**: 問題の内容と解決方法を明確に示す
3. **建設性**: ユーザーが次に取るべきアクションを提示
4. **セキュリティ**: 機密情報の漏洩を防ぐ適切な抽象化

## テスト

メッセージシステムの動作確認は、ダッシュボードの「統一メッセージシステム」セクションで行えます。各種メッセージタイプのデモンストレーションが利用可能です。

## 参考

- 要件定義書: `.kiro/specs/app-name-change/requirements.md`
- 設計文書: `.kiro/specs/app-name-change/design.md`
- 実装例: `MessageExample.tsx`
