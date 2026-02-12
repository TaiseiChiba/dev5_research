/**
 * 口座詳細コンポーネント
 *
 * 口座詳細情報の表示
 * 要件: 3.2
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Account, AccountType, AccountStatus } from '../../types/account.js';
import { Customer } from '../../types/customer.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { generatePath, PATHS } from '../../constants/paths';

const AccountDetail: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  // 状態管理
  const [account, setAccount] = useState<Account | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // サービス取得
  const accountService = ServiceFactory.getInstance().getAccountService();
  const customerService = ServiceFactory.getInstance().getCustomerService();

  // 初期データ読み込み
  useEffect(() => {
    if (accountId) {
      loadAccountData();
    }
  }, [accountId]);

  /**
   * 口座データと関連顧客情報を読み込む
   */
  const loadAccountData = async () => {
    if (!accountId) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 口座詳細を取得
      const accountData = await accountService.getAccount(accountId);
      setAccount(accountData);

      // 関連顧客情報を取得
      const customerData = await customerService.getCustomer(
        accountData.customerId
      );
      setCustomer(customerData);
    } catch (err) {
      setError('口座情報の読み込みに失敗しました。');
      console.error('口座詳細読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 口座タイプの表示名を取得
   */
  const getAccountTypeLabel = (type: AccountType): string => {
    switch (type) {
      case AccountType.SAVINGS:
        return '普通預金';
      case AccountType.CHECKING:
        return '当座預金';
      case AccountType.FIXED_DEPOSIT:
        return '定期預金';
      default:
        return type;
    }
  };

  /**
   * 口座状態の表示名を取得
   */
  const getAccountStatusLabel = (status: AccountStatus): string => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return '有効';
      case AccountStatus.CLOSED:
        return '解約済み';
      case AccountStatus.SUSPENDED:
        return '停止中';
      default:
        return status;
    }
  };

  /**
   * 口座状態の色を取得
   */
  const getAccountStatusColor = (status: AccountStatus) => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return 'success';
      case AccountStatus.CLOSED:
        return 'default';
      case AccountStatus.SUSPENDED:
        return 'warning';
      default:
        return 'default';
    }
  };

  /**
   * 金額をフォーマット
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  /**
   * 日付をフォーマット
   */
  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);

    // 無効な日付をチェック
    if (isNaN(dateObj.getTime())) {
      return '無効な日付';
    }

    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  /**
   * 編集画面への遷移
   */
  const handleEdit = () => {
    if (accountId) {
      navigate(generatePath.accountEdit(accountId));
    }
  };

  /**
   * 一覧画面への戻り
   */
  const handleBack = () => {
    navigate(PATHS.ACCOUNT_LIST);
  };

  /**
   * 顧客詳細への遷移
   */
  const handleCustomerDetail = () => {
    if (customer) {
      navigate(generatePath.customerDetail(customer.customerId));
    }
  };

  /**
   * 口座解約の確認ダイアログを開く
   * 要件: 9.1 - 破壊的な操作を実行する際、システムは処理を進める前に確認ダイアログを表示すること
   */
  const handleCloseClick = () => {
    setCloseDialogOpen(true);
  };

  /**
   * 口座解約の確認ダイアログを閉じる
   */
  const handleCloseCancel = () => {
    setCloseDialogOpen(false);
  };

  /**
   * 口座解約の実行
   * 要件: 3.3 - 口座を解約する際、システムは残高がゼロであることを確認し、口座を解約済みとしてマークすること
   * 要件: 9.2 - 操作が正常に完了した際、システムは明確な成功メッセージを表示すること
   * 要件: 9.3 - エラーが発生した際、システムは解決のためのガイダンス付きの具体的なエラーメッセージを表示すること
   */
  const handleCloseConfirm = async () => {
    if (!accountId) return;

    setClosing(true);
    setError('');

    try {
      const result = await accountService.closeAccount(accountId);

      if (result.success) {
        // 解約成功 - 一覧画面に戻る
        navigate(PATHS.ACCOUNT_LIST, {
          state: { message: '口座が正常に解約されました。' },
        });
      } else {
        // 解約失敗 - エラーメッセージを表示
        setError(result.message || '口座の解約に失敗しました。');
        setCloseDialogOpen(false);
      }
    } catch (err) {
      setError('口座の解約に失敗しました。');
      console.error('口座解約エラー:', err);
      setCloseDialogOpen(false);
    } finally {
      setClosing(false);
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
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          一覧に戻る
        </Button>
      </Box>
    );
  }

  if (!account) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          口座が見つかりません。
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          一覧に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={handleBack} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" color="primary">
            口座詳細
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {account.status === AccountStatus.ACTIVE && (
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={handleCloseClick}
              color="error"
              disabled={closing}
            >
              解約
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            color="primary"
          >
            編集
          </Button>
        </Box>
      </Box>

      {/* 口座基本情報 */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6" color="primary">
              口座情報
            </Typography>
            <Chip
              label={getAccountStatusLabel(account.status)}
              color={getAccountStatusColor(account.status) as any}
              variant={
                account.status === AccountStatus.ACTIVE ? 'filled' : 'outlined'
              }
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                口座ID
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {account.accountId}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                口座番号
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {account.accountNumber}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                口座種別
              </Typography>
              <Typography variant="body1">
                {getAccountTypeLabel(account.accountType)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                口座状態
              </Typography>
              <Chip
                label={getAccountStatusLabel(account.status)}
                size="small"
                color={getAccountStatusColor(account.status) as any}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                現在残高
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={account.balance >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(account.balance)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                開設日時
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(account.createdAt)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                最終更新日時
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(account.updatedAt)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 口座名義人情報 */}
      {customer && (
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <PersonIcon color="primary" />
              <Typography variant="h6" color="primary">
                口座名義人
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleCustomerDetail}
              >
                詳細表示
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  顧客番号
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {customer.customerId}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  氏名・法人名
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {customer.name}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  カナ
                </Typography>
                <Typography variant="body1">{customer.phoneticName}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  顧客区分
                </Typography>
                <Typography variant="body1">
                  {customer.customerType === 'INDIVIDUAL' ? '個人' : '法人'}
                </Typography>
              </Grid>

              {customer.contactInfo.email && (
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    メールアドレス
                  </Typography>
                  <Typography variant="body1">
                    {customer.contactInfo.email}
                  </Typography>
                </Grid>
              )}

              {customer.contactInfo.phone && (
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    電話番号
                  </Typography>
                  <Typography variant="body1">
                    {customer.contactInfo.phone}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 解約確認ダイアログ */}
      <Dialog
        open={closeDialogOpen}
        onClose={handleCloseCancel}
        aria-labelledby="close-dialog-title"
        aria-describedby="close-dialog-description"
      >
        <DialogTitle id="close-dialog-title" color="error">
          口座解約の確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="close-dialog-description">
            この口座を解約してもよろしいですか？
            <br />
            <br />
            <strong>口座番号:</strong> {account?.accountNumber}
            <br />
            <strong>口座種別:</strong>{' '}
            {account && getAccountTypeLabel(account.accountType)}
            <br />
            <strong>現在残高:</strong>{' '}
            {account && formatCurrency(account.balance)}
            <br />
            <br />
            この操作は取り消すことができません。
            {account && account.balance !== 0 && (
              <>
                <br />
                <br />
                <Alert severity="warning" sx={{ mt: 2 }}>
                  残高がゼロではありません。解約する前に残高を調整してください。
                </Alert>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancel} disabled={closing}>
            キャンセル
          </Button>
          <Button
            onClick={handleCloseConfirm}
            color="error"
            variant="contained"
            disabled={closing || (account && account.balance !== 0)}
          >
            {closing ? '解約中...' : '解約'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountDetail;
