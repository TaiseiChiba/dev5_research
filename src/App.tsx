/**
 * メインアプリケーションコンポーネント
 */

import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import LoginScreen from './components/LoginScreen';
import MainApplication from './components/MainApplication';
import { ServiceFactory } from './services/serviceFactory';
import { UserSession } from './types/auth';

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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            金融系業務アプリケーション
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {currentSession ? (
          <MainApplication
            session={currentSession}
            onLogout={handleLogout}
            onUserSwitch={handleLoginSuccess}
          />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
      </Container>
    </Box>
  );
};

export default App;
