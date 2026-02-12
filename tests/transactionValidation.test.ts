/**
 * 取引入力検証のテスト
 * 要件: 4.4, 4.5, 8.1, 8.2, 8.3
 */

import {
  validateAmount,
  validateDescription,
  validateTransactionDate,
  validateTransactionForm,
  isBusinessDay,
  isJapaneseHoliday,
} from '../src/utils/transactionValidation.js';
import { TransactionType } from '../src/types/transaction.js';

describe('取引入力検証機能', () => {
  describe('金額検証（要件 4.4, 8.2, 8.3）', () => {
    test('有効な金額は検証を通過する', () => {
      const result = validateAmount('1000');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    test('空の金額はエラーになる', () => {
      const result = validateAmount('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('金額を入力してください。');
    });

    test('負の金額はエラーになる', () => {
      const result = validateAmount('-100');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('金額は正の数値で入力してください。');
    });

    test('ゼロの金額はエラーになる', () => {
      const result = validateAmount('0');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('金額は正の数値で入力してください。');
    });

    test('小数点を含む金額はエラーになる', () => {
      const result = validateAmount('100.5');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('金額は整数で入力してください。');
    });

    test('上限額を超える金額はエラーになる', () => {
      const result = validateAmount('10000001');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('金額は10,000,000円以下で入力してください。');
    });

    test('文字列の金額はエラーになる', () => {
      const result = validateAmount('abc');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('有効な数値を入力してください。');
    });
  });

  describe('取引内容検証（要件 8.1, 8.2）', () => {
    test('有効な取引内容は検証を通過する', () => {
      const result = validateDescription('振込手数料');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    test('空の取引内容はエラーになる', () => {
      const result = validateDescription('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('取引内容を入力してください。');
    });

    test('空白のみの取引内容はエラーになる', () => {
      const result = validateDescription('   ');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('取引内容を入力してください。');
    });

    test('100文字を超える取引内容はエラーになる', () => {
      const longDescription = 'a'.repeat(101);
      const result = validateDescription(longDescription);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('取引内容は100文字以内で入力してください。');
    });

    test('100文字の取引内容は検証を通過する', () => {
      const maxDescription = 'a'.repeat(100);
      const result = validateDescription(maxDescription);
      expect(result.isValid).toBe(true);
    });
  });

  describe('営業日判定（要件 4.5）', () => {
    test('平日は営業日として判定される', () => {
      // 2024年1月2日（火曜日）
      const tuesday = new Date(2024, 0, 2);
      expect(isBusinessDay(tuesday)).toBe(true);
    });

    test('土曜日は営業日ではない', () => {
      // 2024年1月6日（土曜日）
      const saturday = new Date(2024, 0, 6);
      expect(isBusinessDay(saturday)).toBe(false);
    });

    test('日曜日は営業日ではない', () => {
      // 2024年1月7日（日曜日）
      const sunday = new Date(2024, 0, 7);
      expect(isBusinessDay(sunday)).toBe(false);
    });
  });

  describe('祝日判定', () => {
    test('元日は祝日として判定される', () => {
      const newYear = new Date(2024, 0, 1);
      expect(isJapaneseHoliday(newYear)).toBe(true);
    });

    test('通常の平日は祝日ではない', () => {
      const normalDay = new Date(2024, 0, 10);
      expect(isJapaneseHoliday(normalDay)).toBe(false);
    });
  });

  describe('取引日検証（要件 4.5, 8.2）', () => {
    test('有効な営業日は検証を通過する', () => {
      // 未来の平日を設定
      const futureBusinessDay = new Date();
      futureBusinessDay.setDate(futureBusinessDay.getDate() + 7);
      // 平日になるまで調整
      while (!isBusinessDay(futureBusinessDay)) {
        futureBusinessDay.setDate(futureBusinessDay.getDate() + 1);
      }

      const result = validateTransactionDate(
        futureBusinessDay.toISOString().split('T')[0]
      );
      expect(result.isValid).toBe(true);
    });

    test('過去の日付はエラーになる', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = validateTransactionDate(
        yesterday.toISOString().split('T')[0]
      );
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('過去の日付は選択できません。');
    });

    test('土曜日はエラーになる', () => {
      // 未来の土曜日を設定
      const futureSaturday = new Date();
      futureSaturday.setDate(futureSaturday.getDate() + 7);
      while (futureSaturday.getDay() !== 6) {
        futureSaturday.setDate(futureSaturday.getDate() + 1);
      }

      const result = validateTransactionDate(
        futureSaturday.toISOString().split('T')[0]
      );
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(
        '営業日（平日）を選択してください。土日は選択できません。'
      );
    });

    test('日曜日はエラーになる', () => {
      // 未来の日曜日を設定
      const futureSunday = new Date();
      futureSunday.setDate(futureSunday.getDate() + 7);
      while (futureSunday.getDay() !== 0) {
        futureSunday.setDate(futureSunday.getDate() + 1);
      }

      const result = validateTransactionDate(
        futureSunday.toISOString().split('T')[0]
      );
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(
        '営業日（平日）を選択してください。土日は選択できません。'
      );
    });

    test('空の日付はエラーになる', () => {
      const result = validateTransactionDate('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('取引日を選択してください。');
    });

    test('無効な日付形式はエラーになる', () => {
      const result = validateTransactionDate('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('有効な日付を入力してください。');
    });
  });

  describe('フォーム全体検証（要件 8.1）', () => {
    test('振込取引の必須項目が不足している場合はエラーになる', () => {
      const formData = {
        type: TransactionType.TRANSFER,
        sourceAccountId: '',
        destinationAccountId: 'acc002',
        amount: '1000',
        description: '振込手数料',
        transactionDate: '2024-12-31',
      };

      const errors = validateTransactionForm(formData);
      expect(errors.sourceAccountId).toBe('振込元口座を選択してください。');
    });

    test('入金取引の必須項目が不足している場合はエラーになる', () => {
      const formData = {
        type: TransactionType.DEPOSIT,
        sourceAccountId: '',
        destinationAccountId: '',
        amount: '1000',
        description: '入金',
        transactionDate: '2024-12-31',
      };

      const errors = validateTransactionForm(formData);
      expect(errors.destinationAccountId).toBe(
        '入金先口座を選択してください。'
      );
    });

    test('出金取引の必須項目が不足している場合はエラーになる', () => {
      const formData = {
        type: TransactionType.WITHDRAWAL,
        sourceAccountId: '',
        destinationAccountId: '',
        amount: '1000',
        description: '出金',
        transactionDate: '2024-12-31',
      };

      const errors = validateTransactionForm(formData);
      expect(errors.sourceAccountId).toBe('出金元口座を選択してください。');
    });

    test('振込で同じ口座を指定した場合はエラーになる', () => {
      const formData = {
        type: TransactionType.TRANSFER,
        sourceAccountId: 'acc001',
        destinationAccountId: 'acc001',
        amount: '1000',
        description: '振込',
        transactionDate: '2024-12-31',
      };

      const errors = validateTransactionForm(formData);
      expect(errors.destinationAccountId).toBe(
        '振込元と振込先に同じ口座は選択できません。'
      );
    });

    test('すべての項目が有効な場合はエラーがない', () => {
      // 未来の営業日を設定
      const futureBusinessDay = new Date();
      futureBusinessDay.setDate(futureBusinessDay.getDate() + 7);
      while (!isBusinessDay(futureBusinessDay)) {
        futureBusinessDay.setDate(futureBusinessDay.getDate() + 1);
      }

      const formData = {
        type: TransactionType.TRANSFER,
        sourceAccountId: 'acc001',
        destinationAccountId: 'acc002',
        amount: '1000',
        description: '振込手数料',
        transactionDate: futureBusinessDay.toISOString().split('T')[0],
      };

      const errors = validateTransactionForm(formData);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});
