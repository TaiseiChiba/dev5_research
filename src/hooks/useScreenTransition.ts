/**
 * 画面遷移データ管理フック
 *
 * 画面間でのデータ引き継ぎを簡単に行うためのユーティリティフック
 * 要件: 10.2 - 関連画面間を移動する際、システムは選択されたデータを自動的に引き継ぐこと
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useNavigation,
  useNavigationData,
} from '../contexts/NavigationContext.js';

/**
 * 画面遷移オプション
 */
interface TransitionOptions {
  /**
   * データを自動的にクリアするか
   */
  autoClear?: boolean;

  /**
   * データクリアのタイミング（ミリ秒）
   */
  clearDelay?: number;

  /**
   * 履歴に残すか
   */
  addToHistory?: boolean;
}

/**
 * 画面遷移データ管理フック
 */
export const useScreenTransition = <T = any>(
  defaultOptions: TransitionOptions = {}
) => {
  const { navigateWithData, setBreadcrumbs } = useNavigation();
  const { data, clearData } = useNavigationData<T>();
  const location = useLocation();

  const [transitionData, setTransitionData] = useState<T | undefined>(data);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // データが変更された時の処理
  useEffect(() => {
    if (data !== undefined) {
      setTransitionData(data);

      // 自動クリアが有効な場合
      if (defaultOptions.autoClear) {
        const delay = defaultOptions.clearDelay || 5000;
        const timer = setTimeout(() => {
          clearData();
          setTransitionData(undefined);
        }, delay);

        return () => clearTimeout(timer);
      }
    }
  }, [data, defaultOptions.autoClear, defaultOptions.clearDelay, clearData]);

  /**
   * データ付きで画面遷移
   */
  const navigateWithTransitionData = useCallback(
    (
      path: string,
      data?: T,
      options?: TransitionOptions & { replace?: boolean }
    ) => {
      setIsTransitioning(true);

      const mergedOptions = { ...defaultOptions, ...options };

      navigateWithData(path, data, { replace: options?.replace });

      // 遷移完了後の処理
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    },
    [navigateWithData, defaultOptions]
  );

  /**
   * 選択データと共に詳細画面に遷移
   */
  const navigateToDetail = useCallback(
    (detailPath: string, selectedItem: T, options?: TransitionOptions) => {
      navigateWithTransitionData(detailPath, selectedItem, options);
    },
    [navigateWithTransitionData]
  );

  /**
   * 編集データと共に編集画面に遷移
   */
  const navigateToEdit = useCallback(
    (editPath: string, editItem: T, options?: TransitionOptions) => {
      navigateWithTransitionData(editPath, editItem, options);
    },
    [navigateWithTransitionData]
  );

  /**
   * 確認データと共に確認画面に遷移
   */
  const navigateToConfirmation = useCallback(
    (
      confirmationPath: string,
      confirmationData: T,
      options?: TransitionOptions
    ) => {
      navigateWithTransitionData(confirmationPath, confirmationData, options);
    },
    [navigateWithTransitionData]
  );

  /**
   * フォームデータを保持して一時的に他画面に遷移
   */
  const navigateWithFormData = useCallback(
    (path: string, formData: T, options?: TransitionOptions) => {
      const preserveOptions = {
        autoClear: false, // フォームデータは自動クリアしない
        addToHistory: true,
        ...options,
      };

      navigateWithTransitionData(path, formData, preserveOptions);
    },
    [navigateWithTransitionData]
  );

  /**
   * 遷移データをクリア
   */
  const clearTransitionData = useCallback(() => {
    clearData();
    setTransitionData(undefined);
  }, [clearData]);

  /**
   * 遷移データが存在するかチェック
   */
  const hasTransitionData = useCallback((): boolean => {
    return transitionData !== undefined;
  }, [transitionData]);

  /**
   * 特定のプロパティを持つデータかチェック
   */
  const hasDataProperty = useCallback(
    (property: keyof T): boolean => {
      return (
        transitionData !== undefined &&
        typeof transitionData === 'object' &&
        transitionData !== null &&
        property in transitionData
      );
    },
    [transitionData]
  );

  /**
   * パンくずナビゲーションを設定
   */
  const setTransitionBreadcrumbs = useCallback(
    (
      breadcrumbs: Array<{
        label: string;
        path?: string;
        isActive?: boolean;
      }>
    ) => {
      setBreadcrumbs(breadcrumbs);
    },
    [setBreadcrumbs]
  );

  return {
    // データ
    transitionData,
    hasTransitionData: hasTransitionData(),
    isTransitioning,

    // ナビゲーション関数
    navigateWithTransitionData,
    navigateToDetail,
    navigateToEdit,
    navigateToConfirmation,
    navigateWithFormData,

    // ユーティリティ
    clearTransitionData,
    hasDataProperty,
    setTransitionBreadcrumbs,
  };
};

/**
 * 顧客データ遷移専用フック
 */
export const useCustomerTransition = () => {
  return useScreenTransition<{
    customerId: string;
    name: string;
    phoneticName: string;
    customerType: string;
    [key: string]: any;
  }>();
};

/**
 * 口座データ遷移専用フック
 */
export const useAccountTransition = () => {
  return useScreenTransition<{
    accountId: string;
    accountNumber: string;
    customerId: string;
    customerName?: string;
    balance: number;
    [key: string]: any;
  }>();
};

/**
 * 取引データ遷移専用フック
 */
export const useTransactionTransition = () => {
  return useScreenTransition<{
    transactionId?: string;
    type: string;
    amount: number;
    description: string;
    sourceAccountId?: string;
    destinationAccountId?: string;
    [key: string]: any;
  }>();
};

/**
 * フォームデータ遷移専用フック
 */
export const useFormTransition = <T extends Record<string, any>>() => {
  return useScreenTransition<T>({
    autoClear: false, // フォームデータは手動でクリア
    addToHistory: true,
  });
};

export default useScreenTransition;
