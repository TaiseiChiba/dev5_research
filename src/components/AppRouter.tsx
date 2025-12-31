/**
 * アプリケーションルーター
 *
 * React Router DOMを使用したルーティング設定
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.js';
import AppLayout from './AppLayout.js';
import LoginScreen from './LoginScreen.js';
import Dashboard from './Dashboard.js';
import CustomerManagement from './CustomerManagement.js';
import { NotFoundError, UnauthorizedError, ServerError } from './ErrorPages.js';
import { UserSession } from '../types/auth.js';
import { PATHS } from '../constants/paths.js';

interface AppRouterProps {
  session: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  onUserSwitch: (session: UserSession) => void;
}

const AppRouter: React.FC<AppRouterProps> = ({
  session,
  onLoginSuccess,
  onLogout,
  onUserSwitch,
}) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* パブリックルート */}
        <Route
          path={PATHS.LOGIN}
          element={
            session ? (
              <Navigate to={PATHS.DASHBOARD} replace />
            ) : (
              <LoginScreen onLoginSuccess={onLoginSuccess} />
            )
          }
        />

        {/* エラーページ */}
        <Route path={PATHS.UNAUTHORIZED} element={<UnauthorizedError />} />
        <Route path={PATHS.NOT_FOUND} element={<NotFoundError />} />
        <Route path={PATHS.SERVER_ERROR} element={<ServerError />} />

        {/* 保護されたルート */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout
                session={session!}
                onLogout={onLogout}
                onUserSwitch={onUserSwitch}
              />
            </ProtectedRoute>
          }
        >
          {/* ダッシュボード */}
          <Route index element={<Dashboard session={session!} />} />

          {/* 顧客管理 */}
          <Route path={PATHS.CUSTOMERS.slice(1)}>
            <Route
              index
              element={<Navigate to={PATHS.CUSTOMER_LIST} replace />}
            />
            <Route
              path={PATHS.CUSTOMER_LIST.slice(PATHS.CUSTOMERS.length + 1)}
              element={<CustomerManagement />}
            />
          </Route>

          {/* 口座管理（実装予定） */}
          <Route path={PATHS.ACCOUNTS.slice(1)}>
            <Route index element={<div>口座管理（実装予定）</div>} />
          </Route>

          {/* 取引管理（実装予定） */}
          <Route path={PATHS.TRANSACTIONS.slice(1)}>
            <Route index element={<div>取引管理（実装予定）</div>} />
          </Route>

          {/* ワークフロー管理（実装予定） */}
          <Route path={PATHS.WORKFLOW.slice(1)}>
            <Route index element={<div>ワークフロー管理（実装予定）</div>} />
          </Route>

          {/* 設定管理（実装予定） */}
          <Route path={PATHS.SETTINGS.slice(1)}>
            <Route
              index
              element={
                <ProtectedRoute adminOnly>
                  <div>設定管理（実装予定）</div>
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        {/* 404 - 存在しないパス */}
        <Route path="*" element={<NotFoundError />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
