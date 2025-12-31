/**
 * 認証ガードコンポーネント
 *
 * 認証が必要なルートへのアクセスを制御します。
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types/auth.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { PATHS } from '../constants/paths.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  redirectTo = PATHS.LOGIN,
}) => {
  const location = useLocation();
  const authService = ServiceFactory.getInstance().getAuthService();
  const session = authService.getCurrentSession();

  // 認証チェック
  if (!session || !session.isActive) {
    // 現在のパスを保存してログイン後にリダイレクト
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // セッション期限チェック
  if (session.expiresAt < new Date()) {
    // セッション期限切れの場合はログアウト処理
    authService.logout(session.sessionId);
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname, expired: true }}
        replace
      />
    );
  }

  // 管理者権限チェック
  if (adminOnly && session.userRole !== UserRole.ADMINISTRATOR) {
    return <Navigate to={PATHS.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
