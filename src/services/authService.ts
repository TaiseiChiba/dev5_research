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
} from '../types/index.js';
import {
  getStorageObject,
  setStorageObject,
  removeStorageData,
  generateId,
  reviveDates,
} from './storageService.js';

/**
 * API呼び出しをシミュレートする遅延
 */
const API_DELAY = 300;

/**
 * セッション有効期限（8時間）
 */
const SESSION_DURATION = 8 * 60 * 60 * 1000;

/**
 * API Base URL (from Vite env).
 * Accepts either a root (http://host:port) or a path that already includes /api.
 */
const RAW_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function buildApiUrl(path: string) {
  // normalize base (no trailing slash)
  const base = RAW_API_BASE.replace(/\/$/, '');
  // ensure we have /api prefix
  const withApi = base.endsWith('/api') ? base : `${base}/api`;
  return `${withApi}/${path.replace(/^\//, '')}`;
}

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
      const requestUrl = buildApiUrl('/auth/login');
      console.debug('Login API request URL:', requestUrl, 'payload:', {
        userId: request.userId,
      });

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: request.userId,
          password: request.password,
        }),
      });

      // log raw response for debugging (read as text first)
      const rawText = await response.text();
      console.debug('Login API response status:', response.status, 'body:', rawText);
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (e) {
        console.error('Failed to parse login API response as JSON:', e);
      }

      if (!response.ok || !data.success) {
        return {
          success: false,
          errorMessage: data.message || 'ログインに失敗しました。',
        };
      }

      // セッション作成
      const sessionId = generateId('SESSION_');
      const session: UserSession = {
        sessionId,
        userId: data.user.userId,
        userRole: data.user.userRole,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_DURATION),
        isActive: true,
      };

      setStorageObject('currentSession', session);

      return {
        success: true,
        sessionId,
        userRole: data.user.userRole,
      };
    } catch (error) {
      console.error('Login error:', error);
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

    try {
      // APIサーバーにログアウト通知
      const logoutUrl = buildApiUrl('/auth/logout');
      console.debug('Logout API request URL:', logoutUrl);
      await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // APIエラーでもローカルセッションは削除
    }

    // ローカルセッション削除
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
      console.error('Switch user error:', error);
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
