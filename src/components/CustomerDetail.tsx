/**
 * 顧客詳細コンポーネント
 *
 * 顧客詳細情報の表示と関連口座の表示
 * 要件: 2.6
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Customer, CustomerType } from '../types/customer';
import { Account, AccountType, AccountStatus } from '../types/account';
import { ServiceFactory } from '../services/serviceFactory';
import { generatePath, PATHS } from '../constants/paths';

const CustomerDetail: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  // 状態管理
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // サービス取得
  const customerService = ServiceFactory.getInstance().getCustomerService();
  const accountService = ServiceFactory.getInstance().getAccountService();

  // 初期データ読み込み
  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  /**
   * 顧客データと関連口座を読み込む
   */
  const loadCustomerData = async () => {
    if (!customerId) return;

    setLoading(true);
    setError('');

    try {
      // 顧客詳細を取得
      const customerData = await customerService.getCustomer(customerId);
      setCustomer(customerData);

      // 関連口座を取得
      const accountsData =
        await accountService.getAccountsByCustomer(customerId);
      setAccounts(accountsData);
    } catch (err) {
      setError('顧客情報の読み込みに失敗しました。');
      console.error('顧客詳細読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 顧客タイプの表示名を取得
   */
  const getCustomerTypeLabel = (type: CustomerType): string => {
    return type === CustomerType.INDIVIDUAL ? '個人' : '法人';
  };

  /**
   * 顧客タイプのアイコンを取得
   */
  const getCustomerTypeIcon = (type: CustomerType) => {
    return type === CustomerType.INDIVIDUAL ? <PersonIcon /> : <BusinessIcon />;
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
      case AccountType.LOAN:
        return 'ローン';
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
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  /**
   * 編集画面への遷移
   */
  const handleEdit = () => {
    if (customerId) {
      navigate(generatePath.customerEdit(customerId));
    }
  };

  /**
   * 一覧画面への戻り
   */
  const handleBack = () => {
    navigate(PATHS.CUSTOMER_LIST);
  };

  /**
   * 口座詳細への遷移
   */
  const handleAccountDetail = (accountId: string) => {
    navigate(generatePath.accountDetail(accountId));
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

  if (!customer) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          顧客が見つかりません。
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
            顧客詳細
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          color="primary"
        >
          編集
        </Button>
      </Box>

      {/* 顧客基本情報 */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Typography variant="h6" color="primary">
              基本情報
            </Typography>
            <Chip
              icon={getCustomerTypeIcon(customer.customerType)}
              label={getCustomerTypeLabel(customer.customerType)}
              color={
                customer.customerType === CustomerType.INDIVIDUAL
                  ? 'primary'
                  : 'secondary'
              }
              variant="outlined"
            />
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
                {getCustomerTypeLabel(customer.customerType)}
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

            {customer.contactInfo.address && (
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  住所
                </Typography>
                <Typography variant="body1">
                  {customer.contactInfo.postalCode && (
                    <>〒{customer.contactInfo.postalCode} </>
                  )}
                  {customer.contactInfo.address}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                登録日時
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(customer.createdAt)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                更新日時
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(customer.updatedAt)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 関連口座一覧 */}
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6" color="primary">
              関連口座一覧
            </Typography>
            <Chip
              label={`${accounts.length}件`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {accounts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                この顧客に関連する口座はありません。
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>口座番号</TableCell>
                    <TableCell>口座種別</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell align="right">残高</TableCell>
                    <TableCell>開設日</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map(account => (
                    <TableRow key={account.accountId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {account.accountNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getAccountTypeLabel(account.accountType)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getAccountStatusLabel(account.status)}
                          size="small"
                          color={getAccountStatusColor(account.status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={
                            account.balance >= 0 ? 'text.primary' : 'error'
                          }
                        >
                          {formatCurrency(account.balance)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(account.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="口座詳細">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              handleAccountDetail(account.accountId)
                            }
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerDetail;
