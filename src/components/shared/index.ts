/**
 * 共通コンポーネントのエクスポート
 */

// メッセージ表示関連
export {
  MessageDisplay,
  InlineMessage,
  ToastMessage,
  MessageType,
  MessageSeverity,
  createMessage,
  type MessageData,
  type ErrorDetail,
} from './MessageDisplay';

// メッセージコンテキスト
export { MessageProvider, useMessage, useNotification } from './MessageContext';

// 確認ダイアログ
export {
  ConfirmationDialog,
  ConfirmationType,
  ConfirmationSeverity,
  createConfirmation,
  type ConfirmationDialogProps,
  type ConfirmationItem,
} from './ConfirmationDialog';

// フォーム検証
export {
  ValidatedTextField,
  FormValidator,
  ValidationPatterns,
  CommonValidations,
  type ValidationRule,
  type ValidationResult,
  type FieldValidation,
  type FormValidationState,
} from './FormValidation';

// ナビゲーション・レイアウト関連
export { default as MainNavigation } from './MainNavigation';
export { default as BreadcrumbNavigation } from './BreadcrumbNavigation';
export { default as ResponsiveLayout } from './ResponsiveLayout';
