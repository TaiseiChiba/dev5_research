/**
 * メインアプリケーションのテスト
 */

import { initializeApp } from '../src/main';
import { initializeMockData } from '../src/data/mockData';

// DOM環境のセットアップ
beforeEach(() => {
  document.body.innerHTML = `
    <div id="app">
      <main id="main-content"></main>
    </div>
  `;

  // LocalStorageをクリア
  localStorage.clear();

  // モックデータを初期化
  initializeMockData();
});

describe('アプリケーション初期化', () => {
  test('セッションがない場合はログイン画面を表示する', async () => {
    // ServiceFactoryを初期化してからinitializeAppを呼び出す
    const serviceFactory = (
      await import('../src/services/common/serviceFactory')
    ).ServiceFactory.getInstance();
    await serviceFactory.initialize();

    // デバッグ: 初期状態を確認
    const mainContentBefore = document.getElementById('main-content');
    console.log('Before initializeApp:', mainContentBefore?.innerHTML);

    // 実行
    await initializeApp();

    // デバッグ: 実行後の状態を確認
    const mainContentAfter = document.getElementById('main-content');
    console.log('After initializeApp:', mainContentAfter?.innerHTML);

    // 検証
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeTruthy();
    expect(mainContent?.innerHTML).toContain('ログイン');
    expect(mainContent?.innerHTML).toContain('利用者ID');
    expect(mainContent?.innerHTML).toContain('パスワード');
    expect(mainContent?.innerHTML).toContain('利用者区分');
  });

  test('main-contentが存在しない場合でもエラーが発生しない', async () => {
    // セットアップ - main-contentを削除
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.remove();
    }

    // ServiceFactoryを初期化
    const serviceFactory = (
      await import('../src/services/common/serviceFactory')
    ).ServiceFactory.getInstance();
    await serviceFactory.initialize();

    // 実行と検証 - エラーが発生しないことを確認
    await expect(initializeApp()).resolves.not.toThrow();
  });
});

describe('ログイン画面', () => {
  beforeEach(async () => {
    // ServiceFactoryを初期化してからinitializeAppを呼び出す
    const serviceFactory = (
      await import('../src/services/common/serviceFactory')
    ).ServiceFactory.getInstance();
    await serviceFactory.initialize();
    await initializeApp();
  });

  test('ログインフォームが正しく表示される', () => {
    const userIdInput = document.getElementById('userId') as HTMLInputElement;
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;
    const userRoleSelect = document.getElementById(
      'userRole'
    ) as HTMLSelectElement;
    const loginButton = document.getElementById(
      'login-button'
    ) as HTMLButtonElement;

    expect(userIdInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(userRoleSelect).toBeTruthy();
    expect(loginButton).toBeTruthy();

    expect(userIdInput.type).toBe('text');
    expect(passwordInput.type).toBe('password');
    expect(loginButton.type).toBe('submit');
  });

  test('必須フィールドが空の場合はエラーメッセージを表示する', () => {
    const userIdInput = document.getElementById('userId') as HTMLInputElement;
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;
    const userRoleSelect = document.getElementById(
      'userRole'
    ) as HTMLSelectElement;

    // 空の値でバリデーションをトリガー
    userIdInput.value = '';
    userIdInput.dispatchEvent(new Event('input'));

    passwordInput.value = '';
    passwordInput.dispatchEvent(new Event('input'));

    userRoleSelect.value = '';
    userRoleSelect.dispatchEvent(new Event('change'));

    // エラーメッセージの確認
    const userIdError = document.getElementById('userId-error');
    const passwordError = document.getElementById('password-error');
    const userRoleError = document.getElementById('userRole-error');

    expect(userIdError?.textContent).toContain('必須');
    expect(passwordError?.textContent).toContain('必須');
    expect(userRoleError?.textContent).toContain('選択');
  });

  test('無効な形式の入力でエラーメッセージを表示する', () => {
    const userIdInput = document.getElementById('userId') as HTMLInputElement;
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;

    // 短すぎる利用者ID
    userIdInput.value = 'ab';
    userIdInput.dispatchEvent(new Event('input'));

    // 短すぎるパスワード
    passwordInput.value = '123';
    passwordInput.dispatchEvent(new Event('input'));

    // エラーメッセージの確認
    const userIdError = document.getElementById('userId-error');
    const passwordError = document.getElementById('password-error');

    expect(userIdError?.textContent).toContain('3文字以上');
    expect(passwordError?.textContent).toContain('6文字以上');
  });

  test('有効な入力でエラーメッセージが消える', () => {
    const userIdInput = document.getElementById('userId') as HTMLInputElement;
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;
    const userRoleSelect = document.getElementById(
      'userRole'
    ) as HTMLSelectElement;

    // 有効な値を入力
    userIdInput.value = 'staff001';
    userIdInput.dispatchEvent(new Event('input'));

    passwordInput.value = 'password123';
    passwordInput.dispatchEvent(new Event('input'));

    userRoleSelect.value = 'general_staff';
    userRoleSelect.dispatchEvent(new Event('change'));

    // エラーメッセージが空であることを確認
    const userIdError = document.getElementById('userId-error');
    const passwordError = document.getElementById('password-error');
    const userRoleError = document.getElementById('userRole-error');

    expect(userIdError?.textContent).toBe('');
    expect(passwordError?.textContent).toBe('');
    expect(userRoleError?.textContent).toBe('');
  });

  test('デモ用アカウント情報が表示される', () => {
    const mainContent = document.getElementById('main-content');
    expect(mainContent?.innerHTML).toContain('デモ用アカウント');
    expect(mainContent?.innerHTML).toContain('staff001');
    expect(mainContent?.innerHTML).toContain('staff002');
    expect(mainContent?.innerHTML).toContain('admin001');
    expect(mainContent?.innerHTML).toContain('password123');
    expect(mainContent?.innerHTML).toContain('admin123');
  });
});
