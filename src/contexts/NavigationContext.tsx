/**
 * ナビゲーションコンテキスト
 *
 * 画面間データ引き継ぎとナビゲーション状態管理
 * 要件: 10.2 - 関連画面間を移動する際、システムは選択されたデータを自動的に引き継ぐこと
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BreadcrumbItem } from '../types/routing.js';

/**
 * ナビゲーション履歴項目の型定義
 */
interface NavigationHistoryItem {
  path: string;
  data?: any;
  timestamp: number;
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * ナビゲーションコンテキストの型定義
 */
interface NavigationContextType {
  // 現在のパスと状態
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];

  // データ引き継ぎ機能
  navigateWithData: (
    path: string,
    data?: any,
    options?: { replace?: boolean }
  ) => void;
  getNavigationData: <T = any>(path?: string) => T | undefined;
  clearNavigationData: (path?: string) => void;

  // 戻るボタン機能
  goBack: (fallbackPath?: string) => void;
  canGoBack: () => boolean;

  // パンくずナビゲーション
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  updateBreadcrumb: (
    index: number,
    breadcrumb: Partial<BreadcrumbItem>
  ) => void;

  // ナビゲーション履歴
  getNavigationHistory: () => NavigationHistoryItem[];
  clearNavigationHistory: () => void;
}

/**
 * ナビゲーションコンテキスト
 */
const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

/**
 * ナビゲーションプロバイダーのプロパティ
 */
interface NavigationProviderProps {
  children: React.ReactNode;
  maxHistorySize?: number;
}

/**
 * ナビゲーションプロバイダーコンポーネント
 */
export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  maxHistorySize = 50,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 状態管理
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);
  const [navigationData, setNavigationData] = useState<Map<string, any>>(
    new Map()
  );
  const [navigationHistory, setNavigationHistory] = useState<
    NavigationHistoryItem[]
  >([]);

  // 現在のパスを追跡
  const currentPath = location.pathname;

  // 前回のパスを記録（戻るボタン用）
  const previousPathRef = useRef<string>('');

  // データ付きナビゲーション
  const navigateWithData = useCallback(
    (path: string, data?: any, options?: { replace?: boolean }) => {
      // データを保存
      if (data !== undefined) {
        setNavigationData(prev => new Map(prev).set(path, data));
      }

      // 履歴に追加
      const historyItem: NavigationHistoryItem = {
        path: currentPath,
        data: data,
        timestamp: Date.now(),
        breadcrumbs: [...breadcrumbs],
      };

      setNavigationHistory(prev => {
        const updated = [historyItem, ...prev];
        return updated.slice(0, maxHistorySize);
      });

      // 前回のパスを更新
      previousPathRef.current = currentPath;

      // ナビゲーション実行
      navigate(path, {
        replace: options?.replace,
        state: { navigationData: data },
      });
    },
    [navigate, currentPath, breadcrumbs, maxHistorySize]
  );

  // ナビゲーションデータ取得
  const getNavigationData = useCallback(
    <T = any,>(path?: string): T | undefined => {
      const targetPath = path || currentPath;

      // React Router の state から取得を試行
      const stateData = location.state as { navigationData?: T };
      if (stateData?.navigationData) {
        return stateData.navigationData;
      }

      // コンテキストのマップから取得
      return navigationData.get(targetPath) as T;
    },
    [currentPath, location.state, navigationData]
  );

  // ナビゲーションデータクリア
  const clearNavigationData = useCallback((path?: string) => {
    if (path) {
      setNavigationData(prev => {
        const updated = new Map(prev);
        updated.delete(path);
        return updated;
      });
    } else {
      setNavigationData(new Map());
    }
  }, []);

  // 戻るボタン機能
  const goBack = useCallback(
    (fallbackPath?: string) => {
      if (navigationHistory.length > 0) {
        // 履歴から前の画面に戻る
        const previousItem = navigationHistory[0];

        // データを復元
        if (previousItem.data) {
          setNavigationData(prev =>
            new Map(prev).set(previousItem.path, previousItem.data)
          );
        }

        // パンくずを復元
        if (previousItem.breadcrumbs) {
          setBreadcrumbsState(previousItem.breadcrumbs);
        }

        navigate(previousItem.path, {
          state: { navigationData: previousItem.data },
        });

        // 履歴から削除
        setNavigationHistory(prev => prev.slice(1));
      } else if (fallbackPath) {
        // フォールバックパスに移動
        navigate(fallbackPath);
      } else if (previousPathRef.current) {
        // 前回のパスに戻る
        navigate(previousPathRef.current);
      } else {
        // ブラウザの戻るボタンを使用
        window.history.back();
      }
    },
    [navigate, navigationHistory]
  );

  // 戻ることができるかチェック
  const canGoBack = useCallback((): boolean => {
    return (
      navigationHistory.length > 0 ||
      !!previousPathRef.current ||
      window.history.length > 1
    );
  }, [navigationHistory.length]);

  // パンくずナビゲーション設定
  const setBreadcrumbs = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
    setBreadcrumbsState(newBreadcrumbs);
  }, []);

  // パンくずナビゲーション更新
  const updateBreadcrumb = useCallback(
    (index: number, breadcrumb: Partial<BreadcrumbItem>) => {
      setBreadcrumbsState(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = { ...updated[index], ...breadcrumb };
        }
        return updated;
      });
    },
    []
  );

  // ナビゲーション履歴取得
  const getNavigationHistory = useCallback((): NavigationHistoryItem[] => {
    return [...navigationHistory];
  }, [navigationHistory]);

  // ナビゲーション履歴クリア
  const clearNavigationHistory = useCallback(() => {
    setNavigationHistory([]);
    previousPathRef.current = '';
  }, []);

  const contextValue: NavigationContextType = {
    currentPath,
    breadcrumbs,
    navigateWithData,
    getNavigationData,
    clearNavigationData,
    goBack,
    canGoBack,
    setBreadcrumbs,
    updateBreadcrumb,
    getNavigationHistory,
    clearNavigationHistory,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * ナビゲーションコンテキストを使用するためのフック
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

/**
 * データ引き継ぎ専用フック
 */
export const useNavigationData = <T = any,>(key?: string) => {
  const { getNavigationData, clearNavigationData } = useNavigation();

  const data = getNavigationData<T>(key);

  const clearData = useCallback(() => {
    clearNavigationData(key);
  }, [clearNavigationData, key]);

  return { data, clearData };
};

/**
 * 戻るボタン専用フック
 */
export const useBackButton = (fallbackPath?: string) => {
  const { goBack, canGoBack } = useNavigation();

  const handleBack = useCallback(() => {
    goBack(fallbackPath);
  }, [goBack, fallbackPath]);

  return { goBack: handleBack, canGoBack: canGoBack() };
};

export default NavigationContext;
