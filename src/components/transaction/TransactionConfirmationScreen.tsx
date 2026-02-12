/**
 * 取引確定画面コンポーネント
 *
 * 確定準備完了取引の一覧表示、取引確定ボタンと処理結果表示、残高更新の表示を提供します。
 * また、当日確定済み取引の取消機能も提供します。
 * 要件: 6.1, 6.2, 6.3, 6.5, 9.1
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
  Cancel as CancelIcon,
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
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({ open: false, transaction: null });
  const [cancellationDialog, setCancellationDialog] = useState<{
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
      setError(''); // エラー状態をクリア

      // 確定準備完了取引と確定済み取引（当日のみ）、口座・顧客データを並行取得
      const [
        readyTransactions,
        confirmedTransactions,
        accountList,
        customerList,
      ] = await Promise.all([
        transactionService.getTransactionsReadyForConfirmation(),
        transactionService.getTransactionHistory({
          dateFrom: new Date(new Date().setHours(0, 0, 0, 0)),
          dateTo: new Date(new Date().setHours(23, 59, 59, 999)),
        }),
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

      // 確定準備完了取引と当日の確定済み取引を結合
      const allTransactions = [...readyTransactions, ...confirmedTransactions];

      // データを正常に設定（件数が0件でもエラーではない）
      setTransactions(allTransactions);
      setAccounts(accountsWithCustomer);

      // 正常に完了した場合はエラー状態をクリア
      setError('');
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      // 実際にエラーが発生した場合のみエラーメッセージを設定
      setError('データの読み込みに失敗しました。再度お試しください。');
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

  // 取消確認ダイアログを開く
  const handleCancelClick = (transaction: Transaction) => {
    setCancellationDialog({ open: true, transaction });
  };

  // 取消確認ダイアログを閉じる
  const handleCancelDialogClose = () => {
    setCancellationDialog({ open: false, transaction: null });
  };

  // 当日取引かどうかを判定
  const isSameDayTransaction = (transaction: Transaction): boolean => {
    const today = new Date();
    const transactionDate = new Date(
      transaction.confirmedAt || transaction.createdAt
    );
    return transactionDate.toDateString() === today.toDateString();
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

        // データを再読み込み（エラーが発生してもメイン処理の成功は維持）
        try {
          await loadData();
        } catch (reloadError) {
          console.warn(
            'データ再読み込みエラー（確定処理は正常完了）:',
            reloadError
          );
          // データ再読み込みエラーは警告レベルとし、確定処理の成功メッセージは維持
        }
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

  // 取引取消処理
  const handleCancelTransaction = async () => {
    const { transaction } = cancellationDialog;
    if (!transaction || !session?.userId) {
      setError('セッション情報が不正です。');
      return;
    }

    try {
      setCancelling(transaction.transactionId);
      setError('');

      // 取引取消実行
      const result = await transactionService.cancelTransaction(
        transaction.transactionId
      );

      if (result.success) {
        setConfirmationResults(prev => [
          ...prev,
          {
            transaction,
            result: {
              transactionId: transaction.transactionId,
              success: true,
              message: result.message || '取引が正常に取消されました。',
            },
            balanceChanges: [], // 取消時は残高変更情報は表示しない
          },
        ]);
        setShowResults(true);

        // データを再読み込み（エラーが発生してもメイン処理の成功は維持）
        try {
          await loadData();
        } catch (reloadError) {
          console.warn(
            'データ再読み込みエラー（取消処理は正常完了）:',
            reloadError
          );
          // データ再読み込みエラーは警告レベルとし、取消処理の成功メッセージは維持
        }
      } else {
        setError(result.message || '取引取消に失敗しました。');
      }
    } catch (error) {
      console.error('取引取消エラー:', error);
      setError('取引取消中にエラーが発生しました。');
    } finally {
      setCancelling(null);
      handleCancelDialogClose();
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
            <Typography variant="h6">取引確定・取消管理</Typography>
            <Chip
              label={`${transactions.length}件`}
              color="primary"
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            確定準備完了の取引は確定処理を、当日確定済みの取引は取消処理を行えます。
          </Typography>

          {transactions.length === 0 ? (
            <Alert severity="info">処理可能な取引はありません。</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>取引ID</TableCell>
                    <TableCell>状態</TableCell>
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
                    const isConfirmed = transaction.status === 'confirmed';
                    const canCancel =
                      isConfirmed && isSameDayTransaction(transaction);

                    return (
                      <TableRow key={transaction.transactionId}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {transaction.transactionId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isConfirmed ? '確定済み' : '確定準備完了'}
                            color={isConfirmed ? 'success' : 'warning'}
                            size="small"
                          />
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
                          <Box
                            sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
                          >
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
                            {!isConfirmed && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={
                                  confirming === transaction.transactionId ? (
                                    <CircularProgress
                                      size={16}
                                      color="inherit"
                                    />
                                  ) : (
                                    <CheckCircleIcon />
                                  )
                                }
                                onClick={() => handleConfirmClick(transaction)}
                                disabled={
                                  confirming === transaction.transactionId ||
                                  cancelling === transaction.transactionId
                                }
                              >
                                {confirming === transaction.transactionId
                                  ? '確定中...'
                                  : '確定'}
                              </Button>
                            )}
                            {canCancel && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={
                                  cancelling === transaction.transactionId ? (
                                    <CircularProgress
                                      size={16}
                                      color="inherit"
                                    />
                                  ) : (
                                    <CancelIcon />
                                  )
                                }
                                onClick={() => handleCancelClick(transaction)}
                                disabled={
                                  confirming === transaction.transactionId ||
                                  cancelling === transaction.transactionId
                                }
                              >
                                {cancelling === transaction.transactionId
                                  ? '取消中...'
                                  : '取消'}
                              </Button>
                            )}
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

      {/* 取消確認ダイアログ */}
      <Dialog
        open={cancellationDialog.open}
        onClose={handleCancelDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CancelIcon color="error" />
            <Typography variant="h6">取引取消の確認</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {cancellationDialog.transaction && (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                以下の取引を取消しますか？取消後は口座残高が元に戻り、取引は取消済み状態になります。
                <br />
                <strong>注意：この操作は元に戻すことができません。</strong>
              </DialogContentText>

              <Alert severity="warning" sx={{ mb: 3 }}>
                取引の取消は当日のみ可能です。取消後は口座残高が自動的に調整されます。
              </Alert>

              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        取引ID
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {cancellationDialog.transaction.transactionId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        取引タイプ
                      </Typography>
                      <Chip
                        label={getTransactionTypeLabel(
                          cancellationDialog.transaction.type
                        )}
                        color={getTransactionTypeColor(
                          cancellationDialog.transaction.type
                        )}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        金額
                      </Typography>
                      <Typography variant="h6" color="error">
                        ¥
                        {cancellationDialog.transaction.amount.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        確定日時
                      </Typography>
                      <Typography variant="body1">
                        {cancellationDialog.transaction.confirmedAt
                          ? new Date(
                              cancellationDialog.transaction.confirmedAt
                            ).toLocaleString('ja-JP')
                          : '未確定'}
                      </Typography>
                    </Grid>
                    {cancellationDialog.transaction.sourceAccountId && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          振込元口座
                        </Typography>
                        <Typography variant="body1">
                          {getAccountInfo(
                            cancellationDialog.transaction.sourceAccountId
                          )
                            ? formatAccountDisplay(
                                getAccountInfo(
                                  cancellationDialog.transaction.sourceAccountId
                                )!
                              )
                            : '口座情報が見つかりません'}
                        </Typography>
                      </Grid>
                    )}
                    {cancellationDialog.transaction.destinationAccountId && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          振込先口座
                        </Typography>
                        <Typography variant="body1">
                          {getAccountInfo(
                            cancellationDialog.transaction.destinationAccountId
                          )
                            ? formatAccountDisplay(
                                getAccountInfo(
                                  cancellationDialog.transaction
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
                        {cancellationDialog.transaction.description}
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
            onClick={handleCancelDialogClose}
            variant="outlined"
            disabled={cancelling !== null}
          >
            戻る
          </Button>
          <Button
            onClick={handleCancelTransaction}
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            disabled={cancelling !== null}
          >
            取消実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionConfirmationScreen;
