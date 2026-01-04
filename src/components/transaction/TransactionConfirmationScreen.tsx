/**
 * ワークフロー対応取引確認画面コンポーネント
 *
 * ワークフロー順序制御を統合した取引確認画面です。
 * 要件: 4.6, 4.7, 10.3 - 取引確認とワークフロー順序制御
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TransactionType,
  TransactionInput as TransactionInputData,
} from '../../types/transaction.js';
import { AccountWithCustomer } from '../../types/account.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { PATHS } from '../../constants/paths.js';
import { useTransactionWorkflowGuard } from '../../hooks/useWorkflowGuard.js';
import { WorkflowProgressIndicator } from '../workflow/WorkflowProgressIndicator.js';
import { WorkflowNavigation } from '../workflow/WorkflowNavigation.js';
import { useNavigation } from '../../contexts/NavigationContext.js';

interface TransactionConfirmationScreenProps {
  session?: { userId: string; userRole: string };
}

interface TransactionConfirmationData {
  transactionId?: string;
  type: TransactionType;
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount: number;
  description: string;
  transactionDate: Date;
  sourceAccount?: AccountWithCustomer;
  destinationAccount?: AccountWithCustomer;
}

const TransactionConfirmationScreen: React.FC<
  TransactionConfirmationScreenProps
> = ({ session }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateWithData, setBreadcrumbs, getNavigationData } =
    useNavigation();

  const transactionService =
    ServiceFactory.getInstance().getTransactionService();
  const accountService = ServiceFactory.getInstance().getAccountService();
  const customerService = ServiceFactory.getInstance().getCustomerService();

  // ワークフロー制御
  const {
    progress,
    isTransitionAllowed,
    blockReason,
    suggestedPath,
    navigateToCorrectPath,
  } = useTransactionWorkflowGuard();

  // 状態管理
  const [transactionData, setTransactionData] =
    useState<TransactionConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [workflowBlockDialogOpen, setWorkflowBlockDialogOpen] = useState(false);

  // パンくずナビゲーション設定
  useEffect(() => {
    setBreadcrumbs([
      { label: 'ダッシュボード', path: PATHS.DASHBOARD },
      { label: '取引入力', path: PATHS.TRANSACTION_INPUT },
      { label: '取引確認', isActive: true },
    ]);
  }, [setBreadcrumbs]);

  // ワークフロー制御チェック
  useEffect(() => {
    if (!isTransitionAllowed && blockReason) {
      setWorkflowBlockDialogOpen(true);
    }
  }, [isTransitionAllowed, blockReason]);

  // 取引データの取得と口座情報の解決
  useEffect(() => {
    const loadTransactionData = async () => {
      try {
        setLoading(true);

        console.log('=== TransactionConfirmationScreen データ取得開始 ===');

        // URLパラメータから取引IDを取得
        const urlParams = new URLSearchParams(location.search);
        const transactionIdFromUrl = urlParams.get('transactionId');

        // NavigationContextから直接データを取得
        const navigationData = getNavigationData<TransactionInputData>();
        console.log('navigationData from context:', navigationData);

        // location.stateからも取得を試行
        const stateData = location.state as {
          transactionData?: TransactionInputData;
          navigationData?: TransactionInputData;
          transactionId?: string;
        };
        console.log('location.state:', location.state);

        // データの優先順位: NavigationContext > location.state > URLパラメータ
        let inputData: TransactionInputData | undefined =
          navigationData ||
          stateData?.navigationData ||
          stateData?.transactionData;

        const transactionId = stateData?.transactionId || transactionIdFromUrl;

        console.log('最終的な inputData:', inputData);
        console.log('transactionId:', transactionId);

        // NavigationContextにデータがない場合、取引IDから詳細を取得
        if (!inputData && transactionId) {
          console.log('取引IDから詳細データを取得:', transactionId);

          try {
            const transactionDetail =
              await transactionService.getTransactionDetail(transactionId);
            console.log('取得した取引詳細:', transactionDetail);

            // Transaction型からTransactionInputData型に変換
            inputData = {
              type: transactionDetail.type,
              sourceAccountId: transactionDetail.sourceAccountId,
              destinationAccountId: transactionDetail.destinationAccountId,
              amount: transactionDetail.amount,
              description: transactionDetail.description,
              transactionDate: transactionDetail.createdAt,
              transactionId: transactionDetail.transactionId,
            } as TransactionInputData & { transactionId: string };
          } catch (apiError) {
            console.error('取引詳細の取得に失敗:', apiError);
            setError('取引詳細の取得に失敗しました。');
            return;
          }
        }

        if (!inputData) {
          console.error('取引データが見つかりません');
          setError(
            '取引データが見つかりません。取引検証画面から対象の取引を選択してください。'
          );
          return;
        }

        console.log('Loading transaction data:', inputData);

        // 口座一覧と顧客一覧を取得
        const [accountList, customerList] = await Promise.all([
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

        // 関連口座を検索
        const sourceAccount = inputData.sourceAccountId
          ? accountsWithCustomer.find(
              acc => acc.accountId === inputData.sourceAccountId
            )
          : undefined;

        const destinationAccount = inputData.destinationAccountId
          ? accountsWithCustomer.find(
              acc => acc.accountId === inputData.destinationAccountId
            )
          : undefined;

        // transactionDateがstringの場合はDateに変換
        const transactionDate =
          inputData.transactionDate instanceof Date
            ? inputData.transactionDate
            : inputData.transactionDate
              ? new Date(inputData.transactionDate)
              : new Date();

        setTransactionData({
          transactionId: (inputData as any).transactionId,
          type: inputData.type,
          sourceAccountId: inputData.sourceAccountId,
          destinationAccountId: inputData.destinationAccountId,
          amount: inputData.amount,
          description: inputData.description,
          transactionDate,
          sourceAccount,
          destinationAccount,
        });
      } catch (error) {
        console.error('取引データの読み込みに失敗しました:', error);
        setError('取引データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    loadTransactionData();
  }, [getNavigationData, location.state, accountService, customerService]);

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

  // 口座表示フォーマット
  const formatAccountDisplay = (account: AccountWithCustomer): string => {
    return `${account.customerName}：${account.accountNumber} (残高: ¥${account.balance.toLocaleString()})`;
  };

  // 修正ボタンのハンドラー
  const handleModify = () => {
    // 取引入力画面に戻る（データを引き継ぎ）
    navigateWithData(PATHS.TRANSACTION_INPUT, { transactionData });
  };

  // キャンセルボタンのハンドラー
  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  // キャンセル確認ダイアログの処理
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    navigate(PATHS.TRANSACTIONS);
  };

  // ワークフローブロックダイアログの処理
  const handleWorkflowBlockConfirm = () => {
    setWorkflowBlockDialogOpen(false);
    if (suggestedPath) {
      navigateToCorrectPath();
    }
  };

  // 確認ボタンのハンドラー（取引確定処理）
  const handleConfirm = async () => {
    if (!transactionData || !session?.userId) {
      setError('セッション情報が不正です。再ログインしてください。');
      return;
    }

    // ワークフロー制御チェック
    if (!isTransitionAllowed) {
      setWorkflowBlockDialogOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // 既存の検証済み取引を確定する
      if (transactionData.transactionId) {
        console.log(
          'Confirming existing transaction:',
          transactionData.transactionId
        );
        const result = await transactionService.confirmTransaction(
          transactionData.transactionId,
          session.userId
        );
        console.log('Transaction confirmed successfully:', result);

        setSuccessMessage(
          `取引が正常に確定されました。取引ID: ${transactionData.transactionId}`
        );
      } else {
        // 新規取引作成（従来の処理）
        const inputData: TransactionInputData = {
          type: transactionData.type,
          sourceAccountId: transactionData.sourceAccountId,
          destinationAccountId: transactionData.destinationAccountId,
          amount: transactionData.amount,
          description: transactionData.description,
          transactionDate: transactionData.transactionDate,
        };

        console.log('Creating new transaction:', inputData);
        const result = await transactionService.createTransaction(
          inputData,
          session.userId
        );
        console.log('Transaction created successfully:', result);

        setSuccessMessage(
          `取引が正常に作成されました。取引ID: ${result.transactionId}`
        );
      }

      // 3秒後に検証画面に遷移
      setTimeout(() => {
        navigateWithData(PATHS.TRANSACTION_VERIFICATION);
      }, 3000);
    } catch (error) {
      console.error('取引処理エラー:', error);
      setError(
        error instanceof Error ? error.message : '取引の処理に失敗しました。'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>取引データを読み込み中...</Typography>
      </Box>
    );
  }

  if (!transactionData) {
    return (
      <Box
        sx={{
          maxWidth: 800,
          mx: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          取引最終確認
        </Typography>

        <Alert severity="info" sx={{ mb: 3, width: '100%' }}>
          {error ||
            '確定対象の取引が選択されていません。取引検証画面から確定対象の取引を選択してください。'}
        </Alert>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(PATHS.DASHBOARD)}>
            ダッシュボードに戻る
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(PATHS.TRANSACTION_FINAL_CONFIRMATION)}
          >
            取引検証画面へ
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        p: 3,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ textAlign: 'center', mb: 3 }}
        >
          取引内容確認（最終確認）
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, textAlign: 'center' }}
        >
          以下の内容で取引を作成します。内容をご確認ください。
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
            {successMessage}
          </Alert>
        )}

        <Card sx={{ mb: 3, width: '100%', maxWidth: 800 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ mr: 2 }}>
                取引タイプ
              </Typography>
              <Chip
                label={getTransactionTypeLabel(transactionData.type)}
                color={getTransactionTypeColor(transactionData.type)}
                size="medium"
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableBody>
                  {/* 振込元口座（振込・出金の場合） */}
                  {(transactionData.type === TransactionType.TRANSFER ||
                    transactionData.type === TransactionType.WITHDRAWAL) && (
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontWeight: 'bold', width: '200px' }}
                      >
                        {transactionData.type === TransactionType.TRANSFER
                          ? '振込元口座'
                          : '出金元口座'}
                      </TableCell>
                      <TableCell>
                        {transactionData.sourceAccount
                          ? formatAccountDisplay(transactionData.sourceAccount)
                          : '口座情報が見つかりません'}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* 振込先口座（振込・入金の場合） */}
                  {(transactionData.type === TransactionType.TRANSFER ||
                    transactionData.type === TransactionType.DEPOSIT) && (
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {transactionData.type === TransactionType.TRANSFER
                          ? '振込先口座'
                          : '入金先口座'}
                      </TableCell>
                      <TableCell>
                        {transactionData.destinationAccount
                          ? formatAccountDisplay(
                              transactionData.destinationAccount
                            )
                          : '口座情報が見つかりません'}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* 金額 */}
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: 'bold' }}
                    >
                      金額
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" color="primary">
                        ¥{transactionData.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* 取引日 */}
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: 'bold' }}
                    >
                      取引日
                    </TableCell>
                    <TableCell>
                      {transactionData.transactionDate.toLocaleDateString(
                        'ja-JP',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long',
                        }
                      )}
                    </TableCell>
                  </TableRow>

                  {/* 取引内容 */}
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: 'bold', verticalAlign: 'top' }}
                    >
                      取引内容
                    </TableCell>
                    <TableCell>
                      <Typography
                        component="pre"
                        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                      >
                        {transactionData.description}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={submitting}
              size="large"
            >
              キャンセル
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={handleModify}
              disabled={submitting}
              size="large"
            >
              修正
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={submitting || !isTransitionAllowed}
              size="large"
            >
              {submitting
                ? '処理中...'
                : transactionData?.transactionId
                  ? '取引確定'
                  : '確認・取引作成'}
            </Button>
          </Grid>
        </Grid>

        {/* ワークフロー情報 */}
        {progress && (
          <Box sx={{ mt: 3, width: '100%' }}>
            <WorkflowProgressIndicator
              progress={progress}
              variant="compact"
              showActions={false}
            />
          </Box>
        )}

        {progress && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <WorkflowNavigation
              progress={progress}
              currentPath={location.pathname}
              onNavigate={path => navigateWithData(path)}
            />
          </Box>
        )}
      </Box>

      {/* キャンセル確認ダイアログ */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">取引のキャンセル</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            取引をキャンセルしますか？入力した内容は保存されません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="primary">
            戻る
          </Button>
          <Button onClick={handleCancelConfirm} color="secondary" autoFocus>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>

      {/* ワークフローブロックダイアログ */}
      <Dialog
        open={workflowBlockDialogOpen}
        onClose={() => setWorkflowBlockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ワークフロー制御</DialogTitle>
        <DialogContent>
          <DialogContentText>{blockReason}</DialogContentText>
          {suggestedPath && (
            <Alert severity="info" sx={{ mt: 2 }}>
              推奨される操作: 適切な画面に移動してください
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowBlockDialogOpen(false)}>
            キャンセル
          </Button>
          {suggestedPath && (
            <Button onClick={handleWorkflowBlockConfirm} variant="contained">
              適切な画面に移動
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionConfirmationScreen;
