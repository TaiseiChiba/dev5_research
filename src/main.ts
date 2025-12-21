/**
 * 金融系業務アプリケーション - メインエントリーポイント
 */

import { ServiceFactory } from './services/serviceFactory.js';
import { UserRole, LoginRequest, SwitchUserRequest } from './types/index.js';

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('金融系業務アプリケーションが開始されました');

  try {
    // サービス層の初期化
    const serviceFactory = ServiceFactory.getInstance();
    await serviceFactory.initialize();

    // 認証状態をチェックして適切な画面を表示
    await initializeApp();
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
    showErrorMessage(
      'システムの初期化に失敗しました。ページを再読み込みしてください。'
    );
  }
});

/**
 * アプリケーションの初期化処理
 */
async function initializeApp(): Promise<void> {
  console.log('initializeApp called');
  const serviceFactory = ServiceFactory.getInstance();
  const authService = serviceFactory.getAuthService();

  // 現在のセッションをチェック
  const currentSession = authService.getCurrentSession();
  console.log('Current session:', currentSession);

  if (currentSession && currentSession.expiresAt > new Date()) {
    console.log('Valid session found, showing main application');
    // 有効なセッションがある場合はメイン画面を表示
    showMainApplication(currentSession.userRole);
  } else {
    console.log('No valid session, showing login screen');
    // セッションがない場合はログイン画面を表示
    showLoginScreen();
  }
}

/**
 * ログイン画面の表示
 */
function showLoginScreen(): void {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="login-container">
      <div class="login-form">
        <h2>ログイン</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="userId">利用者ID</label>
            <input 
              type="text" 
              id="userId" 
              name="userId" 
              required 
              autocomplete="username"
              placeholder="利用者IDを入力してください"
            />
            <div class="error-message" id="userId-error"></div>
          </div>
          
          <div class="form-group">
            <label for="password">パスワード</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              autocomplete="current-password"
              placeholder="パスワードを入力してください"
            />
            <div class="error-message" id="password-error"></div>
          </div>
          
          <div class="form-group">
            <label for="userRole">利用者区分</label>
            <select id="userRole" name="userRole" required>
              <option value="">選択してください</option>
              <option value="${UserRole.GENERAL_STAFF}">一般行員</option>
              <option value="${UserRole.ADMINISTRATOR}">管理者</option>
            </select>
            <div class="error-message" id="userRole-error"></div>
          </div>
          
          <div class="form-actions">
            <button type="submit" id="login-button" class="primary-button">
              ログイン
            </button>
          </div>
          
          <div class="general-error" id="general-error"></div>
        </form>
        
        <div class="demo-info">
          <h3>デモ用アカウント</h3>
          <p>テスト用ユーザー:</p>
          <ul>
            <li>一般行員: staff001, staff002 (パスワード: password123)</li>
            <li>管理者: admin001 (パスワード: admin123)</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // ログインフォームのイベントリスナーを設定
  setupLoginForm();
}

/**
 * ログインフォームのイベントリスナー設定
 */
function setupLoginForm(): void {
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const userIdInput = document.getElementById('userId') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const userRoleSelect = document.getElementById(
    'userRole'
  ) as HTMLSelectElement;
  const loginButton = document.getElementById(
    'login-button'
  ) as HTMLButtonElement;

  if (
    !loginForm ||
    !userIdInput ||
    !passwordInput ||
    !userRoleSelect ||
    !loginButton
  ) {
    console.error('ログインフォームの要素が見つかりません');
    return;
  }

  // リアルタイム入力検証
  userIdInput.addEventListener('input', () => validateField('userId'));
  passwordInput.addEventListener('input', () => validateField('password'));
  userRoleSelect.addEventListener('change', () => validateField('userRole'));

  // フォーム送信処理
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    await handleLogin();
  });
}

/**
 * フィールド検証
 */
function validateField(fieldName: string): boolean {
  const field = document.getElementById(fieldName) as
    | HTMLInputElement
    | HTMLSelectElement;
  const errorElement = document.getElementById(`${fieldName}-error`);

  if (!field || !errorElement) return false;

  let isValid = true;
  let errorMessage = '';

  switch (fieldName) {
    case 'userId':
      if (!field.value.trim()) {
        isValid = false;
        errorMessage = '利用者IDは必須です。';
      } else if (field.value.trim().length < 3) {
        isValid = false;
        errorMessage = '利用者IDは3文字以上で入力してください。';
      }
      break;

    case 'password':
      if (!field.value) {
        isValid = false;
        errorMessage = 'パスワードは必須です。';
      } else if (field.value.length < 6) {
        isValid = false;
        errorMessage = 'パスワードは6文字以上で入力してください。';
      }
      break;

    case 'userRole':
      if (!field.value) {
        isValid = false;
        errorMessage = '利用者区分を選択してください。';
      }
      break;
  }

  // エラーメッセージの表示/非表示
  if (isValid) {
    errorElement.textContent = '';
    field.classList.remove('error');
  } else {
    errorElement.textContent = errorMessage;
    field.classList.add('error');
  }

  return isValid;
}

/**
 * フォーム全体の検証
 */
function validateForm(): boolean {
  const userIdValid = validateField('userId');
  const passwordValid = validateField('password');
  const userRoleValid = validateField('userRole');

  return userIdValid && passwordValid && userRoleValid;
}

/**
 * ログイン処理
 */
async function handleLogin(): Promise<void> {
  // 一般エラーメッセージをクリア
  const generalError = document.getElementById('general-error');
  if (generalError) {
    generalError.textContent = '';
  }

  // フォーム検証
  if (!validateForm()) {
    return;
  }

  const userIdInput = document.getElementById('userId') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const userRoleSelect = document.getElementById(
    'userRole'
  ) as HTMLSelectElement;
  const loginButton = document.getElementById(
    'login-button'
  ) as HTMLButtonElement;

  // ローディング状態に設定
  loginButton.disabled = true;
  loginButton.textContent = 'ログイン中...';

  try {
    const serviceFactory = ServiceFactory.getInstance();
    const authService = serviceFactory.getAuthService();

    const loginRequest: LoginRequest = {
      userId: userIdInput.value.trim(),
      password: passwordInput.value,
    };

    const result = await authService.login(loginRequest);

    if (result.success && result.userRole) {
      // 利用者区分の検証
      if (result.userRole !== userRoleSelect.value) {
        showGeneralError('選択された利用者区分が正しくありません。');
        return;
      }

      // ログイン成功 - メイン画面に遷移
      showMainApplication(result.userRole);
    } else {
      // ログイン失敗
      showGeneralError(result.errorMessage || 'ログインに失敗しました。');
    }
  } catch (error) {
    console.error('ログインエラー:', error);
    showGeneralError('ログイン処理中にエラーが発生しました。');
  } finally {
    // ローディング状態を解除
    loginButton.disabled = false;
    loginButton.textContent = 'ログイン';
  }
}

/**
 * 一般エラーメッセージの表示
 */
function showGeneralError(message: string): void {
  const generalError = document.getElementById('general-error');
  if (generalError) {
    generalError.textContent = message;
  }
}

/**
 * メインアプリケーション画面の表示
 */
function showMainApplication(userRole: UserRole): void {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const serviceFactory = ServiceFactory.getInstance();
  const authService = serviceFactory.getAuthService();
  const currentSession = authService.getCurrentSession();
  const roleText = userRole === UserRole.ADMINISTRATOR ? '管理者' : '一般行員';
  const currentUserId = currentSession?.userId || '';

  mainContent.innerHTML = `
    <div class="main-application">
      <div class="user-info">
        <div class="user-details">
          <p>ログイン中: ${roleText} (${currentUserId})</p>
        </div>
        <div class="user-actions">
          <button id="switch-user-button" class="secondary-button">利用者切替</button>
          <button id="logout-button" class="secondary-button">ログアウト</button>
        </div>
      </div>
      
      <div class="welcome-message">
        <h2>金融系業務アプリケーションへようこそ</h2>
        <p>ログインが完了しました。</p>
        <p>利用者区分: ${roleText}</p>
        <p>利用者ID: ${currentUserId}</p>
        <p>サンプル顧客、口座、取引データが利用可能です。</p>
      </div>
    </div>

    <!-- 利用者切替モーダル -->
    <div id="switch-user-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>利用者切替</h3>
          <button id="close-modal" class="close-button">&times;</button>
        </div>
        <form id="switch-user-form">
          <div class="form-group">
            <label for="new-userId">新しい利用者ID</label>
            <input 
              type="text" 
              id="new-userId" 
              name="newUserId" 
              required 
              autocomplete="username"
              placeholder="新しい利用者IDを入力してください"
            />
            <div class="error-message" id="new-userId-error"></div>
          </div>
          
          <div class="form-group">
            <label for="new-password">パスワード</label>
            <input 
              type="password" 
              id="new-password" 
              name="newPassword" 
              required 
              autocomplete="current-password"
              placeholder="パスワードを入力してください"
            />
            <div class="error-message" id="new-password-error"></div>
          </div>
          
          <div class="form-actions">
            <button type="button" id="cancel-switch" class="secondary-button">
              キャンセル
            </button>
            <button type="submit" id="confirm-switch" class="primary-button">
              切替実行
            </button>
          </div>
          
          <div class="general-error" id="switch-general-error"></div>
        </form>
      </div>
    </div>
  `;

  // イベントリスナー設定
  setupMainApplicationEvents();
}

/**
 * メインアプリケーションのイベントリスナー設定
 */
function setupMainApplicationEvents(): void {
  // ログアウトボタン
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  // 利用者切替ボタン
  const switchUserButton = document.getElementById('switch-user-button');
  if (switchUserButton) {
    switchUserButton.addEventListener('click', showSwitchUserModal);
  }

  // モーダル関連
  const closeModal = document.getElementById('close-modal');
  const cancelSwitch = document.getElementById('cancel-switch');
  const modal = document.getElementById('switch-user-modal');

  if (closeModal) {
    closeModal.addEventListener('click', hideSwitchUserModal);
  }

  if (cancelSwitch) {
    cancelSwitch.addEventListener('click', hideSwitchUserModal);
  }

  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        hideSwitchUserModal();
      }
    });
  }

  // 利用者切替フォーム
  const switchUserForm = document.getElementById(
    'switch-user-form'
  ) as HTMLFormElement;
  if (switchUserForm) {
    switchUserForm.addEventListener('submit', handleSwitchUser);

    // リアルタイム検証
    const newUserIdInput = document.getElementById(
      'new-userId'
    ) as HTMLInputElement;
    const newPasswordInput = document.getElementById(
      'new-password'
    ) as HTMLInputElement;

    if (newUserIdInput) {
      newUserIdInput.addEventListener('input', () =>
        validateSwitchField('new-userId')
      );
    }

    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', () =>
        validateSwitchField('new-password')
      );
    }
  }
}

/**
 * 利用者切替モーダルの表示
 */
function showSwitchUserModal(): void {
  const modal = document.getElementById('switch-user-modal');
  if (modal) {
    modal.style.display = 'flex';

    // フォームをリセット
    const form = document.getElementById('switch-user-form') as HTMLFormElement;
    if (form) {
      form.reset();
      clearSwitchErrors();
    }

    // 最初の入力フィールドにフォーカス
    const firstInput = document.getElementById(
      'new-userId'
    ) as HTMLInputElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

/**
 * 利用者切替モーダルの非表示
 */
function hideSwitchUserModal(): void {
  const modal = document.getElementById('switch-user-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * 利用者切替フィールドの検証
 */
function validateSwitchField(fieldName: string): boolean {
  const field = document.getElementById(fieldName) as HTMLInputElement;
  const errorElement = document.getElementById(`${fieldName}-error`);

  if (!field || !errorElement) return false;

  let isValid = true;
  let errorMessage = '';

  switch (fieldName) {
    case 'new-userId':
      if (!field.value.trim()) {
        isValid = false;
        errorMessage = '利用者IDは必須です。';
      } else if (field.value.trim().length < 3) {
        isValid = false;
        errorMessage = '利用者IDは3文字以上で入力してください。';
      }
      break;

    case 'new-password':
      if (!field.value) {
        isValid = false;
        errorMessage = 'パスワードは必須です。';
      } else if (field.value.length < 6) {
        isValid = false;
        errorMessage = 'パスワードは6文字以上で入力してください。';
      }
      break;
  }

  // エラーメッセージの表示/非表示
  if (isValid) {
    errorElement.textContent = '';
    field.classList.remove('error');
  } else {
    errorElement.textContent = errorMessage;
    field.classList.add('error');
  }

  return isValid;
}

/**
 * 利用者切替フォームの検証
 */
function validateSwitchForm(): boolean {
  const userIdValid = validateSwitchField('new-userId');
  const passwordValid = validateSwitchField('new-password');

  return userIdValid && passwordValid;
}

/**
 * 利用者切替エラーのクリア
 */
function clearSwitchErrors(): void {
  const errorElements = [
    'new-userId-error',
    'new-password-error',
    'switch-general-error',
  ];
  errorElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = '';
    }
  });

  const inputElements = ['new-userId', 'new-password'];
  inputElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove('error');
    }
  });
}

/**
 * 利用者切替処理
 */
async function handleSwitchUser(event: Event): Promise<void> {
  event.preventDefault();

  // エラーメッセージをクリア
  const switchGeneralError = document.getElementById('switch-general-error');
  if (switchGeneralError) {
    switchGeneralError.textContent = '';
  }

  // フォーム検証
  if (!validateSwitchForm()) {
    return;
  }

  const newUserIdInput = document.getElementById(
    'new-userId'
  ) as HTMLInputElement;
  const newPasswordInput = document.getElementById(
    'new-password'
  ) as HTMLInputElement;
  const confirmButton = document.getElementById(
    'confirm-switch'
  ) as HTMLButtonElement;

  if (!newUserIdInput || !newPasswordInput || !confirmButton) {
    return;
  }

  // ローディング状態に設定
  confirmButton.disabled = true;
  confirmButton.textContent = '切替中...';

  try {
    const serviceFactory = ServiceFactory.getInstance();
    const authService = serviceFactory.getAuthService();
    const currentSession = authService.getCurrentSession();

    if (!currentSession) {
      showSwitchError('現在のセッションが無効です。再ログインしてください。');
      return;
    }

    const switchRequest: SwitchUserRequest = {
      currentSessionId: currentSession.sessionId,
      newUserId: newUserIdInput.value.trim(),
      password: newPasswordInput.value,
    };

    const result = await authService.switchUser(switchRequest);

    if (result.success && result.userRole) {
      // 利用者切替成功 - モーダルを閉じてメイン画面を更新
      hideSwitchUserModal();
      showMainApplication(result.userRole);
    } else {
      // 利用者切替失敗
      showSwitchError(result.errorMessage || '利用者切替に失敗しました。');
    }
  } catch (error) {
    console.error('利用者切替エラー:', error);
    showSwitchError('利用者切替処理中にエラーが発生しました。');
  } finally {
    // ローディング状態を解除
    confirmButton.disabled = false;
    confirmButton.textContent = '切替実行';
  }
}

/**
 * 利用者切替エラーメッセージの表示
 */
function showSwitchError(message: string): void {
  const switchGeneralError = document.getElementById('switch-general-error');
  if (switchGeneralError) {
    switchGeneralError.textContent = message;
  }
}

/**
 * ログアウト処理
 */
async function handleLogout(): Promise<void> {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const authService = serviceFactory.getAuthService();
    const currentSession = authService.getCurrentSession();

    if (currentSession) {
      await authService.logout(currentSession.sessionId);
    }

    // ログイン画面に戻る
    showLoginScreen();
  } catch (error) {
    console.error('ログアウトエラー:', error);
    showErrorMessage('ログアウト処理中にエラーが発生しました。');
  }
}

/**
 * エラーメッセージ表示
 */
function showErrorMessage(message: string): void {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="error-container">
        <h2>エラー</h2>
        <p>${message}</p>
        <button onclick="location.reload()" class="primary-button">
          ページを再読み込み
        </button>
      </div>
    `;
  }
}

// エクスポート（テスト用）
export { initializeApp, ServiceFactory };
