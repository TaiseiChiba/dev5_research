/**
 * レスポンシブレイアウトコンポーネント
 *
 * 画面サイズに応じて適切なレイアウトを提供
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
} from '@mui/material';
import { MenuOutlined } from '@mui/icons-material';
import MainNavigation from './MainNavigation.js';
import BreadcrumbNavigation from './BreadcrumbNavigation.js';
import { UserSession } from '../../types/auth.js';

interface ResponsiveLayoutProps {
  session: UserSession;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  showBreadcrumbs?: boolean;
  customBreadcrumbs?: Array<{
    label: string;
    path?: string;
    isActive?: boolean;
  }>;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  session,
  children,
  maxWidth = 'xl',
  showBreadcrumbs = true,
  customBreadcrumbs,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(true);

  // モバイル表示時は自動的にナビゲーションを閉じる
  useEffect(() => {
    if (isMobile) {
      setDesktopNavOpen(false);
    } else {
      setMobileNavOpen(false);
      setDesktopNavOpen(true);
    }
  }, [isMobile]);

  const handleMobileNavToggle = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  const handleDesktopNavToggle = () => {
    setDesktopNavOpen(!desktopNavOpen);
  };

  const handleMobileNavClose = () => {
    setMobileNavOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* デスクトップ用サイドナビゲーション */}
      {!isMobile && (
        <MainNavigation
          session={session}
          open={desktopNavOpen}
          onClose={() => setDesktopNavOpen(false)}
          variant="permanent"
        />
      )}

      {/* モバイル用ドロワーナビゲーション */}
      {isMobile && (
        <MainNavigation
          session={session}
          open={mobileNavOpen}
          onClose={handleMobileNavClose}
          variant="temporary"
        />
      )}

      {/* メインコンテンツエリア */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: !isMobile && desktopNavOpen ? 0 : 0,
          width: !isMobile && desktopNavOpen ? 'calc(100% - 280px)' : '100%',
        }}
      >
        <Container
          maxWidth={maxWidth}
          sx={{
            py: 3,
            px: { xs: 2, sm: 3 },
            minHeight: '100vh',
          }}
        >
          {/* パンくずナビゲーション */}
          {showBreadcrumbs && (
            <BreadcrumbNavigation customItems={customBreadcrumbs} />
          )}

          {/* ページコンテンツ */}
          <Box
            sx={{
              width: '100%',
              overflow: 'hidden', // 横スクロールを防ぐ
            }}
          >
            {children}
          </Box>
        </Container>
      </Box>

      {/* モバイル用フローティングメニューボタン */}
      {isMobile && (
        <Zoom in={!mobileNavOpen}>
          <Fab
            color="primary"
            aria-label="メニューを開く"
            onClick={handleMobileNavToggle}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <MenuOutlined />
          </Fab>
        </Zoom>
      )}

      {/* デスクトップ用ナビゲーション切り替えボタン */}
      {!isMobile && (
        <Fab
          size="small"
          color="default"
          aria-label="ナビゲーション切り替え"
          onClick={handleDesktopNavToggle}
          sx={{
            position: 'fixed',
            top: 80,
            left: desktopNavOpen ? 260 : 16,
            zIndex: theme.zIndex.speedDial,
            transition: theme.transitions.create(['left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          <MenuOutlined />
        </Fab>
      )}
    </Box>
  );
};

export default ResponsiveLayout;
