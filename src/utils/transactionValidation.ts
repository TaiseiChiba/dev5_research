/**
 * 取引入力検証ユーティリティ
 *
 * 要件: 4.4, 4.5, 8.1, 8.2, 8.3
 */

import { TransactionType } from '../types/transaction.js';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface TransactionFormData {
  type: TransactionType;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  description: string;
  transactionDate: string;
}

export interface ValidationErrors {
  type?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount?: string;
  description?: string;
  transactionDate?: string;
  general?: string;
}

/**
 * 必須項目の検証
 * 要件: 8.1 - 必須フィールドが空の際、システムはフォーム送信を防止し、不足フィールドをハイライトすること
 */
export const validateRequiredFields = (
  formData: TransactionFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // 取引タイプ別の必須項目チェック
  switch (formData.type) {
    case TransactionType.TRANSFER:
      if (!formData.sourceAccountId.trim()) {
        errors.sourceAccountId = '振込元口座を選択してください。';
      }
      if (!formData.destinationAccountId.trim()) {
        errors.destinationAccountId = '振込先口座を選択してください。';
      }
      if (
        formData.sourceAccountId &&
        formData.destinationAccountId &&
        formData.sourceAccountId === formData.destinationAccountId
      ) {
        errors.destinationAccountId =
          '振込元と振込先に同じ口座は選択できません。';
      }
      break;

    case TransactionType.DEPOSIT:
      if (!formData.destinationAccountId.trim()) {
        errors.destinationAccountId = '入金先口座を選択してください。';
      }
      break;

    case TransactionType.WITHDRAWAL:
      if (!formData.sourceAccountId.trim()) {
        errors.sourceAccountId = '出金元口座を選択してください。';
      }
      break;
  }

  // 共通必須項目
  if (!formData.amount.trim()) {
    errors.amount = '金額を入力してください。';
  }

  if (!formData.description.trim()) {
    errors.description = '取引内容を入力してください。';
  }

  if (!formData.transactionDate.trim()) {
    errors.transactionDate = '取引日を選択してください。';
  }

  return errors;
};

/**
 * 金額の形式と上限額の検証
 * 要件: 4.4, 8.2, 8.3 - 取引金額を入力する際、システムは数値形式を検証し、上限額を強制すること
 */
export const validateAmount = (amountStr: string): ValidationResult => {
  if (!amountStr.trim()) {
    return { isValid: false, message: '金額を入力してください。' };
  }

  // 数値形式の検証
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    return { isValid: false, message: '有効な数値を入力してください。' };
  }

  // 正の数値チェック
  if (amount <= 0) {
    return { isValid: false, message: '金額は正の数値で入力してください。' };
  }

  // 小数点以下の桁数チェック（円単位のため小数点以下は不可）
  if (amount !== Math.floor(amount)) {
    return { isValid: false, message: '金額は整数で入力してください。' };
  }

  // 上限額チェック（1,000万円）
  const MAX_AMOUNT = 10000000;
  if (amount > MAX_AMOUNT) {
    return {
      isValid: false,
      message: `金額は${MAX_AMOUNT.toLocaleString()}円以下で入力してください。`,
    };
  }

  // 最小額チェック
  const MIN_AMOUNT = 1;
  if (amount < MIN_AMOUNT) {
    return {
      isValid: false,
      message: `金額は${MIN_AMOUNT}円以上で入力してください。`,
    };
  }

  return { isValid: true };
};

/**
 * 取引内容の検証
 * 要件: 8.1, 8.2 - 入力検証とエラー制御
 */
export const validateDescription = (description: string): ValidationResult => {
  if (!description.trim()) {
    return { isValid: false, message: '取引内容を入力してください。' };
  }

  const MAX_LENGTH = 100;
  if (description.length > MAX_LENGTH) {
    return {
      isValid: false,
      message: `取引内容は${MAX_LENGTH}文字以内で入力してください。`,
    };
  }

  // 特殊文字のチェック（基本的な文字のみ許可）
  const validPattern =
    /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBFa-zA-Z0-9\s\-_.,()（）「」【】]*$/;
  if (!validPattern.test(description)) {
    return {
      isValid: false,
      message: '取引内容に使用できない文字が含まれています。',
    };
  }

  return { isValid: true };
};

/**
 * 営業日の判定
 * 要件: 4.5 - 取引日を入力する際、システムは日付形式と営業日制約を検証すること
 */
export const isBusinessDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  // 0 = 日曜日, 6 = 土曜日
  return dayOfWeek !== 0 && dayOfWeek !== 6;
};

/**
 * 日本の祝日判定（簡易版）
 * 実際の実装では、より包括的な祝日データベースを使用することを推奨
 */
export const isJapaneseHoliday = (date: Date): boolean => {
  const month = date.getMonth() + 1; // 0-based to 1-based
  const day = date.getDate();

  // 固定祝日の例（実際にはより包括的なリストが必要）
  const fixedHolidays = [
    { month: 1, day: 1 }, // 元日
    { month: 2, day: 11 }, // 建国記念の日
    { month: 4, day: 29 }, // 昭和の日
    { month: 5, day: 3 }, // 憲法記念日
    { month: 5, day: 4 }, // みどりの日
    { month: 5, day: 5 }, // こどもの日
    { month: 8, day: 11 }, // 山の日
    { month: 11, day: 3 }, // 文化の日
    { month: 11, day: 23 }, // 勤労感謝の日
    { month: 12, day: 23 }, // 天皇誕生日
  ];

  return fixedHolidays.some(
    holiday => holiday.month === month && holiday.day === day
  );
};

/**
 * 取引日の検証
 * 要件: 4.5, 8.2 - 取引日を入力する際、システムは日付形式と営業日制約を検証すること
 */
export const validateTransactionDate = (dateStr: string): ValidationResult => {
  if (!dateStr.trim()) {
    return { isValid: false, message: '取引日を選択してください。' };
  }

  // 日付形式の検証
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { isValid: false, message: '有効な日付を入力してください。' };
  }

  // 過去日チェック
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (date < todayStart) {
    return { isValid: false, message: '過去の日付は選択できません。' };
  }

  // 営業日チェック
  if (!isBusinessDay(date)) {
    return {
      isValid: false,
      message: '営業日（平日）を選択してください。土日は選択できません。',
    };
  }

  // 祝日チェック
  if (isJapaneseHoliday(date)) {
    return {
      isValid: false,
      message: '祝日は選択できません。営業日を選択してください。',
    };
  }

  // 未来日の制限（例：3ヶ月先まで）
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);
  if (date > maxFutureDate) {
    return {
      isValid: false,
      message: '取引日は3ヶ月先までの日付を選択してください。',
    };
  }

  return { isValid: true };
};

/**
 * フォーム全体の検証
 * 要件: 8.1, 8.2, 8.3 - 包括的な入力検証
 */
export const validateTransactionForm = (
  formData: TransactionFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // 必須項目の検証
  const requiredFieldErrors = validateRequiredFields(formData);
  Object.assign(errors, requiredFieldErrors);

  // 金額の検証
  if (formData.amount) {
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.message;
    }
  }

  // 取引内容の検証
  if (formData.description) {
    const descriptionValidation = validateDescription(formData.description);
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.message;
    }
  }

  // 取引日の検証
  if (formData.transactionDate) {
    const dateValidation = validateTransactionDate(formData.transactionDate);
    if (!dateValidation.isValid) {
      errors.transactionDate = dateValidation.message;
    }
  }

  return errors;
};

/**
 * リアルタイム検証用のデバウンス関数
 * 要件: 8.5 - システムはデータ入力中にリアルタイムの検証フィードバックを提供すること
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
