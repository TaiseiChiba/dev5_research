/**
 * 取引入力コンポーネント
 *
 * 振込・入金・出金取引の入力フォームを提供します。
 * 要件: 4.1, 4.2, 4.3
 */

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  TransactionType,
  TransactionInput as TransactionInputData,
} from '../../types/transaction.js';
import { AccountWithCustomer } from '../../types/account.js';
import { Customer } from '../../types/customer.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { PATHS } from '../../constants/paths.js';

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

const TransactionInput: React.FC<TransactionInputProps> = ({ session }) => {
  const navigate = useNavigate();
  const transactionService =
    ServiceFactory.getInstance().getTransactionService();
  const accountService = ServiceFactory.getInstance().getAccountService();
  const customerService = ServiceFactory.getInstance().getCustomerService();

  // フォームデータ
  const [formData, setFormData] = useState<FormData>({
    type: TransactionType.TRANSFER,
    sourceAccountId: '',
    destinationAccountId: '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  // 状態管理
  const [accounts, setAccounts] = useState<AccountWithCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

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

  // フォーム入力ハンドラー
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
  };

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 取引タイプ別の必須項目チェック
    switch (formData.type) {
      case TransactionType.TRANSFER:
        if (!formData.sourceAccountId) {
          newErrors.sourceAccountId = '振込元口座を選択してください。';
        }
        if (!formData.destinationAccountId) {
          newErrors.destinationAccountId = '振込先口座を選択してください。';
        }
        if (formData.sourceAccountId === formData.destinationAccountId) {
          newErrors.destinationAccountId =
            '振込元と振込先に同じ口座は選択できません。';
        }
        break;

      case TransactionType.DEPOSIT:
        if (!formData.destinationAccountId) {
          newErrors.destinationAccountId = '入金先口座を選択してください。';
        }
        break;

      case TransactionType.WITHDRAWAL:
        if (!formData.sourceAccountId) {
          newErrors.sourceAccountId = '出金元口座を選択してください。';
        }
        break;
    }

    // 金額のバリデーション
    if (!formData.amount) {
      newErrors.amount = '金額を入力してください。';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = '正の数値を入力してください。';
      } else if (amount > 10000000) {
        newErrors.amount = '金額は1,000万円以下で入力してください。';
      }
    }

    // 取引内容のバリデーション
    if (!formData.description.trim()) {
      newErrors.description = '取引内容を入力してください。';
    } else if (formData.description.length > 100) {
      newErrors.description = '取引内容は100文字以内で入力してください。';
    }

    // 取引日のバリデーション
    if (!formData.transactionDate) {
      newErrors.transactionDate = '取引日を選択してください。';
    } else {
      const today = new Date();
      const selectedDate = new Date(formData.transactionDate);

      if (
        selectedDate <
        new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ) {
        newErrors.transactionDate = '過去の日付は選択できません。';
      }

      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        newErrors.transactionDate = '営業日（平日）を選択してください。';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
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

      console.log('Creating transaction with data:', transactionData);
      const result = await transactionService.createTransaction(
        transactionData,
        session.userId
      );
      console.log('Transaction created successfully:', result);

      setSuccessMessage(
        `取引が正常に作成されました。取引ID: ${result.transactionId}`
      );

      // フォームをリセット
      setFormData({
        type: TransactionType.TRANSFER,
        sourceAccountId: '',
        destinationAccountId: '',
        amount: '',
        description: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });

      // 3秒後に検証画面に遷移
      setTimeout(() => {
        navigate(PATHS.TRANSACTION_VERIFICATION);
      }, 3000);
    } catch (error) {
      console.error('取引作成エラー:', error);
      setErrors({
        general:
          error instanceof Error ? error.message : '取引の作成に失敗しました。',
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        取引入力
      </Typography>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Card>
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
                    <MenuItem value={TransactionType.WITHDRAWAL}>出金</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
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
                  error={!!errors.amount}
                  helperText={errors.amount}
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
                  error={!!errors.transactionDate}
                  helperText={errors.transactionDate}
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
                  error={!!errors.description}
                  helperText={
                    errors.description ||
                    `${formData.description.length}/100文字`
                  }
                  required
                  inputProps={{
                    maxLength: 100,
                  }}
                />
              </Grid>

              {/* 送信ボタン */}
              <Grid item xs={12}>
                <Box
                  sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate(PATHS.TRANSACTIONS)}
                    disabled={submitting}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting || accounts.length === 0}
                  >
                    {submitting ? '処理中...' : '取引を作成'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransactionInput;
