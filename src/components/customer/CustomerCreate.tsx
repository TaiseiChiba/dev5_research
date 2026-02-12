/**
 * 顧客新規登録コンポーネント
 *
 * 新規顧客登録フォーム
 * 要件: 2.1, 8.1, 9.1
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { CustomerType, CustomerData } from '../../types/customer';
import { ContactInfo } from '../../types/common';
import { ServiceFactory } from '../../services/common/serviceFactory';
import { generatePath, PATHS } from '../../constants/paths';

interface FormData {
  name: string;
  phoneticName: string;
  customerType: CustomerType;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
}

interface FormErrors {
  name?: string;
  phoneticName?: string;
  customerType?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
}

const CustomerCreate: React.FC = () => {
  const navigate = useNavigate();

  // 状態管理
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phoneticName: '',
    customerType: CustomerType.INDIVIDUAL,
    email: '',
    phone: '',
    postalCode: '',
    address: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // サービス取得
  const customerService = ServiceFactory.getInstance().getCustomerService();

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
   * 要件: 8.1 - 必須フィールドが空の際、システムはフォーム送信を防止し、不足フィールドをハイライトすること
   * 要件: 8.2 - 無効な数値または日付形式が入力された際、システムは形式エラーメッセージを表示すること
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 必須項目チェック
    if (!formData.name.trim()) {
      newErrors.name = '氏名・法人名は必須です。';
    }

    if (!formData.phoneticName.trim()) {
      newErrors.phoneticName = 'カナは必須です。';
    }

    // カナの形式チェック（簡易版）
    if (
      formData.phoneticName &&
      !/^[ァ-ヶー\s]+$/.test(formData.phoneticName)
    ) {
      newErrors.phoneticName = 'カナはカタカナで入力してください。';
    }

    // メールアドレスの形式チェック
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません。';
    }

    // 電話番号の形式チェック（簡易版）
    if (formData.phone && !/^[\d-]+$/.test(formData.phone)) {
      newErrors.phone = '電話番号は数字とハイフンで入力してください。';
    }

    // 郵便番号の形式チェック
    if (formData.postalCode && !/^\d{3}-?\d{4}$/.test(formData.postalCode)) {
      newErrors.postalCode =
        '郵便番号は7桁の数字で入力してください（例：123-4567）。';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * フォーム送信ハンドラ
   * 要件: 2.1 - 新規顧客を作成する際、システムは必須の顧客情報をすべて要求し、一意の顧客番号を割り当てること
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
      const contactInfo: ContactInfo = {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        postalCode: formData.postalCode || undefined,
        address: formData.address || undefined,
      };

      const customerData: CustomerData = {
        name: formData.name.trim(),
        phoneticName: formData.phoneticName.trim(),
        customerType: formData.customerType,
        contactInfo,
      };

      const newCustomer = await customerService.createCustomer(customerData);
      setSuccessMessage(
        `顧客が正常に登録されました。顧客番号: ${newCustomer.customerId}`
      );

      // 顧客一覧画面に遷移
      navigate(PATHS.CUSTOMER_LIST, {
        state: {
          message: `顧客が正常に登録されました。顧客番号: ${newCustomer.customerId}`,
        },
      });
    } catch (err) {
      setError('顧客の登録に失敗しました。');
      console.error('顧客登録エラー:', err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * キャンセルハンドラ
   */
  const handleCancel = () => {
    navigate(PATHS.CUSTOMER_LIST);
  };

  /**
   * 戻るハンドラ
   */
  const handleBack = () => {
    navigate(PATHS.CUSTOMER_LIST);
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={handleBack} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" color="primary">
          新規顧客登録
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

      {/* 登録フォーム */}
      <Card elevation={2}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom color="primary">
              基本情報
            </Typography>

            <Grid container spacing={3}>
              {/* 氏名・法人名 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="氏名・法人名"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  disabled={saving}
                  placeholder="田中太郎 / 株式会社サンプル"
                />
              </Grid>

              {/* カナ */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="カナ"
                  value={formData.phoneticName}
                  onChange={e =>
                    handleInputChange('phoneticName', e.target.value)
                  }
                  error={!!errors.phoneticName}
                  helperText={errors.phoneticName}
                  placeholder="タナカタロウ / カブシキガイシャサンプル"
                  disabled={saving}
                />
              </Grid>

              {/* 顧客区分 */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>顧客区分</InputLabel>
                  <Select
                    value={formData.customerType}
                    label="顧客区分"
                    onChange={e =>
                      handleInputChange('customerType', e.target.value)
                    }
                    error={!!errors.customerType}
                    disabled={saving}
                  >
                    <MenuItem value={CustomerType.INDIVIDUAL}>個人</MenuItem>
                    <MenuItem value={CustomerType.CORPORATE}>法人</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom color="primary">
              連絡先情報（任意）
            </Typography>

            <Grid container spacing={3}>
              {/* メールアドレス */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="example@example.com"
                  disabled={saving}
                />
              </Grid>

              {/* 電話番号 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="電話番号"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  placeholder="03-1234-5678"
                  disabled={saving}
                />
              </Grid>

              {/* 郵便番号 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="郵便番号"
                  value={formData.postalCode}
                  onChange={e =>
                    handleInputChange('postalCode', e.target.value)
                  }
                  error={!!errors.postalCode}
                  helperText={errors.postalCode}
                  placeholder="123-4567"
                  disabled={saving}
                />
              </Grid>

              {/* 住所 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="住所"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  error={!!errors.address}
                  helperText={errors.address}
                  placeholder="東京都渋谷区..."
                  disabled={saving}
                />
              </Grid>
            </Grid>

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
                {saving ? '登録中...' : '登録'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerCreate;
