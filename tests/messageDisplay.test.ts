/**
 * メッセージ表示コンポーネントのテスト
 * 要件 8.5, 9.2, 9.3, 9.4 の検証
 */

import {
  createMessage,
  MessageType,
  MessageSeverity,
} from '../src/components/shared/MessageDisplay';
import {
  FormValidator,
  CommonValidations,
  ValidationPatterns,
} from '../src/components/shared/FormValidation';

describe('Message Display Components', () => {
  describe('createMessage helper functions', () => {
    test('should create success message with correct properties', () => {
      const message = createMessage.success('操作が成功しました');

      expect(message.type).toBe(MessageType.SUCCESS);
      expect(message.message).toBe('操作が成功しました');
      expect(message.autoHide).toBe(true);
      expect(message.autoHideDuration).toBe(4000);
    });

    test('should create error message with correct properties', () => {
      const message = createMessage.error('エラーが発生しました');

      expect(message.type).toBe(MessageType.ERROR);
      expect(message.message).toBe('エラーが発生しました');
      expect(message.severity).toBe(MessageSeverity.HIGH);
      expect(message.autoHide).toBe(false);
    });

    test('should create validation error with details', () => {
      const details = [
        {
          field: 'customerName',
          code: 'REQUIRED',
          message: '顧客名は必須です。',
        },
      ];

      const message = createMessage.validationError('入力検証エラー', details);

      expect(message.type).toBe(MessageType.ERROR);
      expect(message.title).toBe('入力検証エラー');
      expect(message.details).toEqual(details);
      expect(message.guidance).toBe(
        '以下の項目を確認して、再度お試しください。'
      );
    });

    test('should create system error with default message', () => {
      const message = createMessage.systemError();

      expect(message.type).toBe(MessageType.ERROR);
      expect(message.severity).toBe(MessageSeverity.CRITICAL);
      expect(message.title).toBe('システムエラー');
      expect(message.message).toContain('システムで問題が発生しました');
      expect(message.guidance).toContain(
        'システム管理者にお問い合わせください'
      );
    });
  });

  describe('FormValidator', () => {
    let validator: FormValidator;

    beforeEach(() => {
      validator = new FormValidator({
        customerName: CommonValidations.customerName,
        phoneticName: CommonValidations.phoneticName,
        email: CommonValidations.email,
        amount: CommonValidations.amount,
      });
    });

    test('should validate required fields correctly', () => {
      const result = validator.validateField('customerName', '');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('この項目は必須です。');
      expect(result.errorCode).toBe('REQUIRED');
    });

    test('should validate phonetic name pattern', () => {
      const validResult = validator.validateField(
        'phoneticName',
        'タナカタロウ'
      );
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validateField('phoneticName', 'tanaka');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorCode).toBe('PATTERN');
    });

    test('should validate email format', () => {
      const validResult = validator.validateField('email', 'test@example.com');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validateField('email', 'invalid-email');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorCode).toBe('PATTERN');
    });

    test('should validate amount range', () => {
      const validResult = validator.validateField('amount', '100000');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validateField('amount', '999999999');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorCode).toBe('MAX_VALUE');
    });

    test('should validate entire form', () => {
      const formData = {
        customerName: '田中太郎',
        phoneticName: 'タナカタロウ',
        email: 'tanaka@example.com',
        amount: '50000',
      };

      const result = validator.validateForm(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return validation errors for invalid form', () => {
      const formData = {
        customerName: '', // 必須エラー
        phoneticName: 'tanaka', // パターンエラー
        email: 'invalid-email', // パターンエラー
        amount: '999999999', // 最大値エラー
      };

      const result = validator.validateForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);

      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('REQUIRED');
      expect(errorCodes).toContain('PATTERN');
      expect(errorCodes).toContain('MAX_VALUE');
    });
  });

  describe('ValidationPatterns', () => {
    test('should validate Japanese characters', () => {
      expect(ValidationPatterns.JAPANESE.test('田中太郎')).toBe(true);
      expect(ValidationPatterns.JAPANESE.test('たなかたろう')).toBe(true);
      expect(ValidationPatterns.JAPANESE.test('タナカタロウ')).toBe(true);
      expect(ValidationPatterns.JAPANESE.test('tanaka')).toBe(false);
    });

    test('should validate katakana only', () => {
      expect(ValidationPatterns.KATAKANA.test('タナカタロウ')).toBe(true);
      expect(ValidationPatterns.KATAKANA.test('たなかたろう')).toBe(false);
      expect(ValidationPatterns.KATAKANA.test('田中太郎')).toBe(false);
    });

    test('should validate email format', () => {
      expect(ValidationPatterns.EMAIL.test('test@example.com')).toBe(true);
      expect(ValidationPatterns.EMAIL.test('user.name+tag@domain.co.jp')).toBe(
        true
      );
      expect(ValidationPatterns.EMAIL.test('invalid-email')).toBe(false);
      expect(ValidationPatterns.EMAIL.test('@domain.com')).toBe(false);
    });

    test('should validate phone number format', () => {
      expect(ValidationPatterns.PHONE.test('03-1234-5678')).toBe(true);
      expect(ValidationPatterns.PHONE.test('0312345678')).toBe(true);
      expect(ValidationPatterns.PHONE.test('090-1234-5678')).toBe(true);
      expect(ValidationPatterns.PHONE.test('1234-5678')).toBe(false);
    });

    test('should validate postal code format', () => {
      expect(ValidationPatterns.POSTAL_CODE.test('123-4567')).toBe(true);
      expect(ValidationPatterns.POSTAL_CODE.test('1234567')).toBe(true);
      expect(ValidationPatterns.POSTAL_CODE.test('12-3456')).toBe(false);
    });

    test('should validate account number format', () => {
      expect(ValidationPatterns.ACCOUNT_NUMBER.test('1234567')).toBe(true);
      expect(ValidationPatterns.ACCOUNT_NUMBER.test('123456')).toBe(false);
      expect(ValidationPatterns.ACCOUNT_NUMBER.test('12345678')).toBe(false);
    });

    test('should validate customer number format', () => {
      expect(ValidationPatterns.CUSTOMER_NUMBER.test('12345678')).toBe(true);
      expect(ValidationPatterns.CUSTOMER_NUMBER.test('1234567')).toBe(false);
      expect(ValidationPatterns.CUSTOMER_NUMBER.test('123456789')).toBe(false);
    });
  });
});

describe('Message Consistency Requirements', () => {
  test('should provide consistent error message patterns', () => {
    // 要件 9.4: 一貫したメッセージングパターン
    const requiredError = createMessage.error('この項目は必須です。');
    const formatError = createMessage.error('入力形式が正しくありません。');
    const rangeError = createMessage.error('値が範囲外です。');

    // すべてのエラーメッセージが同じ構造を持つことを確認
    [requiredError, formatError, rangeError].forEach(message => {
      expect(message.type).toBe(MessageType.ERROR);
      expect(message.severity).toBe(MessageSeverity.HIGH);
      expect(message.autoHide).toBe(false);
      expect(typeof message.message).toBe('string');
    });
  });

  test('should provide appropriate success message feedback', () => {
    // 要件 9.2: 成功メッセージ表示
    const successMessage = createMessage.success('操作が正常に完了しました。');

    expect(successMessage.type).toBe(MessageType.SUCCESS);
    expect(successMessage.autoHide).toBe(true);
    expect(successMessage.autoHideDuration).toBe(4000);
    expect(successMessage.message).toContain('完了');
  });

  test('should provide specific error messages with guidance', () => {
    // 要件 9.3: 具体的なエラーメッセージとガイダンス
    const businessError = createMessage.businessRuleError(
      '残高が不足しています。',
      '入金を行うか、金額を調整してください。'
    );

    expect(businessError.type).toBe(MessageType.ERROR);
    expect(businessError.message).toBe('残高が不足しています。');
    expect(businessError.guidance).toBe(
      '入金を行うか、金額を調整してください。'
    );
    expect(businessError.title).toBe('ビジネスルール違反');
  });

  test('should provide real-time validation feedback', () => {
    // 要件 8.5: リアルタイム検証フィードバック
    const validator = new FormValidator({
      testField: { required: true, minLength: 3 },
    });

    // 空の値での検証
    const emptyResult = validator.validateField('testField', '');
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.error).toBe('この項目は必須です。');

    // 短すぎる値での検証
    const shortResult = validator.validateField('testField', 'ab');
    expect(shortResult.isValid).toBe(false);
    expect(shortResult.error).toBe('3文字以上で入力してください。');

    // 有効な値での検証
    const validResult = validator.validateField('testField', 'abc');
    expect(validResult.isValid).toBe(true);
    expect(validResult.error).toBeUndefined();
  });
});
