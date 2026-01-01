/**
 * 口座開設コンポーネント
 *
 * 新規口座開設フォーム
 * 要件: 3.1, 8.1, 9.1
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Autocomplete,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { AccountType, AccountData } from '../../types/account.js';
import { Customer, CustomerType } from '../../types/customer.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { generatePath, PATHS } from '../../constants/paths.js';

interface FormData {
  customerId: string;
  accountType: AccountType;
  initialBalance: number;
}

interface FormErrors {
  customerId?: string;
  accountType?: string;
  initialBalance?: string;
}

const AccountCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 状態管理
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    accountType: AccountType.SAVINGS,
    initialBalance: 0,
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
    loadCustomers();
  }, []);

  // URLパラメータから顧客IDを取得して初期設定
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.customerId === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerId: customerId,
        }));
      }
    }
  }, [searchParams, customers]);

  /**
   * 顧客一覧を読み込む
   */
  const loadCustomers = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await customerService.listCustomers({
        page: 1,
        limit: 1000, // 全顧客を取得
      });

      // 削除されていない顧客のみをフィルタリング
      const activeCustomers = result.data.filter(
        customer => !customer.isDeleted
      );
      setCustomers(activeCustomers);
    } catch (err) {
      setError('顧客一覧の読み込みに失敗しました。');
      console.error('顧客一覧読み込みエラー:', err);
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
   * 顧客選択の変更ハンドラ
   */
  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    handleInputChange('customerId', customer?.customerId || '');
  };

  /**
   * フォームバリデーション
   * 要件: 8.1 - 必須フィールドが空の際、システムはフォーム送信を防止し、不足フィールドをハイライトすること
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 必須項目チェック
    if (!formData.customerId) {
      newErrors.customerId = '顧客の選択は必須です。';
    }

    if (!formData.accountType) {
      newErrors.accountType = '口座種別は必須です。';
    }

    // 初期残高の検証
    if (formData.initialBalance < 0) {
      newErrors.initialBalance = '初期残高は0以上である必要があります。';
    }

    // 初期残高の上限チェック（例：1億円）
    const maxInitialBalance = 100000000;
    if (formData.initialBalance > maxInitialBalance) {
      newErrors.initialBalance = `初期残高は${maxInitialBalance.toLocaleString()}円以下である必要があります。`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * フォーム送信ハンドラ
   * 要件: 3.1 - 新規口座を開設する際、システムは顧客選択を必須とし、一意の口座番号を割り当てること
   * 要件: 9.1 - 破壊的な操作を実行する際、システムは処理を進める前に確認ダイアログを表示すること
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const accountData: AccountData = {
        customerId: formData.customerId,
        accountType: formData.accountType,
        initialBalance: formData.initialBalance,
      };

      const newAccount = await accountService.openAccount(accountData);

      setSuccessMessage('口座が正常に開設されました。');

      // 2秒後に口座詳細画面に遷移
      setTimeout(() => {
        navigate(generatePath.accountDetail(newAccount.accountId));
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '口座開設に失敗しました。');
      console.error('口座開設エラー:', err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * キャンセルハンドラ
   */
  const handleCancel = () => {
    navigate(PATHS.ACCOUNT_LIST);
  };

  /**
   * 戻るハンドラ
   */
  const handleBack = () => {
    navigate(PATHS.ACCOUNT_LIST);
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
   * 顧客タイプの表示名を取得
   */
  const getCustomerTypeLabel = (type: CustomerType): string => {
    switch (type) {
      case CustomerType.INDIVIDUAL:
        return '個人';
      case CustomerType.CORPORATE:
        return '法人';
      default:
        return type;
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

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={handleBack} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" color="primary">
          新規口座開設
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

      {/* 口座開設フォーム */}
      <Card elevation={2}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <AccountBalanceIcon color="primary" />
              <Typography variant="h6" color="primary">
                口座開設情報
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* 顧客選択 */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" color="primary">
                    口座名義人選択
                  </Typography>
                  <Typography variant="body2" color="error">
                    ※必須
                  </Typography>
                </Box>

                <Autocomplete
                  options={customers}
                  getOptionLabel={customer =>
                    `${customer.name} (${customer.customerId}) - ${getCustomerTypeLabel(customer.customerType)}`
                  }
                  value={selectedCustomer}
                  onChange={(_, newValue) => handleCustomerChange(newValue)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="顧客を選択してください"
                      required
                      error={!!errors.customerId}
                      helperText={errors.customerId}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, customer) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.customerId} -{' '}
                          {getCustomerTypeLabel(customer.customerType)}
                        </Typography>
                        {customer.contactInfo.email && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {customer.contactInfo.email}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                  disabled={saving}
                  noOptionsText="該当する顧客が見つかりません"
                  loadingText="読み込み中..."
                />
              </Grid>
              {/* 選択された顧客の詳細表示 */}
              {selectedCustomer && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Typography
                        variant="subtitle2"
                        color="primary"
                        gutterBottom
                      >
                        選択された顧客情報
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            顧客番号
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedCustomer.customerId}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            氏名・法人名
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedCustomer.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            カナ
                          </Typography>
                          <Typography variant="body2">
                            {selectedCustomer.phoneticName}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            顧客区分
                          </Typography>
                          <Typography variant="body2">
                            {getCustomerTypeLabel(
                              selectedCustomer.customerType
                            )}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

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

              {/* 初期残高 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="初期残高"
                  type="number"
                  value={formData.initialBalance}
                  onChange={e =>
                    handleInputChange(
                      'initialBalance',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  error={!!errors.initialBalance}
                  helperText={errors.initialBalance}
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">¥</InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    step: 1,
                  }}
                />
              </Grid>

              {/* 初期残高のプレビュー */}
              {formData.initialBalance > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>初期残高:</strong>{' '}
                      {formatCurrency(formData.initialBalance)}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>

            {/* 注意事項 */}
            <Box mt={3}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>口座開設に関する注意事項:</strong>
                  <br />
                  • 顧客の選択は必須です
                  <br />
                  • 口座番号は自動的に割り当てられます
                  <br />
                  • 初期残高は0円以上で設定してください
                  <br />
                  • 口座開設後は口座番号や名義人の変更はできません
                  <br />• 開設された口座は即座に有効になります
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
                disabled={saving || !selectedCustomer}
              >
                {saving ? '開設中...' : '口座開設'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccountCreate;
