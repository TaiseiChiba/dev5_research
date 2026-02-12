/**
 * ワークフロー順序制御フック
 *
 * 不正な画面遷移を防止し、適切なワークフロー順序を強制します。
 * 要件: 10.3 - 不正な画面遷移の防止
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  WorkflowOrderService,
  WorkflowProgress,
  TransitionControl,
} from '../services/workflow/workflowOrderService.js';
import { useNavigation } from '../contexts/NavigationContext.js';

interface WorkflowGuardOptions {
  /**
   * 自動リダイレクトを有効にするか
   */
  autoRedirect?: boolean;

  /**
   * 警告メッセージを表示するか
   */
  showWarnings?: boolean;

  /**
   * 取引IDを取得する関数
   */
  getTransactionId?: () => string | undefined;
}

interface WorkflowGuardResult {
  /**
   * 現在のワークフロー進行状況
   */
  progress: WorkflowProgress | null;

  /**
   * 遷移制御情報
   */
  transitionControl: TransitionControl | null;

  /**
   * 遷移が許可されているか
   */
  isTransitionAllowed: boolean;

  /**
   * ブロック理由
   */
  blockReason?: string;

  /**
   * 推奨パス
   */
  suggestedPath?: string;

  /**
   * 手動で遷移をチェックする関数
   */
  checkTransition: (
    toPath: string,
    transactionId?: string
  ) => TransitionControl;

  /**
   * 適切なパスに遷移する関数
   */
  navigateToCorrectPath: () => void;

  /**
   * ワークフローサービスインスタンス
   */
  workflowService: WorkflowOrderService;
}

/**
 * ワークフロー順序制御フック
 */
export const useWorkflowGuard = (
  options: WorkflowGuardOptions = {}
): WorkflowGuardResult => {
  const {
    autoRedirect = false,
    showWarnings = true,
    getTransactionId,
  } = options;

  const location = useLocation();
  const navigate = useNavigate();
  const { navigateWithData } = useNavigation();

  const [workflowService] = useState(() => new WorkflowOrderService());
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [transitionControl, setTransitionControl] =
    useState<TransitionControl | null>(null);
  const [previousPath, setPreviousPath] = useState<string>('');

  // 取引IDを取得
  const transactionId = getTransactionId?.();

  // 遷移チェック関数
  const checkTransition = useCallback(
    (toPath: string, txId?: string): TransitionControl => {
      const fromPath = location.pathname;
      return workflowService.validateTransition(fromPath, toPath, txId);
    },
    [location.pathname, workflowService]
  );

  // 適切なパスに遷移する関数
  const navigateToCorrectPath = useCallback(() => {
    if (transitionControl?.suggestedPath) {
      navigateWithData(transitionControl.suggestedPath);
    }
  }, [transitionControl, navigateWithData]);

  // 現在のパスが変更された時の処理
  useEffect(() => {
    const currentPath = location.pathname;

    // 前回のパスから現在のパスへの遷移をチェック
    if (previousPath && previousPath !== currentPath) {
      const control = checkTransition(currentPath, transactionId);
      setTransitionControl(control);

      // 自動リダイレクトが有効で遷移が許可されていない場合
      if (autoRedirect && !control.isAllowed && control.suggestedPath) {
        console.warn('Invalid workflow transition detected, redirecting...', {
          from: previousPath,
          to: currentPath,
          reason: control.reason,
          suggestedPath: control.suggestedPath,
        });

        navigate(control.suggestedPath, { replace: true });
        return;
      }

      // 警告メッセージの表示
      if (showWarnings && !control.isAllowed) {
        console.warn('Workflow transition blocked:', {
          from: previousPath,
          to: currentPath,
          reason: control.reason,
          suggestedPath: control.suggestedPath,
        });
      }
    }

    setPreviousPath(currentPath);
  }, [
    location.pathname,
    previousPath,
    checkTransition,
    transactionId,
    autoRedirect,
    showWarnings,
    navigate,
  ]);

  // 取引IDが変更された時にワークフロー進行状況を更新
  useEffect(() => {
    if (transactionId) {
      const newProgress = workflowService.getWorkflowProgress(transactionId);
      setProgress(newProgress);
    } else {
      setProgress(null);
    }
  }, [transactionId, workflowService]);

  return {
    progress,
    transitionControl,
    isTransitionAllowed: transitionControl?.isAllowed ?? true,
    blockReason: transitionControl?.reason,
    suggestedPath: transitionControl?.suggestedPath,
    checkTransition,
    navigateToCorrectPath,
    workflowService,
  };
};

/**
 * 取引ワークフロー専用ガードフック
 */
export const useTransactionWorkflowGuard = (transactionId?: string) => {
  return useWorkflowGuard({
    autoRedirect: true,
    showWarnings: true,
    getTransactionId: () => transactionId,
  });
};

/**
 * ページレベルワークフローガードフック
 *
 * ページコンポーネントで使用し、不正なアクセスを防止します。
 */
export const usePageWorkflowGuard = (
  requiredStage?: string,
  transactionId?: string
) => {
  const location = useLocation();
  const navigate = useNavigate();
  const workflowService = new WorkflowOrderService();

  const [isAccessAllowed, setIsAccessAllowed] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId || !requiredStage) {
      return;
    }

    const progress = workflowService.getWorkflowProgress(transactionId);
    const currentPath = location.pathname;

    // 現在のパスへのアクセスが適切かチェック
    const control = workflowService.validateTransition(
      '',
      currentPath,
      transactionId
    );

    if (!control.isAllowed) {
      setIsAccessAllowed(false);
      setRedirectPath(control.suggestedPath || '/transactions/input');

      // 3秒後に自動リダイレクト
      const timer = setTimeout(() => {
        navigate(control.suggestedPath || '/transactions/input', {
          replace: true,
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [
    transactionId,
    requiredStage,
    location.pathname,
    navigate,
    workflowService,
  ]);

  return {
    isAccessAllowed,
    redirectPath,
    workflowService,
  };
};

export default useWorkflowGuard;
