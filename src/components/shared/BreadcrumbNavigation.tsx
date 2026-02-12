/**
 * パンくずナビゲーションコンポーネント
 *
 * 要件 10.1, 10.2 に対応したパンくずナビゲーション機能
 */

import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs, Link, Typography, Box, useTheme } from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { PATHS, PATH_HIERARCHY } from '../../constants/paths.js';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  customItems?: BreadcrumbItem[];
  maxItems?: number;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  customItems,
  maxItems = 8,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const theme = useTheme();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    let currentPath = location.pathname;

    // 動的パラメータを含むパスを正規化
    const normalizedPath = normalizePath(currentPath, params);

    // パス階層を辿って breadcrumb を構築
    const buildBreadcrumbChain = (path: string): BreadcrumbItem[] => {
      const hierarchy = PATH_HIERARCHY[path as keyof typeof PATH_HIERARCHY];

      if (!hierarchy) {
        // 階層定義がない場合は、パスから推測
        return inferBreadcrumbsFromPath(currentPath);
      }

      const chain: BreadcrumbItem[] = [];

      if (hierarchy.parent) {
        chain.push(...buildBreadcrumbChain(hierarchy.parent));
      }

      chain.push({
        label: hierarchy.label,
        path: path === currentPath ? undefined : path,
        isActive: path === currentPath,
      });

      return chain;
    };

    return buildBreadcrumbChain(normalizedPath);
  };

  const normalizePath = (
    path: string,
    params: Record<string, string | undefined>
  ): string => {
    // 動的パラメータを含むパスを正規化
    if (params.customerId && path.includes(params.customerId)) {
      if (path.endsWith('/edit')) {
        return PATHS.CUSTOMER_EDIT;
      } else if (path.includes('/accounts')) {
        return PATHS.ACCOUNT_BY_CUSTOMER;
      } else {
        return PATHS.CUSTOMER_DETAIL;
      }
    }

    if (params.accountId && path.includes(params.accountId)) {
      if (path.endsWith('/edit')) {
        return PATHS.ACCOUNT_EDIT;
      } else {
        return PATHS.ACCOUNT_DETAIL;
      }
    }

    if (params.transactionId && path.includes(params.transactionId)) {
      return PATHS.TRANSACTION_DETAIL;
    }

    return path;
  };

  const inferBreadcrumbsFromPath = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'ダッシュボード', path: PATHS.DASHBOARD },
    ];

    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      let label = segment;

      // セグメントに基づいてラベルを決定
      switch (segment) {
        case 'customers':
          label = '顧客管理';
          break;
        case 'accounts':
          label = '口座管理';
          break;
        case 'transactions':
          label = '取引管理';
          break;
        case 'workflow':
          label = 'ワークフロー';
          break;
        case 'settings':
          label = '設定';
          break;
        case 'list':
          label = '一覧';
          break;
        case 'create':
          label = '新規作成';
          break;
        case 'edit':
          label = '編集';
          break;
        case 'history':
          label = '履歴';
          break;
        case 'input':
          label = '入力';
          break;
        case 'verification':
          label = '検証';
          break;
        case 'confirmation':
          label = '確認';
          break;
        case 'final-confirmation':
          label = '確定';
          break;
        case 'pending':
          label = '検証待ち';
          break;
        case 'ready':
          label = '確定準備完了';
          break;
        default:
          // IDの場合は詳細ページとして扱う
          if (segment.match(/^[a-zA-Z0-9-_]+$/)) {
            label = '詳細';
          }
      }

      breadcrumbs.push({
        label,
        path: isLast ? undefined : currentPath,
        isActive: isLast,
      });
    });

    return breadcrumbs;
  };

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // ダッシュボードのみの場合は表示しない
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        maxItems={maxItems}
        aria-label="パンくずナビゲーション"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast || !item.path) {
            return (
              <Typography
                key={index}
                color="text.primary"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: isLast ? 600 : 400,
                }}
              >
                {index === 0 && <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />}
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              color="inherit"
              href="#"
              onClick={e => {
                e.preventDefault();
                handleBreadcrumbClick(item.path!);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {index === 0 && <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNavigation;
