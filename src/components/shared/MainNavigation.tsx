/**
 * メインナビゲーションメニューコンポーネント
 *
 * 要件 10.1, 10.2 に対応したメインナビゲーション機能
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  DashboardOutlined,
  PeopleOutline,
  AccountBalanceOutlined,
  ReceiptLongOutlined,
  WorkOutlined,
  SettingsOutlined,
  ExpandLess,
  ExpandMore,
  ChevronRight,
  CloseOutlined,
} from '@mui/icons-material';
import { UserSession, UserRole } from '../../types/auth.js';
import { PATHS } from '../../constants/paths.js';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  adminOnly?: boolean;
  children?: NavigationItem[];
}

interface MainNavigationProps {
  session: UserSession;
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

const DRAWER_WIDTH = 280;

const MainNavigation: React.FC<MainNavigationProps> = ({
  session,
  open,
  onClose,
  variant = 'temporary',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'transactions',
  ]);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: <DashboardOutlined />,
      path: PATHS.DASHBOARD,
    },
    {
      id: 'customers',
      label: '顧客管理',
      icon: <PeopleOutline />,
      children: [
        {
          id: 'customer-list',
          label: '顧客一覧',
          icon: <ChevronRight />,
          path: PATHS.CUSTOMER_LIST,
        },
        {
          id: 'customer-create',
          label: '新規顧客登録',
          icon: <ChevronRight />,
          path: PATHS.CUSTOMER_CREATE,
        },
      ],
    },
    {
      id: 'accounts',
      label: '口座管理',
      icon: <AccountBalanceOutlined />,
      children: [
        {
          id: 'account-list',
          label: '口座一覧',
          icon: <ChevronRight />,
          path: PATHS.ACCOUNT_LIST,
        },
        {
          id: 'account-create',
          label: '新規口座開設',
          icon: <ChevronRight />,
          path: PATHS.ACCOUNT_CREATE,
        },
      ],
    },
    {
      id: 'transactions',
      label: '取引管理',
      icon: <ReceiptLongOutlined />,
      children: [
        {
          id: 'transaction-input',
          label: '取引入力',
          icon: <ChevronRight />,
          path: PATHS.TRANSACTION_INPUT,
        },
        {
          id: 'transaction-verification',
          label: '取引検証',
          icon: <ChevronRight />,
          path: PATHS.TRANSACTION_VERIFICATION,
        },
        {
          id: 'transaction-confirmation',
          label: '取引確認',
          icon: <ChevronRight />,
          path: PATHS.TRANSACTION_CONFIRMATION,
        },
        {
          id: 'transaction-final-confirmation',
          label: '取引確定',
          icon: <ChevronRight />,
          path: PATHS.TRANSACTION_FINAL_CONFIRMATION,
          adminOnly: true,
        },
        {
          id: 'transaction-history',
          label: '取引履歴',
          icon: <ChevronRight />,
          path: PATHS.TRANSACTION_HISTORY,
        },
      ],
    },
    {
      id: 'workflow',
      label: 'ワークフロー',
      icon: <WorkOutlined />,
      children: [
        {
          id: 'workflow-pending',
          label: '検証待ち取引',
          icon: <ChevronRight />,
          path: PATHS.WORKFLOW_PENDING,
        },
        {
          id: 'workflow-ready',
          label: '確定準備完了',
          icon: <ChevronRight />,
          path: PATHS.WORKFLOW_READY,
        },
        {
          id: 'workflow-history',
          label: 'ワークフロー履歴',
          icon: <ChevronRight />,
          path: PATHS.WORKFLOW_HISTORY,
        },
      ],
    },
    {
      id: 'settings',
      label: '設定管理',
      icon: <SettingsOutlined />,
      adminOnly: true,
      children: [
        {
          id: 'user-management',
          label: 'ユーザー管理',
          icon: <ChevronRight />,
          path: PATHS.USER_MANAGEMENT,
          adminOnly: true,
        },
        {
          id: 'system-config',
          label: 'システム設定',
          icon: <ChevronRight />,
          path: PATHS.SYSTEM_CONFIG,
          adminOnly: true,
        },
      ],
    },
  ];

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const isItemVisible = (item: NavigationItem): boolean => {
    if (item.adminOnly && session.userRole !== UserRole.ADMINISTRATOR) {
      return false;
    }
    return true;
  };

  const isPathActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    if (!isItemVisible(item)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path ? isPathActive(item.path) : false;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={
              hasChildren
                ? () => handleExpandClick(item.id)
                : item.path
                  ? () => handleNavigate(item.path!)
                  : undefined
            }
            sx={{
              pl: 2 + level * 2,
              backgroundColor: isActive
                ? theme.palette.action.selected
                : 'transparent',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive ? theme.palette.primary.main : 'inherit',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                color: isActive ? theme.palette.primary.main : 'inherit',
                '& .MuiListItemText-primary': {
                  fontWeight: isActive ? 600 : 400,
                },
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child =>
                renderNavigationItem(child, level + 1)
              )}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%' }}>
      {/* ドロワーヘッダー */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" noWrap>
          メニュー
        </Typography>
        {variant === 'temporary' && (
          <IconButton onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        )}
      </Box>

      {/* ナビゲーションリスト */}
      <List sx={{ pt: 1 }}>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>

      {/* フッター情報 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          利用者: {session.userId}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          権限:{' '}
          {session.userRole === UserRole.ADMINISTRATOR ? '管理者' : '一般行員'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default MainNavigation;
