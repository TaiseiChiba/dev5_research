import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../constants/paths';
import type { Transaction } from '../../types/transaction';
import type { UserSession } from '../../types/auth';

interface TransactionVerificationProps {
  session: UserSession;
}

export const TransactionVerification: React.FC<
  TransactionVerificationProps
> = ({ session }) => {
  const navigate = useNavigate();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingTransactions();
  }, []);

  const loadPendingTransactions = async () => {
    try {
      setLoading(true);
      // 検証待ちの取引を取得（実装予定）
      // const transactions = await transactionService.getPendingTransactions();
      // setPendingTransactions(transactions);

      // 仮のデータ
      setPendingTransactions([]);
    } catch (err) {
      setError('検証待ち取引の取得に失敗しました');
      console.error('検証待ち取引取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId: string) => {
    try {
      // 承認処理（実装予定）
      // await transactionService.approveTransaction(transactionId);
      console.log('取引承認:', transactionId);
      loadPendingTransactions();
    } catch (err) {
      setError('取引承認に失敗しました');
      console.error('取引承認エラー:', err);
    }
  };

  const handleReject = async (transactionId: string) => {
    try {
      // 差し戻し処理（実装予定）
      // await transactionService.rejectTransaction(transactionId);
      console.log('取引差し戻し:', transactionId);
      loadPendingTransactions();
    } catch (err) {
      setError('取引差し戻しに失敗しました');
      console.error('取引差し戻しエラー:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">検証待ち取引を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">取引検証</h1>
          <button
            onClick={() => navigate(PATHS.TRANSACTION_INPUT)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            新規取引入力
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {pendingTransactions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              検証待ちの取引はありません
            </h3>
            <p className="text-gray-500 mb-4">
              新しい取引が入力されると、ここに表示されます。
            </p>
            <button
              onClick={() => navigate(PATHS.TRANSACTION_INPUT)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              取引を入力する
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {pendingTransactions.map(transaction => (
                <li key={transaction.transactionId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          取引ID: {transaction.transactionId}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            検証待ち
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            金額: ¥{transaction.amount?.toLocaleString()}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            日付:{' '}
                            {new Date(transaction.createdAt).toLocaleDateString(
                              'ja-JP'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => handleReject(transaction.transactionId)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        差し戻し
                      </button>
                      <button
                        onClick={() => handleApprove(transaction.transactionId)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        承認
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
