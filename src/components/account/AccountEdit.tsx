/**
 * 口座編集コンポーネント
 *
 * 口座情報編集フォーム
 * 要件: 3.2
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  Account,
  AccountType,
  AccountStatus,
  AccountData,
} from '../../types/account.js';
import { Customer } from '../../types/customer.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { generatePath } from '../../constants/paths.js';

interface FormData {
  accountType: AccountType;
  status: AccountStatus;
}

interface FormErrors {
  accountType?: string;
  status?: string;
}

const AccountEdit: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  // 状態管理
  const [account, setAccount] = useState<Account | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    accountType: AccountType.SAVINGS,
    status: AccountStatus.ACTIVE,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

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
   * 口座データを読み込む
   */
  const loadAccountData = async () => {
    if (!accountId) return;

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

      // フォームデータを初期化
      setFormData({
        accountType: accountData.accountType,
        status: accountData.status,
      });
    } catch (err) {
      setError('口座情報の読み込みに失敗しました。');
      console.error('口座詳細読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * フォーム入力値の変更ハンドラ
   */
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * フォームバリデーション
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 必須項目チェック
    if (!formData.accountType) {
      newErrors.accountType = '口座種別は必須です。';
    }

    if (!formData.status) {
      newErrors.status = '口座状態は必須です。';
    }

    // ビジネスルールチェック
    if (
      account &&
      account.balance !== 0 &&
      formData.status === AccountStatus.CLOSED
    ) {
      newErrors.status = '残高がゼロでない口座は解約できません。';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * フォーム送信ハンドラ
   * 要件: 3.2 - 口座情報を変更する際、システムは変更を検証し、口座状態を適切に更新すること
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!accountId) {
      setError('口座IDが不正です。');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const updateData: Partial<AccountData> = {
        accountType: formData.accountType,
        // 注意: statusは通常AccountDataには含まれないが、更新用に拡張
      };

      // 口座状態の更新も含める（実際のAPIでは別エンドポイントの可能性もある）
      const updatedAccount = await accountService.updateAccount(accountId, {
        ...updateData,
        status: formData.status,
      } as any);

      setAccount(updatedAccount);
      setSuccessMessage('口座情報が正常に更新されました。');

      // 2秒後に詳細画面に戻る
      setTimeout(() => {
        navigate(generatePath.accountDetail(accountId));
      }, 2000);
    } catch (err) {
      setError('口座情報の更新に失敗しました。');
      console.error('口座更新エラー:', err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * キャンセルハンドラ
   */
  const handleCancel = () => {
    if (accountId) {
      navigate(generatePath.accountDetail(accountId));
    }
  };

  /**
   * 戻るハンドラ
   */
  const handleBack = () => {
    if (accountId) {
      navigate(generatePath.accountDetail(accountId));
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

  if (error && !account) {
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
          戻る
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
          戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={handleBack} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" color="primary">
          口座編集
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {account.accountNumber}
        </Typography>
      </Box>

      {/* 成功メッセージ */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 口座基本情報（読み取り専用） */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6" color="primary">
              口座基本情報
            </Typography>
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
          </Grid>
        </CardContent>
      </Card>

      {/* 口座名義人情報（読み取り専用） */}
      {customer && (
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <PersonIcon color="primary" />
              <Typography variant="h6" color="primary">
                口座名義人
              </Typography>
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
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 編集フォーム */}
      <Card elevation={2}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom color="primary">
              編集可能項目
            </Typography>

            <Grid container spacing={3}>
              {/* 口座種別 */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>口座種別</InputLabel>
                  <Select
                    value={formData.accountType}
                    label="口座種別"
                    onChange={e =>
                      handleInputChange('accountType', e.target.value)
                    }
                    error={!!errors.accountType}
                    disabled={saving}
                  >
                    <MenuItem value={AccountType.SAVINGS}>
                      {getAccountTypeLabel(AccountType.SAVINGS)}
                    </MenuItem>
                    <MenuItem value={AccountType.CHECKING}>
                      {getAccountTypeLabel(AccountType.CHECKING)}
                    </MenuItem>
                    <MenuItem value={AccountType.FIXED_DEPOSIT}>
                      {getAccountTypeLabel(AccountType.FIXED_DEPOSIT)}
                    </MenuItem>
                  </Select>
                  {errors.accountType && (
                    <Typography variant="caption" color="error">
                      {errors.accountType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* 口座状態 */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>口座状態</InputLabel>
                  <Select
                    value={formData.status}
                    label="口座状態"
                    onChange={e => handleInputChange('status', e.target.value)}
                    error={!!errors.status}
                    disabled={saving}
                  >
                    <MenuItem value={AccountStatus.ACTIVE}>
                      {getAccountStatusLabel(AccountStatus.ACTIVE)}
                    </MenuItem>
                    <MenuItem value={AccountStatus.SUSPENDED}>
                      {getAccountStatusLabel(AccountStatus.SUSPENDED)}
                    </MenuItem>
                    <MenuItem
                      value={AccountStatus.CLOSED}
                      disabled={account.balance !== 0}
                    >
                      {getAccountStatusLabel(AccountStatus.CLOSED)}
                      {account.balance !== 0 &&
                        ' (残高がゼロでないため選択不可)'}
                    </MenuItem>
                  </Select>
                  {errors.status && (
                    <Typography variant="caption" color="error">
                      {errors.status}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            {/* 注意事項 */}
            <Box mt={3}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>注意事項:</strong>
                  <br />
                  • 口座番号や顧客情報は変更できません
                  <br />
                  • 残高がゼロでない口座は解約できません
                  <br />• 口座状態の変更は慎重に行ってください
                </Typography>
              </Alert>
            </Box>

            {/* アクションボタン */}
            <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccountEdit;
