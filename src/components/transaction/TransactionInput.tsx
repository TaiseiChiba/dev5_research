/**
 * 取引入力コンポーネント
 *
 * 振込・入金・出金取引の入力フォームを提供します。
 * 要件: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Autocomplete,
  InputAdornment,
  Divider,
  FormHelperText,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TransactionType,
  TransactionInput as TransactionInputData,
} from '../../types/transaction.js';
import { AccountWithCustomer } from '../../types/account.js';
import { Customer } from '../../types/customer.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { PATHS } from '../../constants/paths.js';
import {
  validateTransactionForm,
  validateAmount,
  validateDescription,
  validateTransactionDate,
  debounce,
  ValidationErrors,
} from '../../utils/transactionValidation.js';
import { useTransactionTransition } from '../../hooks/useScreenTransition.js';
import { useNavigation } from '../../contexts/NavigationContext.js';
import { useTransactionWorkflowGuard } from '../../hooks/useWorkflowGuard.js';
import { WorkflowProgressIndicator } from '../workflow/WorkflowProgressIndicator.js';

interface TransactionInputProps {
  session?: { userId: string; userRole: string };
}

interface FormData {
  type: TransactionType;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  description: string;
  transactionDate: string;
}

interface FormErrors {
  type?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount?: string;
  description?: string;
  transactionDate?: string;
  general?: string;
}

interface TransactionConfirmationData {
  type: TransactionType;
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount: number;
  description: string;
  transactionDate: Date;
}

const TransactionInput: React.FC<TransactionInputProps> = ({ session }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateWithData, setBreadcrumbs, getNavigationData } =
    useNavigation();

  // ワークフロー制御
  const { progress, isTransitionAllowed, blockReason } =
    useTransactionWorkflowGuard();

  const transactionService =
    ServiceFactory.getInstance().getTransactionService();
  const accountService = ServiceFactory.getInstance().getAccountService();
  const customerService = ServiceFactory.getInstance().getCustomerService();

  // フォームデータの初期化（確認画面からの戻りデータを考慮）
  const [formData, setFormData] = useState<FormData>(() => {
    // NavigationContextから戻りデータを取得
    const navigationData = getNavigationData<TransactionConfirmationData>();
    if (navigationData) {
      return {
        type: navigationData.type as TransactionType,
        sourceAccountId: navigationData.sourceAccountId || '',
        destinationAccountId: navigationData.destinationAccountId || '',
        amount: navigationData.amount.toString(),
        description: navigationData.description,
        transactionDate: new Date(navigationData.transactionDate || new Date())
          .toISOString()
          .split('T')[0],
      };
    }

    // location.stateからの戻りデータ（従来の方法）
    const stateData = location.state as {
      transactionData?: TransactionConfirmationData;
    };

    if (stateData?.transactionData) {
      const data = stateData.transactionData;
      return {
        type: data.type,
        sourceAccountId: data.sourceAccountId || '',
        destinationAccountId: data.destinationAccountId || '',
        amount: data.amount.toString(),
        description: data.description,
        transactionDate: data.transactionDate.toISOString().split('T')[0],
      };
    }

    return {
      type: TransactionType.TRANSFER,
      sourceAccountId: '',
      destinationAccountId: '',
      amount: '',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
    };
  });

  // 状態管理
  const [accounts, setAccounts] = useState<AccountWithCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [realTimeErrors, setRealTimeErrors] = useState<ValidationErrors>({});

  // リアルタイム検証のデバウンス関数
  const debouncedValidateAmount = useCallback(
    debounce((amount: string) => {
      if (amount) {
        const validation = validateAmount(amount);
        setRealTimeErrors(prev => ({
          ...prev,
          amount: validation.isValid ? undefined : validation.message,
        }));
      } else {
        setRealTimeErrors(prev => ({ ...prev, amount: undefined }));
      }
    }, 500),
    []
  );

  const debouncedValidateDescription = useCallback(
    debounce((description: string) => {
      if (description) {
        const validation = validateDescription(description);
        setRealTimeErrors(prev => ({
          ...prev,
          description: validation.isValid ? undefined : validation.message,
        }));
      } else {
        setRealTimeErrors(prev => ({ ...prev, description: undefined }));
      }
    }, 500),
    []
  );

  const debouncedValidateDate = useCallback(
    debounce((date: string) => {
      if (date) {
        const validation = validateTransactionDate(date);
        setRealTimeErrors(prev => ({
          ...prev,
          transactionDate: validation.isValid ? undefined : validation.message,
        }));
      } else {
        setRealTimeErrors(prev => ({ ...prev, transactionDate: undefined }));
      }
    }, 500),
    []
  );

  // 口座一覧の取得
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        console.log('Loading accounts...');

        // 口座一覧と顧客一覧を並行取得
        const [accountList, customerList] = await Promise.all([
          accountService.listAccounts(),
          customerService.listCustomers({ page: 1, limit: 1000 }), // 全顧客を取得
        ]);

        console.log('Accounts loaded:', accountList);
        console.log('Customers loaded:', customerList);

        // 顧客情報をマップに変換
        const customerMap = new Map<string, Customer>();
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

        console.log('Accounts with customer:', accountsWithCustomer);
        setAccounts(accountsWithCustomer);
      } catch (error) {
        console.error('口座一覧の取得に失敗しました:', error);
        setErrors({
          general:
            '口座一覧の取得に失敗しました。ページを再読み込みしてください。',
        });
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [accountService, customerService]);

  // パンくずナビゲーション設定
  useEffect(() => {
    setBreadcrumbs([
      { label: 'ダッシュボード', path: PATHS.DASHBOARD },
      { label: '取引入力', isActive: true },
    ]);
  }, [setBreadcrumbs]);

  // フォーム入力ハンドラー
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (realTimeErrors[field]) {
      setRealTimeErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // リアルタイム検証の実行
    switch (field) {
      case 'amount':
        debouncedValidateAmount(value);
        break;
      case 'description':
        debouncedValidateDescription(value);
        break;
      case 'transactionDate':
        debouncedValidateDate(value);
        break;
    }
  };

  // 取引タイプ変更時の処理
  const handleTransactionTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      sourceAccountId: '',
      destinationAccountId: '',
    }));
    setErrors({});
    setRealTimeErrors({});
  };

  // バリデーション（送信時の最終検証）
  const validateForm = (): boolean => {
    const validationErrors = validateTransactionForm(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // フォーム送信（確認画面に遷移）
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!session?.userId) {
      setErrors({ general: 'ログインが必要です。' });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const transactionData: TransactionInputData = {
        type: formData.type,
        sourceAccountId: formData.sourceAccountId || undefined,
        destinationAccountId: formData.destinationAccountId || undefined,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        transactionDate: new Date(formData.transactionDate),
      };

      console.log('=== TransactionInput データ送信開始 ===');
      console.log('formData:', formData);
      console.log('Navigating to confirmation with data:', transactionData);

      // 確認画面に遷移（データを引き継ぎ）
      navigateWithData(PATHS.TRANSACTION_CONFIRMATION, transactionData);
    } catch (error) {
      console.error('データ準備エラー:', error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'データの準備に失敗しました。',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 口座選択用のオプション生成
  const getAccountOptions = (excludeAccountId?: string) => {
    return accounts
      .filter(account => account.accountId !== excludeAccountId)
      .map(account => ({
        value: account.accountId,
        label: `${account.customerName}：${account.accountNumber} (残高: ¥${account.balance.toLocaleString()})`,
        account,
      }));
  };

  // 取引タイプのラベル
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>口座情報を読み込み中...</Typography>
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
          maxWidth: 800,
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
          取引入力
        </Typography>

        {/* ワークフロー制御の警告 */}
        {!isTransitionAllowed && blockReason && (
          <Alert severity="warning" sx={{ mb: 3, width: '100%' }}>
            {blockReason}
          </Alert>
        )}

        {errors.general && (
          <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
            {errors.general}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
            {successMessage}
          </Alert>
        )}

        <Card sx={{ width: '100%' }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* 取引タイプ選択 */}
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>取引タイプ</InputLabel>
                    <Select
                      value={formData.type}
                      label="取引タイプ"
                      onChange={e =>
                        handleTransactionTypeChange(
                          e.target.value as TransactionType
                        )
                      }
                    >
                      <MenuItem value={TransactionType.TRANSFER}>振込</MenuItem>
                      <MenuItem value={TransactionType.DEPOSIT}>入金</MenuItem>
                      <MenuItem value={TransactionType.WITHDRAWAL}>
                        出金
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                  <Typography
                    variant="h6"
                    sx={{ mt: 2, mb: 2, textAlign: 'center' }}
                  >
                    {getTransactionTypeLabel(formData.type)}取引の詳細
                  </Typography>
                </Grid>

                {/* 振込元口座（振込・出金の場合） */}
                {(formData.type === TransactionType.TRANSFER ||
                  formData.type === TransactionType.WITHDRAWAL) && (
                  <Grid item xs={12}>
                    <Autocomplete
                      options={getAccountOptions(formData.destinationAccountId)}
                      getOptionLabel={option => option.label}
                      value={
                        getAccountOptions().find(
                          opt => opt.value === formData.sourceAccountId
                        ) || null
                      }
                      onChange={(_, newValue) => {
                        handleInputChange(
                          'sourceAccountId',
                          newValue?.value || ''
                        );
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={
                            formData.type === TransactionType.TRANSFER
                              ? '振込元口座'
                              : '出金元口座'
                          }
                          error={!!errors.sourceAccountId}
                          helperText={errors.sourceAccountId}
                          required
                        />
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                    />
                  </Grid>
                )}

                {/* 振込先口座（振込・入金の場合） */}
                {(formData.type === TransactionType.TRANSFER ||
                  formData.type === TransactionType.DEPOSIT) && (
                  <Grid item xs={12}>
                    <Autocomplete
                      options={getAccountOptions(formData.sourceAccountId)}
                      getOptionLabel={option => option.label}
                      value={
                        getAccountOptions().find(
                          opt => opt.value === formData.destinationAccountId
                        ) || null
                      }
                      onChange={(_, newValue) => {
                        handleInputChange(
                          'destinationAccountId',
                          newValue?.value || ''
                        );
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={
                            formData.type === TransactionType.TRANSFER
                              ? '振込先口座'
                              : '入金先口座'
                          }
                          error={!!errors.destinationAccountId}
                          helperText={errors.destinationAccountId}
                          required
                        />
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                    />
                  </Grid>
                )}

                {/* 金額 */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="金額"
                    type="number"
                    value={formData.amount}
                    onChange={e => handleInputChange('amount', e.target.value)}
                    error={!!(errors.amount || realTimeErrors.amount)}
                    helperText={
                      errors.amount ||
                      realTimeErrors.amount ||
                      '1円以上1,000万円以下で入力してください'
                    }
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">¥</InputAdornment>
                      ),
                    }}
                    inputProps={{
                      min: 1,
                      max: 10000000,
                      step: 1,
                    }}
                  />
                </Grid>

                {/* 取引日 */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="取引日"
                    type="date"
                    value={formData.transactionDate}
                    onChange={e =>
                      handleInputChange('transactionDate', e.target.value)
                    }
                    error={
                      !!(
                        errors.transactionDate || realTimeErrors.transactionDate
                      )
                    }
                    helperText={
                      errors.transactionDate ||
                      realTimeErrors.transactionDate ||
                      '営業日（平日・祝日以外）を選択してください'
                    }
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: new Date().toISOString().split('T')[0],
                    }}
                  />
                </Grid>

                {/* 取引内容 */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="取引内容"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    error={!!(errors.description || realTimeErrors.description)}
                    helperText={
                      errors.description ||
                      realTimeErrors.description ||
                      `${formData.description.length}/100文字`
                    }
                    required
                    inputProps={{
                      maxLength: 100,
                    }}
                  />
                  {/* 文字数カウンターの追加表示 */}
                  <FormHelperText
                    sx={{
                      textAlign: 'right',
                      color:
                        formData.description.length > 80
                          ? 'warning.main'
                          : 'text.secondary',
                    }}
                  >
                    {formData.description.length}/100文字
                  </FormHelperText>
                </Grid>

                {/* 送信ボタン */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      justifyContent: 'center',
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => navigateWithData(PATHS.TRANSACTIONS)}
                      disabled={submitting}
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting || accounts.length === 0}
                    >
                      {submitting ? '処理中...' : '確認画面へ'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

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
      </Box>
    </Box>
  );
};

export default TransactionInput;
