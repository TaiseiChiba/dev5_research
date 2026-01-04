/**
 * ページタイトル管理フック
 *
 * 画面遷移時にブラウザのタブタイトルを動的に変更する
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// パスとタイトルのマッピング
const PAGE_TITLES: Record<string, string> = {
  '/': 'ダッシュボード',
  '/login': 'ログイン',

  // 顧客管理
  '/customers': '顧客管理',
  '/customers/list': '顧客一覧',
  '/customers/create': '顧客登録',

  // 口座管理
  '/accounts': '口座管理',
  '/accounts/list': '口座一覧',
  '/accounts/create': '口座開設',

  // 取引管理
  '/transactions': '取引管理',
  '/transactions/input': '取引入力',
  '/transactions/verification': '取引検証',
  '/transactions/confirmation': '取引確認',
  '/transactions/final-confirmation': '取引確定',
  '/transactions/history': '取引履歴',

  // ワークフロー管理
  '/workflow': 'ワークフロー',
  '/workflow/pending': '検証待ち',
  '/workflow/ready': '確定準備完了',
  '/workflow/history': 'ワークフロー履歴',

  // 設定管理
  '/settings': '設定',
  '/settings/users': 'ユーザー管理',
  '/settings/system': 'システム設定',

  // エラーページ
  '/404': 'ページが見つかりません',
  '/401': 'アクセス権限がありません',
  '/500': 'サーバーエラー',
};

// 動的パスのパターンマッチング
const DYNAMIC_PATH_PATTERNS = [
  { pattern: /^\/customers\/([^\/]+)$/, title: '顧客詳細' },
  { pattern: /^\/customers\/([^\/]+)\/edit$/, title: '顧客編集' },
  { pattern: /^\/accounts\/([^\/]+)$/, title: '口座詳細' },
  { pattern: /^\/accounts\/([^\/]+)\/edit$/, title: '口座編集' },
  { pattern: /^\/transactions\/([^\/]+)$/, title: '取引詳細' },
];

/**
 * 現在のパスに基づいてページタイトルを取得
 */
const getPageTitle = (pathname: string): string => {
  // 静的パスの確認
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  // 動的パスの確認
  for (const { pattern, title } of DYNAMIC_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return title;
    }
  }

  // デフォルトタイトル
  return 'ゴブコパ';
};

/**
 * ページタイトル管理フック
 */
export const usePageTitle = (customTitle?: string) => {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = 'ゴブコパ';
    let pageTitle: string;

    if (customTitle) {
      // カスタムタイトルが指定されている場合
      pageTitle = customTitle;
    } else {
      // パスに基づいてタイトルを決定
      pageTitle = getPageTitle(location.pathname);
    }

    // ブラウザのタイトルを更新
    if (pageTitle === baseTitle) {
      document.title = baseTitle;
    } else {
      document.title = `${pageTitle} - ${baseTitle}`;
    }
  }, [location.pathname, customTitle]);

  return {
    currentPath: location.pathname,
    pageTitle: customTitle || getPageTitle(location.pathname),
  };
};

/**
 * 特定のページタイトルを設定するヘルパーフック
 */
export const useCustomPageTitle = (title: string) => {
  return usePageTitle(title);
};
