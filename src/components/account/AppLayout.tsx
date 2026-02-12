/**
 * アプリケーションレイアウトコンポーネント
 *
 * 認証後の共通レイアウト（ヘッダー、ナビゲーション、コンテンツエリア）
 * 要件 10.1, 10.2 に対応したレスポンシブレイアウト
 */

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LogoutOutlined,
  SwitchAccountOutlined,
  PersonOutline,
  AdminPanelSettings,
  AccountCircleOutlined,
  MenuOutlined,
} from '@mui/icons-material';
import UserSwitchModal from '../auth/UserSwitchModal.js';
import ResponsiveLayout from '../shared/ResponsiveLayout.js';
import BreadcrumbNavigation from '../shared/BreadcrumbNavigation.js';
import { UserSession, UserRole } from '../../types/auth.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { PATHS } from '../../constants/paths.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(false);

  // ページタイトル管理
  usePageTitle();

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

  const handleMobileNavToggle = () => {
    if (isMobile) {
      setMobileNavOpen(!mobileNavOpen);
    } else {
      setDesktopNavOpen(!desktopNavOpen);
    }
  };

  const handleDesktopNavToggle = () => {
    setDesktopNavOpen(!desktopNavOpen);
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
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
        }}
      >
        <Toolbar>
          {/* ハンバーガーメニューボタン */}
          <IconButton
            color="inherit"
            aria-label="メニューを開く"
            onClick={handleMobileNavToggle}
            edge="start"
            sx={{
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MenuOutlined />
          </IconButton>

          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            component="div"
            sx={{
              flexGrow: 1,
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onClick={() => navigate(PATHS.DASHBOARD)}
          >
            {isMobile ? 'ゴブコパ' : 'ゴブコパ'}
          </Typography>

          {/* ユーザー情報とメニュー */}
          <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
            {!isMobile && (
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
            )}

            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              aria-label="ユーザーメニュー"
              size={isMobile ? 'small' : 'medium'}
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
              {isMobile && (
                <MenuItem disabled>
                  <Box>
                    <Typography variant="body2">{session.userId}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {roleText}
                    </Typography>
                  </Box>
                </MenuItem>
              )}
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

      {/* メインコンテンツエリア（レスポンシブレイアウト使用） */}
      <Box sx={{ mt: 8 }}>
        {' '}
        {/* AppBarの高さ分のマージン */}
        {/* パンくずナビゲーション */}
        <BreadcrumbNavigation />
        <ResponsiveLayout
          session={session}
          mobileNavOpen={mobileNavOpen}
          onMobileNavClose={() => setMobileNavOpen(false)}
          desktopNavOpen={desktopNavOpen}
          onDesktopNavToggle={handleDesktopNavToggle}
          showBreadcrumbs={false}
        >
          <Outlet />
        </ResponsiveLayout>
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
