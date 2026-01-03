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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
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

  const formatAccountDisplay = (account: Account): string => {
    return `${account.accountNumber} (残高: ¥${account.balance.toLocaleString()})`;
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InfoIcon color="primary" />
            <Box>
              <Typography variant="h6">取引詳細確認</Typography>
              <Typography variant="body2" color="text.secondary">
                以下の取引内容を確認し、適切な検証アクションを選択してください
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* 取引概要カード */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    {getTransactionTypeLabel(transaction.type)}取引
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {transaction.transactionId}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ¥{transaction.amount.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(transaction.createdAt).toLocaleString('ja-JP')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* 基本情報 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">基本情報</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell
                          component="th"
                          sx={{ fontWeight: 'bold', border: 0 }}
                        >
                          取引種別
                        </TableCell>
                        <TableCell sx={{ border: 0 }}>
                          <Chip
                            label={getTransactionTypeLabel(transaction.type)}
                            color={getTransactionTypeColor(transaction.type)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          component="th"
                          sx={{ fontWeight: 'bold', border: 0 }}
                        >
                          作成者
                        </TableCell>
                        <TableCell sx={{ border: 0 }}>
                          {transaction.createdBy}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          component="th"
                          sx={{ fontWeight: 'bold', border: 0 }}
                        >
                          作成日時
                        </TableCell>
                        <TableCell sx={{ border: 0 }}>
                          {new Date(transaction.createdAt).toLocaleString(
                            'ja-JP'
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 口座情報 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">口座情報</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sourceAccount && (
                    <Alert severity="warning" variant="outlined">
                      <Typography variant="body2" fontWeight="bold">
                        振込元口座
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {formatAccountDisplay(sourceAccount)}
                      </Typography>
                    </Alert>
                  )}
                  {destinationAccount && (
                    <Alert severity="success" variant="outlined">
                      <Typography variant="body2" fontWeight="bold">
                        振込先口座
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {formatAccountDisplay(destinationAccount)}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 取引内容 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DescriptionIcon sx={{ mr: 1 }} />
              <Typography variant="h6">取引内容</Typography>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {transaction.description}
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* コメント入力 */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CommentIcon sx={{ mr: 1 }} />
              <Typography variant="h6">検証コメント</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                （任意）
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="検証時のコメントや気づいた点があれば入力してください..."
              value={comments}
              onChange={e => setComments(e.target.value)}
              variant="outlined"
            />
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={isProcessing} variant="outlined">
          キャンセル
        </Button>
        <Button
          onClick={() => handleVerification('return')}
          disabled={isProcessing}
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
        >
          {isProcessing ? '処理中...' : '差し戻し'}
        </Button>
        <Button
          onClick={() => handleVerification('hold')}
          disabled={isProcessing}
          variant="contained"
          color="warning"
          startIcon={<PauseIcon />}
        >
          {isProcessing ? '処理中...' : '保留'}
        </Button>
        <Button
          onClick={() => handleVerification('approve')}
          disabled={isProcessing}
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
        >
          {isProcessing ? '処理中...' : '承認'}
        </Button>
      </DialogActions>
    </Dialog>
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
                          startIcon={<VisibilityIcon />}
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          詳細確認
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
    </Box>
  );
};
