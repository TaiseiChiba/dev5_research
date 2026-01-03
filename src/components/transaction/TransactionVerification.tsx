import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../constants/paths';
import { ServiceFactory } from '../../services/common/serviceFactory';
import type {
  Transaction,
  TransactionType,
  TransactionVerification as TransactionVerificationData,
} from '../../types/transaction';
import type { UserSession } from '../../types/auth';
import type { Account } from '../../types/account';

interface TransactionVerificationProps {
  session: UserSession;
}

interface TransactionDetailModalProps {
  transaction: Transaction;
  sourceAccount?: Account;
  destinationAccount?: Account;
  onClose: () => void;
  onVerify: (
    transactionId: string,
    verification: TransactionVerificationData
  ) => void;
  currentUserId: string;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  sourceAccount,
  destinationAccount,
  onClose,
  onVerify,
  currentUserId,
}) => {
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerification = async (action: 'approve' | 'hold' | 'return') => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const verification: TransactionVerificationData = {
        action,
        comments: comments.trim() || undefined,
        verifiedBy: currentUserId,
      };

      await onVerify(transaction.transactionId, verification);
      onClose();
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionTypeLabel = (type: TransactionType): string => {
    switch (type) {
      case 'transfer':
        return '振込';
      case 'deposit':
        return '入金';
      case 'withdrawal':
        return '出金';
      default:
        return type;
    }
  };

  const formatAccountDisplay = (account: Account): string => {
    return `${account.accountNumber} (残高: ¥${account.balance.toLocaleString()})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">取引詳細確認</h3>
              <p className="text-sm text-gray-500 mt-1">
                以下の取引内容を確認し、適切な検証アクションを選択してください
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              aria-label="閉じる"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 取引概要カード */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {getTransactionTypeLabel(transaction.type)}取引
                  </h4>
                  <p className="text-sm text-gray-600">
                    ID: {transaction.transactionId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  ¥{transaction.amount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(transaction.createdAt).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 基本情報 */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  基本情報
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">取引種別</span>
                  <span className="font-semibold text-gray-900">
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">作成者</span>
                  <span className="font-semibold text-gray-900">
                    {transaction.createdBy}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">作成日時</span>
                  <span className="text-gray-900">
                    {new Date(transaction.createdAt).toLocaleString('ja-JP')}
                  </span>
                </div>
              </div>
            </div>

            {/* 口座情報 */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  口座情報
                </h4>
              </div>
              <div className="space-y-4">
                {sourceAccount && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-red-800 mb-1">
                      振込元口座
                    </div>
                    <div className="font-mono text-sm text-red-700">
                      {formatAccountDisplay(sourceAccount)}
                    </div>
                  </div>
                )}
                {destinationAccount && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-800 mb-1">
                      振込先口座
                    </div>
                    <div className="font-mono text-sm text-green-700">
                      {formatAccountDisplay(destinationAccount)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 取引内容 */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800">取引内容</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                {transaction.description}
              </p>
            </div>
          </div>

          {/* コメント入力 */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800">
                検証コメント
              </h4>
              <span className="ml-2 text-sm text-gray-500">（任意）</span>
            </div>
            <textarea
              id="comments"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="検証時のコメントや気づいた点があれば入力してください..."
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
          </div>
        </div>

        {/* フッター（アクションボタン） */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              disabled={isProcessing}
            >
              キャンセル
            </button>
            <button
              onClick={() => handleVerification('return')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
              disabled={isProcessing}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isProcessing ? '処理中...' : '差し戻し'}
            </button>
            <button
              onClick={() => handleVerification('hold')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
              disabled={isProcessing}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isProcessing ? '処理中...' : '保留'}
            </button>
            <button
              onClick={() => handleVerification('approve')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
              disabled={isProcessing}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {isProcessing ? '処理中...' : '承認'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TransactionVerification: React.FC<
  TransactionVerificationProps
> = ({ session }) => {
  const navigate = useNavigate();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const transactionService =
        ServiceFactory.getInstance().getTransactionService();
      const accountService = ServiceFactory.getInstance().getAccountService();

      // 検証待ち取引と口座情報を並行取得
      const [transactions, accountList] = await Promise.all([
        transactionService.getTransactionsPendingVerification(),
        accountService.listAccounts(),
      ]);

      setPendingTransactions(transactions);
      setAccounts(accountList);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('データ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTransaction = async (
    transactionId: string,
    verification: TransactionVerificationData
  ) => {
    try {
      const transactionService =
        ServiceFactory.getInstance().getTransactionService();
      const result = await transactionService.verifyTransaction(
        transactionId,
        verification
      );

      if (result.success) {
        setSuccessMessage(result.message || '取引検証が完了しました');
        await loadData(); // データを再読み込み

        // 成功メッセージを3秒後に消去
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || '取引検証に失敗しました');
      }
    } catch (err) {
      setError('取引検証に失敗しました');
      console.error('取引検証エラー:', err);
    }
  };

  const getAccountById = (accountId: string): Account | undefined => {
    return accounts.find(account => account.accountId === accountId);
  };

  const getTransactionTypeLabel = (type: TransactionType): string => {
    switch (type) {
      case 'transfer':
        return '振込';
      case 'deposit':
        return '入金';
      case 'withdrawal':
        return '出金';
      default:
        return type;
    }
  };

  const canVerifyTransaction = (transaction: Transaction): boolean => {
    // 自己検証防止: 作成者と検証者が同一の場合は検証不可
    return transaction.createdBy !== session.userId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-gray-900">
              データを読み込み中
            </h3>
            <p className="mt-2 text-gray-600">
              検証待ち取引を取得しています...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダーセクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  取引検証（ダブルチェック）
                </h1>
                <p className="text-gray-600">
                  検証待ちの取引を確認し、適切な検証アクションを実行してください
                </p>
              </div>
              <button
                onClick={() => navigate(PATHS.TRANSACTION_INPUT)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>新規取引入力</span>
              </button>
            </div>
          </div>

          {/* 成功メッセージ */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-700 font-medium">
                {successMessage}
              </span>
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* メインコンテンツ */}
          {pendingTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-6">
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                検証待ちの取引はありません
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                新しい取引が入力されると、ここに表示されます。取引の入力から始めましょう。
              </p>
              <button
                onClick={() => navigate(PATHS.TRANSACTION_INPUT)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>取引を入力する</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* 統計情報ヘッダー */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        検証待ち取引一覧
                      </h3>
                      <p className="text-sm text-gray-600">
                        {pendingTransactions.length}件の取引が検証を待っています
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {pendingTransactions.length}
                    </div>
                    <div className="text-sm text-gray-500">件</div>
                  </div>
                </div>
              </div>

              {/* テーブル */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        取引情報
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        種別・金額
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        作成者・日時
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        状態
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTransactions.map(transaction => (
                      <tr
                        key={transaction.transactionId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-blue-600 mb-1">
                              {transaction.transactionId}
                            </div>
                            <div className="text-xs text-gray-500">取引ID</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.type === 'transfer'
                                    ? 'bg-blue-100 text-blue-800'
                                    : transaction.type === 'deposit'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {getTransactionTypeLabel(transaction.type)}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              ¥{transaction.amount.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {transaction.createdBy}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleString(
                                'ja-JP'
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            検証待ち
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {canVerifyTransaction(transaction) ? (
                            <button
                              onClick={() =>
                                setSelectedTransaction(transaction)
                              }
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              詳細確認
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                                />
                              </svg>
                              検証不可（自己作成）
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 取引詳細モーダル */}
          {selectedTransaction && (
            <TransactionDetailModal
              transaction={selectedTransaction}
              sourceAccount={
                selectedTransaction.sourceAccountId
                  ? getAccountById(selectedTransaction.sourceAccountId)
                  : undefined
              }
              destinationAccount={
                selectedTransaction.destinationAccountId
                  ? getAccountById(selectedTransaction.destinationAccountId)
                  : undefined
              }
              onClose={() => setSelectedTransaction(null)}
              onVerify={handleVerifyTransaction}
              currentUserId={session.userId}
            />
          )}
        </div>
      </div>
    </div>
  );
};
