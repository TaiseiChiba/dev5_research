/**
 * フォーム検証ヘルパーコンポーネント
 * 要件 8.1, 8.2, 8.5 に対応 - 入力検証とリアルタイムフィードバック
 */

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { ErrorDetail } from './MessageDisplay';

/**
 * 検証ルール
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | undefined;
}

/**
 * 検証結果
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * フィールド検証設定
 */
export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

/**
 * フォーム検証状態
 */
export interface FormValidationState {
  [fieldName: string]: ValidationResult;
}

/**
 * 検証付きテキストフィールドのプロパティ
 */
interface ValidatedTextFieldProps extends Omit<
  TextFieldProps,
  'error' | 'helperText'
> {
  name: string;
  validation?: ValidationRule;
  onValidation?: (name: string, result: ValidationResult) => void;
  showValidationOnChange?: boolean;
  showValidationOnBlur?: boolean;
}

/**
 * 検証付きテキストフィールドコンポーネント
 */
export const ValidatedTextField: React.FC<ValidatedTextFieldProps> = ({
  name,
  validation,
  onValidation,
  showValidationOnChange = true,
  showValidationOnBlur = true,
  onChange,
  onBlur,
  value,
  ...props
}) => {
  const [validationResult, setValidationResult] =
    React.useState<ValidationResult>({
      isValid: true,
    });
  const [touched, setTouched] = React.useState(false);

  const validateValue = React.useCallback(
    (val: any): ValidationResult => {
      if (!validation) {
        return { isValid: true };
      }

      const stringValue = String(val || '');

      // 必須チェック
      if (validation.required && !stringValue.trim()) {
        return {
          isValid: false,
          error: 'この項目は必須です。',
          errorCode: 'REQUIRED',
        };
      }

      // 値が空の場合、必須でなければ有効
      if (!stringValue.trim() && !validation.required) {
        return { isValid: true };
      }

      // 最小長チェック
      if (validation.minLength && stringValue.length < validation.minLength) {
        return {
          isValid: false,
          error: `${validation.minLength}文字以上で入力してください。`,
          errorCode: 'MIN_LENGTH',
        };
      }

      // 最大長チェック
      if (validation.maxLength && stringValue.length > validation.maxLength) {
        return {
          isValid: false,
          error: `${validation.maxLength}文字以下で入力してください。`,
          errorCode: 'MAX_LENGTH',
        };
      }

      // パターンチェック
      if (validation.pattern && !validation.pattern.test(stringValue)) {
        return {
          isValid: false,
          error: '入力形式が正しくありません。',
          errorCode: 'PATTERN',
        };
      }

      // 数値の最小値チェック
      if (validation.min !== undefined) {
        const numValue = Number(stringValue);
        if (isNaN(numValue) || numValue < validation.min) {
          return {
            isValid: false,
            error: `${validation.min}以上の値を入力してください。`,
            errorCode: 'MIN_VALUE',
          };
        }
      }

      // 数値の最大値チェック
      if (validation.max !== undefined) {
        const numValue = Number(stringValue);
        if (isNaN(numValue) || numValue > validation.max) {
          return {
            isValid: false,
            error: `${validation.max}以下の値を入力してください。`,
            errorCode: 'MAX_VALUE',
          };
        }
      }

      // カスタム検証
      if (validation.custom) {
        const customError = validation.custom(val);
        if (customError) {
          return {
            isValid: false,
            error: customError,
            errorCode: 'CUSTOM',
          };
        }
      }

      return { isValid: true };
    },
    [validation]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    if (showValidationOnChange && touched) {
      const result = validateValue(newValue);
      setValidationResult(result);
      onValidation?.(name, result);
    }

    onChange?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);

    if (showValidationOnBlur) {
      const result = validateValue(event.target.value);
      setValidationResult(result);
      onValidation?.(name, result);
    }

    onBlur?.(event);
  };

  // 外部から値が変更された場合の検証
  React.useEffect(() => {
    if (touched) {
      const result = validateValue(value);
      setValidationResult(result);
      onValidation?.(name, result);
    }
  }, [value, validateValue, touched, name, onValidation]);

  const showError = touched && !validationResult.isValid;

  return (
    <TextField
      {...props}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={showError}
      helperText={
        showError ? validationResult.error : (props as any).helperText
      }
    />
  );
};

/**
 * フォーム検証ヘルパークラス
 */
export class FormValidator {
  private validations: FieldValidation;
  private state: FormValidationState = {};

  constructor(validations: FieldValidation) {
    this.validations = validations;
  }

  /**
   * 単一フィールドの検証
   */
  validateField(name: string, value: any): ValidationResult {
    const validation = this.validations[name];
    if (!validation) {
      return { isValid: true };
    }

    const stringValue = String(value || '');

    // 必須チェック
    if (validation.required && !stringValue.trim()) {
      return {
        isValid: false,
        error: 'この項目は必須です。',
        errorCode: 'REQUIRED',
      };
    }

    // 値が空の場合、必須でなければ有効
    if (!stringValue.trim() && !validation.required) {
      return { isValid: true };
    }

    // 最小長チェック
    if (validation.minLength && stringValue.length < validation.minLength) {
      return {
        isValid: false,
        error: `${validation.minLength}文字以上で入力してください。`,
        errorCode: 'MIN_LENGTH',
      };
    }

    // 最大長チェック
    if (validation.maxLength && stringValue.length > validation.maxLength) {
      return {
        isValid: false,
        error: `${validation.maxLength}文字以下で入力してください。`,
        errorCode: 'MAX_LENGTH',
      };
    }

    // パターンチェック
    if (validation.pattern && !validation.pattern.test(stringValue)) {
      return {
        isValid: false,
        error: '入力形式が正しくありません。',
        errorCode: 'PATTERN',
      };
    }

    // 数値の最小値チェック
    if (validation.min !== undefined) {
      const numValue = Number(stringValue);
      if (isNaN(numValue) || numValue < validation.min) {
        return {
          isValid: false,
          error: `${validation.min}以上の値を入力してください。`,
          errorCode: 'MIN_VALUE',
        };
      }
    }

    // 数値の最大値チェック
    if (validation.max !== undefined) {
      const numValue = Number(stringValue);
      if (isNaN(numValue) || numValue > validation.max) {
        return {
          isValid: false,
          error: `${validation.max}以下の値を入力してください。`,
          errorCode: 'MAX_VALUE',
        };
      }
    }

    // カスタム検証
    if (validation.custom) {
      const customError = validation.custom(value);
      if (customError) {
        return {
          isValid: false,
          error: customError,
          errorCode: 'CUSTOM',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * フォーム全体の検証
   */
  validateForm(formData: Record<string, any>): {
    isValid: boolean;
    errors: ErrorDetail[];
    state: FormValidationState;
  } {
    const errors: ErrorDetail[] = [];
    const newState: FormValidationState = {};

    Object.keys(this.validations).forEach(fieldName => {
      const result = this.validateField(fieldName, formData[fieldName]);
      newState[fieldName] = result;

      if (!result.isValid) {
        errors.push({
          field: fieldName,
          code: result.errorCode || 'VALIDATION_ERROR',
          message: result.error || '検証エラーが発生しました。',
        });
      }
    });

    this.state = newState;

    return {
      isValid: errors.length === 0,
      errors,
      state: newState,
    };
  }

  /**
   * 検証状態の取得
   */
  getValidationState(): FormValidationState {
    return this.state;
  }

  /**
   * 特定フィールドの検証状態を取得
   */
  getFieldValidation(fieldName: string): ValidationResult {
    return this.state[fieldName] || { isValid: true };
  }
}

/**
 * 共通の検証パターン
 */
export const ValidationPatterns = {
  // 日本語文字（ひらがな、カタカナ、漢字）
  JAPANESE: /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3005\u3006\u30FC\s]+$/,

  // カタカナのみ
  KATAKANA: /^[\u30A0-\u30FF\u30FC\s]+$/,

  // 英数字のみ
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,

  // メールアドレス
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // 電話番号（ハイフンあり・なし両対応）
  PHONE: /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/,

  // 郵便番号（ハイフンあり・なし両対応）
  POSTAL_CODE: /^\d{3}-?\d{4}$/,

  // 数値のみ
  NUMERIC: /^\d+$/,

  // 金額（カンマ区切り対応）
  AMOUNT: /^\d{1,3}(,\d{3})*(\.\d{1,2})?$/,

  // 口座番号（7桁）
  ACCOUNT_NUMBER: /^\d{7}$/,

  // 顧客番号（8桁）
  CUSTOMER_NUMBER: /^\d{8}$/,
};

/**
 * 共通の検証ルール
 */
export const CommonValidations = {
  required: { required: true },

  customerName: {
    required: true,
    minLength: 1,
    maxLength: 50,
  },

  phoneticName: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: ValidationPatterns.KATAKANA,
  },

  email: {
    pattern: ValidationPatterns.EMAIL,
    maxLength: 100,
  },

  phone: {
    pattern: ValidationPatterns.PHONE,
    maxLength: 15,
  },

  postalCode: {
    pattern: ValidationPatterns.POSTAL_CODE,
    maxLength: 8,
  },

  amount: {
    required: true,
    min: 0,
    max: 99999999,
    custom: (value: string) => {
      const numValue = Number(value.replace(/,/g, ''));
      if (isNaN(numValue)) {
        return '有効な金額を入力してください。';
      }
      return undefined;
    },
  },

  accountNumber: {
    required: true,
    pattern: ValidationPatterns.ACCOUNT_NUMBER,
  },

  customerNumber: {
    required: true,
    pattern: ValidationPatterns.CUSTOMER_NUMBER,
  },
};

export default ValidatedTextField;
