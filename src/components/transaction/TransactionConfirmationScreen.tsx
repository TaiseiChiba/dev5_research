/**
 * 取引確定画面コンポーネント
 *
 * 確定準備完了取引の一覧表示、取引確定ボタンと処理結果表示、残高更新の表示を提供します。
 * 要件: 6.1, 6.2, 6.5
 */

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
  DialogContentText,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  Transaction,
  TransactionType,
  TransactionResult,
} from '../../types/transaction.js';
import { AccountWithCustomer } from '../../types/account.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';

interface TransactionConfirmationScreenProps {
  session?: { userId: string; userRole: string };
}

interface ConfirmationResult {
  transaction: Transaction;
  result: TransactionResult;
  balanceChanges: Array<{
    accountId: string;
    accountNumber: string;
    customerName: string;
    oldBalance: number;
    newBalance: number;
    change: number;
  }>;
}

const TransactionConfirmationScreen: React.FC<
  TransactionConfirmationScreenProps
> = ({ session }) => {
  const navigate = useNavigate();
  const transactionService =
    ServiceFactory.getInstance().getTransactionService();
  const accountService = ServiceFactory.getInstance().getAccountService();
  const customerService = ServiceFactory.getInstance().getCustomerService();

  // 状態管理
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<AccountWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({ open: false, transaction: null });
  const [confirmationResults, setConfirmationResults] = useState<
    ConfirmationResult[]
  >([]);
  const [showResults, setShowResults] = useState(false);

  // データ読み込み
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // 確定準備完了取引と口座・顧客データを並行取得
      const [readyTransactions, accountList, customerList] = await Promise.all([
        transactionService.getTransactionsReadyForConfirmation(),
        accountService.listAccounts(),
        customerService.listCustomers({ page: 1, limit: 1000 }),
      ]);

      // 顧客情報をマップに変換
      const customerMap = new Map();
      customerList.data.forEach(customer => {
        customerMap.set(customer.customerId, customer);
      });

      // 口座に顧客名を結合
      const accountsWithCustomer: AccountWithCustomer[] = accountList.map(
        account => {
          const customer = customerMap.get(account.customerId);
          return {
            ...account,
            customerName: customer ? customer.name : '不明な顧客',
          };
        }
      );

      setTransactions(readyTransactions);
      setAccounts(accountsWithCustomer);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      setError('データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 取引タイプのラベル取得
  const getTransactionTypeLabel = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.TRANSFER:
        return '振込';
      case TransactionType.DEPOSIT:
        return '入金';
      case TransactionType.WITHDRAWAL:
        return '出金';
      default:
        return '';
    }
  };

  // 取引タイプの色取得
  const getTransactionTypeColor = (
    type: TransactionType
  ): 'primary' | 'success' | 'warning' => {
    switch (type) {
      case TransactionType.TRANSFER:
        return 'primary';
      case TransactionType.DEPOSIT:
        return 'success';
      case TransactionType.WITHDRAWAL:
        return 'warning';
      default:
        return 'primary';
    }
  };

  // 口座情報取得
  const getAccountInfo = (
    accountId: string
  ): AccountWithCustomer | undefined => {
    return accounts.find(acc => acc.accountId === accountId);
  };

  // 口座表示フォーマット
  const formatAccountDisplay = (account: AccountWithCustomer): string => {
    return `${account.customerName}：${account.accountNumber}`;
  };

  // 確定確認ダイアログを開く
  const handleConfirmClick = (transaction: Transaction) => {
    setConfirmationDialog({ open: true, transaction });
  };

  // 確定確認ダイアログを閉じる
  const handleConfirmDialogClose = () => {
    setConfirmationDialog({ open: false, transaction: null });
  };

  // 取引確定処理
  const handleConfirmTransaction = async () => {
    const { transaction } = confirmationDialog;
    if (!transaction || !session?.userId) {
      setError('セッション情報が不正です。');
      return;
    }

    try {
      setConfirming(transaction.transactionId);
      setError('');

      // 確定前の残高を記録
      const oldBalances = new Map<string, number>();
      if (transaction.sourceAccountId) {
        const sourceAccount = getAccountInfo(transaction.sourceAccountId);
        if (sourceAccount) {
          oldBalances.set(transaction.sourceAccountId, sourceAccount.balance);
        }
      }
      if (transaction.destinationAccountId) {
        const destAccount = getAccountInfo(transaction.destinationAccountId);
        if (destAccount) {
          oldBalances.set(
            transaction.destinationAccountId,
            destAccount.balance
          );
        }
      }

      // 取引確定実行
      const result = await transactionService.confirmTransaction(
        transaction.transactionId,
        session.userId
      );

      if (result.success) {
        // 残高変更情報を構築
        const balanceChanges: ConfirmationResult['balanceChanges'] = [];

        if (result.newBalance) {
          Object.entries(result.newBalance).forEach(
            ([accountId, newBalance]) => {
              const account = getAccountInfo(accountId);
              const oldBalance = oldBalances.get(accountId) || 0;
              if (account) {
                balanceChanges.push({
                  accountId,
                  accountNumber: account.accountNumber,
                  customerName: account.customerName,
                  oldBalance,
                  newBalance,
                  change: newBalance - oldBalance,
                });
              }
            }
          );
        }

        // 確定結果を記録
        const confirmationResult: ConfirmationResult = {
          transaction,
          result,
          balanceChanges,
        };

        setConfirmationResults(prev => [...prev, confirmationResult]);
        setShowResults(true);

        // データを再読み込み
        await loadData();
      } else {
        setError(result.message || '取引確定に失敗しました。');
      }
    } catch (error) {
      console.error('取引確定エラー:', error);
      setError('取引確定中にエラーが発生しました。');
    } finally {
      setConfirming(null);
      handleConfirmDialogClose();
    }
  };

  // 取引詳細表示
  const handleViewTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>データを読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        取引確定
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        検証完了済みの取引を確定し、口座残高を更新します。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 確定結果表示 */}
      {confirmationResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6">確定処理結果</Typography>
              </Box>
              <IconButton
                onClick={() => setShowResults(!showResults)}
                size="small"
              >
                {showResults ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={showResults}>
              {confirmationResults.map((result, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      取引ID: {result.transaction.transactionId} -{' '}
                      {result.result.message}
                    </Typography>
                  </Alert>

                  {result.balanceChanges.length > 0 && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          残高更新結果
                        </Typography>
                        <Grid container spacing={2}>
                          {result.balanceChanges.map((change, changeIndex) => (
                            <Grid item xs={12} sm={6} key={changeIndex}>
                              <Box
                                sx={{
                                  p: 2,
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {change.customerName}：{change.accountNumber}
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mt: 1,
                                  }}
                                >
                                  <Typography variant="body2">
                                    ¥{change.oldBalance.toLocaleString()}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    →
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    ¥{change.newBalance.toLocaleString()}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                    }}
                                  >
                                    {change.change > 0 ? (
                                      <TrendingUpIcon
                                        color="success"
                                        fontSize="small"
                                      />
                                    ) : (
                                      <TrendingDownIcon
                                        color="error"
                                        fontSize="small"
                                      />
                                    )}
                                    <Typography
                                      variant="body2"
                                      color={
                                        change.change > 0
                                          ? 'success.main'
                                          : 'error.main'
                                      }
                                      fontWeight="bold"
                                    >
                                      {change.change > 0 ? '+' : ''}¥
                                      {change.change.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              ))}
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* 確定準備完了取引一覧 */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6">確定準備完了取引</Typography>
            <Chip
              label={`${transactions.length}件`}
              color="primary"
              size="small"
            />
          </Box>

          {transactions.length === 0 ? (
            <Alert severity="info">確定準備完了の取引はありません。</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>取引ID</TableCell>
                    <TableCell>取引タイプ</TableCell>
                    <TableCell>振込元口座</TableCell>
                    <TableCell>振込先口座</TableCell>
                    <TableCell align="right">金額</TableCell>
                    <TableCell>作成者</TableCell>
                    <TableCell>検証者</TableCell>
                    <TableCell>作成日時</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map(transaction => {
                    const sourceAccount = transaction.sourceAccountId
                      ? getAccountInfo(transaction.sourceAccountId)
                      : undefined;
                    const destinationAccount = transaction.destinationAccountId
                      ? getAccountInfo(transaction.destinationAccountId)
                      : undefined;

                    return (
                      <TableRow key={transaction.transactionId}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {transaction.transactionId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getTransactionTypeLabel(transaction.type)}
                            color={getTransactionTypeColor(transaction.type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {sourceAccount ? (
                            <Typography variant="body2">
                              {formatAccountDisplay(sourceAccount)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {destinationAccount ? (
                            <Typography variant="body2">
                              {formatAccountDisplay(destinationAccount)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ¥{transaction.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.createdBy}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.verifiedBy || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.createdAt.toLocaleDateString('ja-JP')}
                            <br />
                            {transaction.createdAt.toLocaleTimeString('ja-JP')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="詳細表示">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleViewTransaction(
                                    transaction.transactionId
                                  )
                                }
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={
                                confirming === transaction.transactionId ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <CheckCircleIcon />
                                )
                              }
                              onClick={() => handleConfirmClick(transaction)}
                              disabled={
                                confirming === transaction.transactionId
                              }
                            >
                              {confirming === transaction.transactionId
                                ? '確定中...'
                                : '確定'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 確定確認ダイアログ */}
      <Dialog
        open={confirmationDialog.open}
        onClose={handleConfirmDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="warning" />
            <Typography variant="h6">取引確定の確認</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {confirmationDialog.transaction && (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                以下の取引を確定しますか？確定後は口座残高が更新され、取引の取消は当日のみ可能になります。
              </DialogContentText>

              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        取引ID
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {confirmationDialog.transaction.transactionId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        取引タイプ
                      </Typography>
                      <Chip
                        label={getTransactionTypeLabel(
                          confirmationDialog.transaction.type
                        )}
                        color={getTransactionTypeColor(
                          confirmationDialog.transaction.type
                        )}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        金額
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ¥
                        {confirmationDialog.transaction.amount.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        作成者
                      </Typography>
                      <Typography variant="body1">
                        {confirmationDialog.transaction.createdBy}
                      </Typography>
                    </Grid>
                    {confirmationDialog.transaction.sourceAccountId && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          振込元口座
                        </Typography>
                        <Typography variant="body1">
                          {getAccountInfo(
                            confirmationDialog.transaction.sourceAccountId
                          )
                            ? formatAccountDisplay(
                                getAccountInfo(
                                  confirmationDialog.transaction.sourceAccountId
                                )!
                              )
                            : '口座情報が見つかりません'}
                        </Typography>
                      </Grid>
                    )}
                    {confirmationDialog.transaction.destinationAccountId && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          振込先口座
                        </Typography>
                        <Typography variant="body1">
                          {getAccountInfo(
                            confirmationDialog.transaction.destinationAccountId
                          )
                            ? formatAccountDisplay(
                                getAccountInfo(
                                  confirmationDialog.transaction
                                    .destinationAccountId
                                )!
                              )
                            : '口座情報が見つかりません'}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        取引内容
                      </Typography>
                      <Typography variant="body1">
                        {confirmationDialog.transaction.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleConfirmDialogClose}
            variant="outlined"
            disabled={confirming !== null}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmTransaction}
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            disabled={confirming !== null}
          >
            確定実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionConfirmationScreen;
