/**
 * 認証サービス
 *
 * ユーザー認証とセッション管理を提供します。
 */

import {
  AuthResult,
  LoginRequest,
  SwitchUserRequest,
  UserSession,
  User,
} from '../types/index.js';
import {
  getStorageData,
  getStorageObject,
  setStorageObject,
  removeStorageData,
  generateId,
  reviveDatesInArray,
  reviveDates,
} from './storageService.js';

/**
 * API呼び出しをシミュレートする遅延
 */
const API_DELAY = 500;

/**
 * セッション有効期限（8時間）
 */
const SESSION_DURATION = 8 * 60 * 60 * 1000;

/**
 * 認証サービスクラス
 */
export class AuthService {
  /**
   * ユーザーログイン
   */
  async login(request: LoginRequest): Promise<AuthResult> {
    await this.simulateApiDelay();

    try {
      const users = reviveDatesInArray(getStorageData<User>('mockUsers'));
      const passwords =
        getStorageObject<Record<string, string>>('mockPasswords') || {};

      const user = users.find(u => u.userId === request.userId && u.isActive);

      if (!user || passwords[request.userId] !== request.password) {
        return {
          success: false,
          errorMessage: 'ユーザーIDまたはパスワードが正しくありません。',
        };
      }

      // セッション作成
      const sessionId = generateId('SESSION_');
      const session: UserSession = {
        sessionId,
        userId: user.userId,
        userRole: user.userRole,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_DURATION),
        isActive: true,
      };

      setStorageObject('currentSession', session);

      return {
        success: true,
        sessionId,
        userRole: user.userRole,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: 'ログイン処理中にエラーが発生しました。',
      };
    }
  }

  /**
   * ユーザーログアウト
   */
  async logout(sessionId: string): Promise<void> {
    await this.simulateApiDelay();

    const currentSession = getStorageObject<UserSession>('currentSession');
    if (currentSession && currentSession.sessionId === sessionId) {
      removeStorageData('currentSession');
    }
  }

  /**
   * ユーザー切替
   */
  async switchUser(request: SwitchUserRequest): Promise<AuthResult> {
    await this.simulateApiDelay();

    try {
      // 現在のセッションを確認
      const currentSession = getStorageObject<UserSession>('currentSession');
      if (
        !currentSession ||
        currentSession.sessionId !== request.currentSessionId
      ) {
        return {
          success: false,
          errorMessage: '無効なセッションです。',
        };
      }

      // 新しいユーザーでログイン
      const loginResult = await this.login({
        userId: request.newUserId,
        password: request.password,
      });

      return loginResult;
    } catch (error) {
      return {
        success: false,
        errorMessage: 'ユーザー切替処理中にエラーが発生しました。',
      };
    }
  }

  /**
   * セッション検証
   */
  async validateSession(sessionId: string): Promise<UserSession | null> {
    await this.simulateApiDelay();

    try {
      const session = getStorageObject<UserSession>('currentSession');

      if (!session || session.sessionId !== sessionId) {
        return null;
      }

      const sessionWithDates = reviveDates(session);

      // セッション期限チェック
      if (sessionWithDates.expiresAt < new Date()) {
        removeStorageData('currentSession');
        return null;
      }

      return sessionWithDates;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * 現在のセッション取得
   */
  getCurrentSession(): UserSession | null {
    try {
      const session = getStorageObject<UserSession>('currentSession');
      return session ? reviveDates(session) : null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * API遅延をシミュレート
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, API_DELAY));
  }
}
