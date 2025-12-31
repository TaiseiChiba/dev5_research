/**
 * ナビゲーションメニューの設定
 */

import { NavigationItem } from '../types/routing.js';
import { UserRole } from '../types/auth.js';
import { PATHS } from './paths.js';

/**
 * メインナビゲーションメニューの定義
 */
export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    path: PATHS.DASHBOARD,
    label: 'ダッシュボード',
  },
  {
    path: PATHS.CUSTOMERS,
    label: '顧客管理',
    children: [
      {
        path: PATHS.CUSTOMER_LIST,
        label: '顧客一覧',
      },
      {
        path: PATHS.CUSTOMER_CREATE,
        label: '新規顧客登録',
      },
    ],
  },
  {
    path: PATHS.ACCOUNTS,
    label: '口座管理',
    children: [
      {
        path: PATHS.ACCOUNT_LIST,
        label: '口座一覧',
      },
      {
        path: PATHS.ACCOUNT_CREATE,
        label: '新規口座開設',
      },
    ],
  },
  {
    path: PATHS.TRANSACTIONS,
    label: '取引管理',
    children: [
      {
        path: PATHS.TRANSACTION_INPUT,
        label: '取引入力',
      },
      {
        path: PATHS.TRANSACTION_VERIFICATION,
        label: '取引検証',
      },
      {
        path: PATHS.TRANSACTION_CONFIRMATION,
        label: '取引確定',
        adminOnly: true,
      },
      {
        path: PATHS.TRANSACTION_HISTORY,
        label: '取引履歴',
      },
    ],
  },
  {
    path: PATHS.WORKFLOW,
    label: 'ワークフロー',
    children: [
      {
        path: PATHS.WORKFLOW_PENDING,
        label: '検証待ち',
      },
      {
        path: PATHS.WORKFLOW_READY,
        label: '確定準備完了',
      },
      {
        path: PATHS.WORKFLOW_HISTORY,
        label: 'ワークフロー履歴',
      },
    ],
  },
  {
    path: PATHS.SETTINGS,
    label: '設定',
    children: [
      {
        path: PATHS.USER_MANAGEMENT,
        label: 'ユーザー管理',
        adminOnly: true,
      },
      {
        path: PATHS.SYSTEM_CONFIG,
        label: 'システム設定',
        adminOnly: true,
      },
    ],
  },
];

/**
 * ナビゲーション項目のフィルタリング
 * ユーザーの役割に基づいて表示可能な項目のみを返す
 */
export const filterNavigationByRole = (
  navigation: NavigationItem[],
  userRole: UserRole
): NavigationItem[] => {
  return navigation
    .map(item => {
      // 管理者限定項目のチェック
      if (item.adminOnly && userRole !== UserRole.ADMINISTRATOR) {
        return null;
      }

      // 子項目がある場合は再帰的にフィルタリング
      if (item.children) {
        const filteredChildren = filterNavigationByRole(
          item.children,
          userRole
        );
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }

      return item;
    })
    .filter((item): item is NavigationItem => item !== null);
};

/**
 * パスに基づいてナビゲーション項目を検索
 */
export const findNavigationItem = (
  navigation: NavigationItem[],
  path: string
): NavigationItem | null => {
  for (const item of navigation) {
    if (item.path === path) {
      return item;
    }
    if (item.children) {
      const found = findNavigationItem(item.children, path);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

/**
 * パスに基づいてパンくずナビゲーションを生成
 */
export const generateBreadcrumbs = (
  navigation: NavigationItem[],
  currentPath: string
): { label: string; path?: string }[] => {
  const breadcrumbs: { label: string; path?: string }[] = [];

  const findPath = (
    items: NavigationItem[],
    targetPath: string,
    parents: NavigationItem[] = []
  ): boolean => {
    for (const item of items) {
      const currentParents = [...parents, item];

      if (item.path === targetPath) {
        // パンくずを構築
        currentParents.forEach((parent, index) => {
          breadcrumbs.push({
            label: parent.label,
            path: index === currentParents.length - 1 ? undefined : parent.path,
          });
        });
        return true;
      }

      if (
        item.children &&
        findPath(item.children, targetPath, currentParents)
      ) {
        return true;
      }
    }
    return false;
  };

  findPath(navigation, currentPath);
  return breadcrumbs;
};
