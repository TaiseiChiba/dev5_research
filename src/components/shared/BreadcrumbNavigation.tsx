/**
 * パンくずナビゲーションコンポーネント
 *
 * 現在位置の表示と上位階層への移動機能
 * 要件: 10.1, 10.2 - 画面遷移とナビゲーション
 */

import React from 'react';
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  useNavigation,
  useBackButton,
} from '../../contexts/NavigationContext.js';
import { BreadcrumbItem } from '../../types/routing.js';
import { PATHS, PATH_HIERARCHY } from '../../constants/paths.js';

interface BreadcrumbNavigationProps {
  /**
   * 手動でパンくずを指定する場合
   */
  customBreadcrumbs?: BreadcrumbItem[];

  /**
   * 戻るボタンを表示するか
   */
  showBackButton?: boolean;

  /**
   * 戻るボタンのフォールバックパス
   */
  backButtonFallback?: string;

  /**
   * ホームボタンを表示するか
   */
  showHomeButton?: boolean;

  /**
   * 最大表示階層数
   */
  maxItems?: number;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  customBreadcrumbs,
  showBackButton = true,
  backButtonFallback = PATHS.DASHBOARD,
  showHomeButton = true,
  maxItems = 5,
}) => {
  const { currentPath, breadcrumbs, navigateWithData } = useNavigation();
  const { goBack, canGoBack } = useBackButton(backButtonFallback);

  // パンくずの決定（カスタム > コンテキスト > 自動生成）
  const effectiveBreadcrumbs = React.useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    if (breadcrumbs.length > 0) {
      return breadcrumbs;
    }

    // パス階層から自動生成
    return generateBreadcrumbsFromPath(currentPath);
  }, [customBreadcrumbs, breadcrumbs, currentPath]);

  // パス階層からパンくずを自動生成
  function generateBreadcrumbsFromPath(path: string): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [];

    // ホームを追加
    if (path !== PATHS.DASHBOARD) {
      items.push({
        label: 'ダッシュボード',
        path: PATHS.DASHBOARD,
      });
    }

    // 現在のパスの階層を辿る
    let currentHierarchyPath = path;
    const pathItems: BreadcrumbItem[] = [];

    while (currentHierarchyPath && currentHierarchyPath !== PATHS.DASHBOARD) {
      const hierarchy =
        PATH_HIERARCHY[currentHierarchyPath as keyof typeof PATH_HIERARCHY];

      if (hierarchy) {
        pathItems.unshift({
          label: hierarchy.label,
          path: currentHierarchyPath,
          isActive: currentHierarchyPath === path,
        });

        currentHierarchyPath = hierarchy.parent || '';
      } else {
        break;
      }
    }

    return [...items, ...pathItems];
  }

  // パンくずの表示制限
  const displayBreadcrumbs = React.useMemo(() => {
    if (effectiveBreadcrumbs.length <= maxItems) {
      return effectiveBreadcrumbs;
    }

    // 最初と最後を保持し、中間を省略
    const first = effectiveBreadcrumbs[0];
    const last = effectiveBreadcrumbs[effectiveBreadcrumbs.length - 1];
    const middle = effectiveBreadcrumbs.slice(-maxItems + 2, -1);

    return [first, { label: '...', path: undefined }, ...middle, last];
  }, [effectiveBreadcrumbs, maxItems]);

  // パンくずクリックハンドラ
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (item.path && !item.isActive) {
      navigateWithData(item.path);
    }
  };

  // 戻るボタンクリックハンドラ
  const handleBackClick = () => {
    goBack();
  };

  if (displayBreadcrumbs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 2,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* 戻るボタン */}
      {showBackButton && canGoBack && (
        <IconButton
          size="small"
          onClick={handleBackClick}
          sx={{ mr: 1 }}
          title="前の画面に戻る"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      )}

      {/* ホームボタン */}
      {showHomeButton && currentPath !== PATHS.DASHBOARD && (
        <IconButton
          size="small"
          onClick={() => navigateWithData(PATHS.DASHBOARD)}
          sx={{ mr: 1 }}
          title="ダッシュボードに戻る"
        >
          <HomeIcon fontSize="small" />
        </IconButton>
      )}

      {/* パンくずナビゲーション */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ flexGrow: 1 }}
        maxItems={maxItems}
      >
        {displayBreadcrumbs.map((item, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;
          const isEllipsis = item.label === '...';

          if (isEllipsis) {
            return (
              <Typography
                key={`ellipsis-${index}`}
                color="text.secondary"
                variant="body2"
              >
                ...
              </Typography>
            );
          }

          if (isLast || item.isActive || !item.path) {
            return (
              <Typography
                key={item.path || `active-${index}`}
                color="text.primary"
                variant="body2"
                fontWeight="medium"
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={item.path}
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(item)}
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>

      {/* 現在のパス表示（デバッグ用、本番では非表示） */}
      {process.env.NODE_ENV === 'development' && (
        <Chip
          label={currentPath}
          size="small"
          variant="outlined"
          sx={{ ml: 2, fontSize: '0.75rem' }}
        />
      )}
    </Box>
  );
};

export default BreadcrumbNavigation;
