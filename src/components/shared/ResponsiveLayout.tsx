/**
 * レスポンシブレイアウトコンポーネント
 *
 * 画面サイズに応じて適切なレイアウトを提供
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
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
  mobileNavOpen?: boolean;
  onMobileNavClose?: () => void;
  desktopNavOpen?: boolean;
  onDesktopNavToggle?: () => void;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  session,
  children,
  maxWidth = 'xl',
  showBreadcrumbs = true,
  customBreadcrumbs,
  mobileNavOpen = false,
  onMobileNavClose,
  desktopNavOpen = false,
  onDesktopNavToggle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [internalDesktopNavOpen, setInternalDesktopNavOpen] = useState(false);

  // 外部制御がある場合はそれを使用、ない場合は内部状態を使用
  const actualDesktopNavOpen =
    desktopNavOpen !== undefined ? desktopNavOpen : internalDesktopNavOpen;

  // モバイル表示時は自動的にナビゲーションを閉じる
  useEffect(() => {
    if (isMobile) {
      setInternalDesktopNavOpen(false);
    }
    // デスクトップでも初期状態は非表示のままにする
  }, [isMobile]);

  const handleMobileNavClose = () => {
    if (onMobileNavClose) {
      onMobileNavClose();
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* デスクトップ用ドロワーナビゲーション - temporaryに変更 */}
      {!isMobile && (
        <MainNavigation
          session={session}
          open={actualDesktopNavOpen}
          onClose={() => {
            if (onDesktopNavToggle) {
              onDesktopNavToggle();
            } else {
              setInternalDesktopNavOpen(false);
            }
          }}
          variant="temporary"
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
          width: '100%', // 常に100%幅を使用
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

      {/* モバイル用フローティングメニューボタン - ハンバーガーメニューがあるので削除 */}
    </Box>
  );
};

export default ResponsiveLayout;
