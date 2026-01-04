/**
 * 取引検証画面（テスト用）
 * enum問題のデバッグとタブ機能のテスト
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../constants/paths';
import { ServiceFactory } from '../../services/common/serviceFactory';
import { useNavigation } from '../../contexts/NavigationContext';
import type { Transaction } from '../../types/transaction';
import type { UserSession } from '../../types/auth';

interface TransactionVerificationTestProps {
  session: UserSession;
}

export const TransactionVerificationTest: React.FC<
  TransactionVerificationTestProps
> = ({ session }) => {
  const navigate = useNavigate();
  const { navigateWithData } = useNavigation();

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );
  const [verifiedTransactions, setVerifiedTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const transactionService =
        ServiceFactory.getInstance().getTransactionService();

      // 検証待ち取引と検証済み取引を並行取得
      const [pendingTxns, verifiedTxns] = await Promise.all([
        transactionService.getTransactionsPendingVerification(),
        transactionService.getTransactionsReadyForConfirmation(),
      ]);

      console.log('=== デバッグ情報 ===');
      console.log('検証待ち取引:', pendingTxns);
      console.log('検証済み取引:', verifiedTxns);
      console.log(
        '検証済み取引の詳細:',
        verifiedTxns.map(t => ({
          id: t.transactionId,
          status: t.status,
          statusType: typeof t.status,
          rawStatus: JSON.stringify(t.status),
        }))
      );

      setPendingTransactions(pendingTxns);
      setVerifiedTransactions(verifiedTxns);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalConfirmation = (transaction: Transaction) => {
    console.log('最終確認画面に遷移:', transaction);
    navigateWithData(PATHS.TRANSACTION_FINAL_CONFIRMATION, transaction);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">データを読み込み中</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ textAlign: 'center' }}
      >
        取引検証（テスト版）
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ width: '100%' }}>
        {/* デバッグ情報 */}
        <Box sx={{ p: 2, bgcolor: 'grey.100', fontSize: '12px' }}>
          <div>検証待ち: {pendingTransactions.length}件</div>
          <div>検証済み: {verifiedTransactions.length}件</div>
          <div>アクティブタブ: {activeTab}</div>
        </Box>

        {/* タブ */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="取引タブ"
          >
            <Tab
              label={`検証待ち (${pendingTransactions.length})`}
              value="pending"
            />
            <Tab
              label={`検証済み (${verifiedTransactions.length})`}
              value="verified"
            />
          </Tabs>
        </Box>

        {/* タブコンテンツ */}
        <CardContent>
          {activeTab === 'pending' ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                検証待ち取引
              </Typography>
              {pendingTransactions.length === 0 ? (
                <Typography color="text.secondary">
                  検証待ちの取引はありません
                </Typography>
              ) : (
                pendingTransactions.map(transaction => (
                  <Box
                    key={transaction.transactionId}
                    sx={{ p: 2, border: 1, borderColor: 'divider', mb: 2 }}
                  >
                    <Typography>ID: {transaction.transactionId}</Typography>
                    <Typography>
                      金額: ¥{transaction.amount.toLocaleString()}
                    </Typography>
                    <Typography>状態: {transaction.status}</Typography>
                    <Typography>作成者: {transaction.createdBy}</Typography>
                  </Box>
                ))
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                検証済み取引
              </Typography>
              {verifiedTransactions.length === 0 ? (
                <Typography color="text.secondary">
                  検証済みの取引はありません
                </Typography>
              ) : (
                verifiedTransactions.map(transaction => (
                  <Box
                    key={transaction.transactionId}
                    sx={{ p: 2, border: 1, borderColor: 'divider', mb: 2 }}
                  >
                    <Typography>ID: {transaction.transactionId}</Typography>
                    <Typography>
                      金額: ¥{transaction.amount.toLocaleString()}
                    </Typography>
                    <Typography>状態: {transaction.status}</Typography>
                    <Typography>作成者: {transaction.createdBy}</Typography>
                    <Typography>検証者: {transaction.verifiedBy}</Typography>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleFinalConfirmation(transaction)}
                      sx={{ mt: 1 }}
                    >
                      最終確認
                    </Button>
                  </Box>
                ))
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
