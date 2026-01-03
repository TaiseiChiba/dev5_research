import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Cancel as CancelIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../constants/paths';
import { ServiceFactory } from '../../services/common/serviceFactory';
import { TransactionStatusManager } from '../workflow/TransactionStatusManager';
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

  const handleStatusChanged = async () => {
    setSuccessMessage('取引状態が正常に変更されました');
    await loadData(); // データを再読み込み

    // 成功メッセージを3秒後に消去
    setTimeout(() => setSuccessMessage(null), 3000);
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

  const getTransactionTypeColor = (
    type: TransactionType
  ): 'primary' | 'success' | 'warning' => {
    switch (type) {
      case 'transfer':
        return 'primary';
      case 'deposit':
        return 'success';
      case 'withdrawal':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const canVerifyTransaction = (transaction: Transaction): boolean => {
    // 自己検証防止: 作成者と検証者が同一の場合は検証不可
    return transaction.createdBy !== session.userId;
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
        <Typography color="text.secondary">
          検証待ち取引を取得しています...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* ヘッダーセクション */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                取引検証（ダブルチェック）
              </Typography>
              <Typography color="text.secondary">
                検証待ちの取引を確認し、適切な検証アクションを実行してください
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(PATHS.TRANSACTION_INPUT)}
              size="large"
            >
              新規取引入力
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 成功メッセージ */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* メインコンテンツ */}
      {pendingTransactions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <AccountBalanceIcon
              sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              検証待ちの取引はありません
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}
            >
              新しい取引が入力されると、ここに表示されます。取引の入力から始めましょう。
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(PATHS.TRANSACTION_INPUT)}
              size="large"
            >
              取引を入力する
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          {/* 統計情報ヘッダー */}
          <CardContent
            sx={{
              bgcolor: 'primary.50',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">検証待ち取引一覧</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pendingTransactions.length}件の取引が検証を待っています
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {pendingTransactions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  件
                </Typography>
              </Box>
            </Box>
          </CardContent>

          {/* テーブル */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>取引情報</TableCell>
                  <TableCell>種別・金額</TableCell>
                  <TableCell>作成者・日時</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingTransactions.map(transaction => (
                  <TableRow
                    key={transaction.transactionId}
                    hover
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          color="primary"
                          fontWeight="medium"
                        >
                          {transaction.transactionId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          取引ID
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          label={getTransactionTypeLabel(transaction.type)}
                          color={getTransactionTypeColor(transaction.type)}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h6" fontWeight="bold">
                          ¥{transaction.amount.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.createdBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(transaction.createdAt).toLocaleString(
                            'ja-JP'
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="検証待ち"
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {canVerifyTransaction(transaction) ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<SettingsIcon />}
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          状態管理
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled
                          startIcon={<CancelIcon />}
                        >
                          検証不可（自己作成）
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* 取引状態管理モーダル */}
      {selectedTransaction && (
        <TransactionStatusManager
          transaction={selectedTransaction}
          session={session}
          onStatusChanged={handleStatusChanged}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </Box>
  );
};
