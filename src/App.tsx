/**
 * メインアプリケーションコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import AppRouter from './components/common/AppRouter.js';
import { ServiceFactory } from './services/common/serviceFactory.js';
import { UserSession } from './types/auth.js';

const App: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<UserSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

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
  };

  const handleLogout = () => {
    setCurrentSession(null);
  };

  const handleUserSwitch = (session: UserSession) => {
    setCurrentSession(session);
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
    <AppRouter
      session={currentSession}
      onLoginSuccess={handleLoginSuccess}
      onLogout={handleLogout}
      onUserSwitch={handleUserSwitch}
    />
  );
};

export default App;
