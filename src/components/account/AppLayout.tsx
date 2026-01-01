/**
 * アプリケーションレイアウトコンポーネント
 *
 * 認証後の共通レイアウト（ヘッダー、ナビゲーション、コンテンツエリア）
 */

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  LogoutOutlined,
  SwitchAccountOutlined,
  PersonOutline,
  AdminPanelSettings,
  MenuOutlined,
  AccountCircleOutlined,
} from '@mui/icons-material';
import UserSwitchModal from '../auth/UserSwitchModal.js';
import { UserSession, UserRole } from '../../types/auth.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { PATHS } from '../../constants/paths.js';

interface AppLayoutProps {
  session: UserSession;
  onLogout: () => void;
  onUserSwitch: (session: UserSession) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  session,
  onLogout,
  onUserSwitch,
}) => {
  const navigate = useNavigate();
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
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

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const roleText =
    session.userRole === UserRole.ADMINISTRATOR ? '管理者' : '一般行員';
  const RoleIcon =
    session.userRole === UserRole.ADMINISTRATOR
      ? AdminPanelSettings
      : PersonOutline;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* アプリケーションヘッダー */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate(PATHS.DASHBOARD)}
          >
            金融系業務アプリケーション
          </Typography>

          {/* ユーザー情報とメニュー */}
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <RoleIcon />
              <Box>
                <Typography variant="body2">{session.userId}</Typography>
                <Typography
                  variant="caption"
                  color="inherit"
                  sx={{ opacity: 0.7 }}
                >
                  {roleText}
                </Typography>
              </Box>
            </Box>

            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              aria-label="ユーザーメニュー"
            >
              <AccountCircleOutlined />
            </IconButton>

            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  setSwitchModalOpen(true);
                }}
              >
                <SwitchAccountOutlined sx={{ mr: 1 }} />
                利用者切替
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  handleLogout();
                }}
              >
                <LogoutOutlined sx={{ mr: 1 }} />
                ログアウト
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* メインコンテンツエリア */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>

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

export default AppLayout;
