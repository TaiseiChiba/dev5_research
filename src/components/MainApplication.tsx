/**
 * MUIメインアプリケーションコンポーネント
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  LogoutOutlined,
  SwitchAccountOutlined,
  PersonOutline,
  AdminPanelSettings,
  AccountBalanceOutlined,
  PeopleOutline,
  ReceiptLongOutlined,
  HistoryOutlined,
  SecurityOutlined,
} from '@mui/icons-material';
import UserSwitchModal from './UserSwitchModal';
import CustomerManagement from './CustomerManagement';
import { UserSession, UserRole } from '../types/auth';
import { ServiceFactory } from '../services/serviceFactory';

interface MainApplicationProps {
  session: UserSession;
  onLogout: () => void;
  onUserSwitch: (session: UserSession) => void;
}

const MainApplication: React.FC<MainApplicationProps> = ({
  session,
  onLogout,
  onUserSwitch,
}) => {
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'customers'>(
    'dashboard'
  );

  const handleLogout = async () => {
    try {
      const serviceFactory = ServiceFactory.getInstance();
      const authService = serviceFactory.getAuthService();
      await authService.logout(session.sessionId);
      onLogout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleUserSwitchSuccess = (newSession: UserSession) => {
    setSwitchModalOpen(false);
    onUserSwitch(newSession);
  };

  const roleText =
    session.userRole === UserRole.ADMINISTRATOR ? '管理者' : '一般行員';
  const RoleIcon =
    session.userRole === UserRole.ADMINISTRATOR
      ? AdminPanelSettings
      : PersonOutline;

  const features = [
    {
      icon: <SecurityOutlined />,
      title: 'ユーザー認証・セッション管理',
      description: '安全なログインとセッション管理機能',
      action: null,
    },
    {
      icon: <PeopleOutline />,
      title: '顧客情報管理',
      description: '顧客の登録、更新、検索機能',
      action: () => setCurrentView('customers'),
    },
    {
      icon: <AccountBalanceOutlined />,
      title: '口座管理',
      description: '口座の開設、管理、残高照会機能',
      action: null,
    },
    {
      icon: <ReceiptLongOutlined />,
      title: '取引処理ワークフロー',
      description: '多段階承認による取引処理システム',
      action: null,
    },
    {
      icon: <HistoryOutlined />,
      title: '取引履歴照会',
      description: '過去の取引履歴の検索と表示機能',
      action: null,
    },
  ];

  return (
    <Box>
      {currentView === 'dashboard' ? (
        <>
          {/* ユーザー情報カード */}
          <Card elevation={2} sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <RoleIcon color="primary" />
                    <Box>
                      <Typography variant="h6">
                        ログイン中: {roleText}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        利用者ID: {session.userId}
                      </Typography>
                    </Box>
                    <Chip
                      label={roleText}
                      color={
                        session.userRole === UserRole.ADMINISTRATOR
                          ? 'secondary'
                          : 'primary'
                      }
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box
                    display="flex"
                    gap={1}
                    justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<SwitchAccountOutlined />}
                      onClick={() => setSwitchModalOpen(true)}
                    >
                      利用者切替
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<LogoutOutlined />}
                      onClick={handleLogout}
                      color="error"
                    >
                      ログアウト
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ウェルカムメッセージ */}
          <Card elevation={3} sx={{ mb: 4 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h4" gutterBottom color="primary">
                金融系業務アプリケーションへようこそ
              </Typography>
              <Typography variant="h6" gutterBottom>
                ログインが完了しました
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                利用者区分: {roleText}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                利用者ID: {session.userId}
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" color="text.secondary">
                サンプル顧客、口座、取引データが利用可能です。
              </Typography>
            </CardContent>
          </Card>

          {/* 利用可能な機能 */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              利用可能な機能
            </Typography>
            <List>
              {features.map((feature, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    onClick={feature.action || undefined}
                    sx={{
                      cursor: feature.action ? 'pointer' : 'default',
                      '&:hover': feature.action
                        ? { backgroundColor: 'action.hover' }
                        : {},
                    }}
                  >
                    <ListItemIcon>{feature.icon}</ListItemIcon>
                    <ListItemText
                      primary={feature.title}
                      secondary={feature.description}
                    />
                  </ListItem>
                  {index < features.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      ) : currentView === 'customers' ? (
        <>
          {/* ナビゲーションヘッダー */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Button
              variant="outlined"
              onClick={() => setCurrentView('dashboard')}
            >
              ← ダッシュボードに戻る
            </Button>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<SwitchAccountOutlined />}
                onClick={() => setSwitchModalOpen(true)}
              >
                利用者切替
              </Button>
              <Button
                variant="contained"
                startIcon={<LogoutOutlined />}
                onClick={handleLogout}
                color="error"
              >
                ログアウト
              </Button>
            </Box>
          </Box>

          {/* 顧客管理画面 */}
          <CustomerManagement />
        </>
      ) : null}

      {/* 利用者切替モーダル */}
      <UserSwitchModal
        open={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
        currentSession={session}
        onSwitchSuccess={handleUserSwitchSuccess}
      />
    </Box>
  );
};

export default MainApplication;
