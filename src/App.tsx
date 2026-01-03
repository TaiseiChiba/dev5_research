/**
 * メインアプリケーションコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/common/AppRouter.js';
import {
  MessageProvider,
  useNotification,
} from './components/shared/MessageContext.js';
import { NavigationProvider } from './contexts/NavigationContext.js';
import { ServiceFactory } from './services/common/serviceFactory.js';
import { UserSession } from './types/auth.js';

const AppContent: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<UserSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const notification = useNotification();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // サービス層の初期化
      const serviceFactory = ServiceFactory.getInstance();
      await serviceFactory.initialize();

      // 認証状態をチェック
      const authService = serviceFactory.getAuthService();
      const session = authService.getCurrentSession();

      if (session && session.expiresAt > new Date()) {
        setCurrentSession(session);
      } else {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('アプリケーション初期化エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    setCurrentSession(session);

    // ログイン成功通知を表示
    const roleText =
      session.userRole === 'ADMINISTRATOR' ? '管理者' : '一般行員';
    notification.success(
      `ログインが完了しました。利用者: ${session.userId} (${roleText})`
    );
  };

  const handleLogout = () => {
    setCurrentSession(null);
  };

  const handleUserSwitch = (session: UserSession) => {
    setCurrentSession(session);

    // 利用者切替成功通知を表示
    const roleText =
      session.userRole === 'ADMINISTRATOR' ? '管理者' : '一般行員';
    notification.success(
      `利用者を切り替えました。利用者: ${session.userId} (${roleText})`
    );
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <NavigationProvider>
        <AppRouter
          session={currentSession}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onUserSwitch={handleUserSwitch}
        />
      </NavigationProvider>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <MessageProvider>
      <AppContent />
    </MessageProvider>
  );
};

export default App;
