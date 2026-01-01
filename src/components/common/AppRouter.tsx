/**
 * アプリケーションルーター
 *
 * React Router DOMを使用したルーティング設定
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute.js';
import AppLayout from '../account/AppLayout.js';
import LoginScreen from '../auth/LoginScreen.js';
import Dashboard from '../workflow/Dashboard.js';
import CustomerManagement from '../customer/CustomerManagement.js';
import CustomerDetail from '../customer/CustomerDetail.js';
import CustomerEdit from '../customer/CustomerEdit.js';
import CustomerCreate from '../customer/CustomerCreate.js';
import AccountList from '../account/AccountList.js';
import AccountDetail from '../account/AccountDetail.js';
import AccountEdit from '../account/AccountEdit.js';
import AccountCreate from '../account/AccountCreate.js';
import { NotFoundError, UnauthorizedError, ServerError } from './ErrorPages.js';
import { UserSession } from '../../types/auth.js';
import { PATHS } from '../../constants/paths.js';

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
          <Route path="customers">
            <Route index element={<Navigate to="/customers/list" replace />} />
            <Route path="list" element={<CustomerManagement />} />
            <Route path="create" element={<CustomerCreate />} />
            <Route path=":customerId" element={<CustomerDetail />} />
            <Route path=":customerId/edit" element={<CustomerEdit />} />
          </Route>

          {/* 口座管理 */}
          <Route path="accounts">
            <Route index element={<Navigate to="/accounts/list" replace />} />
            <Route path="list" element={<AccountList />} />
            <Route path="create" element={<AccountCreate />} />
            <Route path=":accountId" element={<AccountDetail />} />
            <Route path=":accountId/edit" element={<AccountEdit />} />
            {/* 他の口座管理ルートは後で実装 */}
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
