/**
 * MUIログイン画面コンポーネント
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  LoginOutlined,
  PersonOutline,
  AdminPanelSettings,
} from '@mui/icons-material';
import { ServiceFactory } from '../services/serviceFactory.js';
import { UserRole, LoginRequest, UserSession } from '../types/auth.js';
import { PATHS } from '../constants/paths.js';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

interface FormData {
  userId: string;
  password: string;
  userRole: UserRole | '';
}

interface FormErrors {
  userId?: string;
  password?: string;
  userRole?: string;
  general?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ログイン前にアクセスしようとしたパスを取得
  const from = (location.state as any)?.from || PATHS.DASHBOARD;
  const expired = (location.state as any)?.expired;

  const [formData, setFormData] = useState<FormData>({
    userId: '',
    password: '',
    userRole: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case 'userId':
        if (!value.trim()) return '利用者IDは必須です。';
        if (value.trim().length < 3)
          return '利用者IDは3文字以上で入力してください。';
        break;
      case 'password':
        if (!value) return 'パスワードは必須です。';
        if (value.length < 6)
          return 'パスワードは6文字以上で入力してください。';
        break;
      case 'userRole':
        if (!value) return '利用者区分を選択してください。';
        break;
    }
    return undefined;
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // リアルタイム検証
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error, general: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof FormData;
      const error = validateField(fieldName, formData[fieldName] as string);
      if (error) newErrors[fieldName] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const serviceFactory = ServiceFactory.getInstance();
      const authService = serviceFactory.getAuthService();

      const loginRequest: LoginRequest = {
        userId: formData.userId.trim(),
        password: formData.password,
      };

      // 1. ログインAPIを呼び出し
      const result = await authService.login(loginRequest);

      // 2. レスポンスの検証
      if (!result.success) {
        setErrors({
          general: result.errorMessage || 'ログインに失敗しました。',
        });
        return;
      }

      if (!result.userRole) {
        setErrors({ general: 'ユーザー区分情報が取得できませんでした。' });
        return;
      }

      // 3. 利用者区分の検証
      if (result.userRole !== formData.userRole) {
        setErrors({ general: '選択された利用者区分が正しくありません。' });
        return;
      }

      // 4. セッション情報を取得
      const session = authService.getCurrentSession();

      if (!session) {
        setErrors({ general: 'セッション情報の取得に失敗しました。' });
        return;
      }

      // 5. ログイン成功 - 親コンポーネントに通知
      onLoginSuccess(session);

      // 6. 元のページまたはダッシュボードにリダイレクト
      navigate(from, { replace: true });
    } catch (error) {
      console.error('ログインエラー:', error);
      setErrors({ general: 'ログイン処理中にエラーが発生しました。' });
    } finally {
      // エラー時にローディング解除
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'grey.50', p: 2 }}
    >
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        {/* セッション期限切れの通知 */}
        {expired && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            セッションの有効期限が切れました。再度ログインしてください。
          </Alert>
        )}

        <Card elevation={4}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <LoginOutlined
                sx={{ mr: 2, fontSize: 32, color: 'primary.main' }}
              />
              <Typography variant="h4" component="h1">
                ログイン
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="利用者ID"
                name="userId"
                value={formData.userId}
                onChange={e => handleInputChange('userId', e.target.value)}
                error={!!errors.userId}
                helperText={errors.userId}
                margin="normal"
                required
                autoComplete="username"
                placeholder="利用者IDを入力してください"
                InputProps={{
                  startAdornment: (
                    <PersonOutline sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />

              <TextField
                fullWidth
                label="パスワード"
                name="password"
                type="password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                margin="normal"
                required
                autoComplete="current-password"
                placeholder="パスワードを入力してください"
              />

              <FormControl fullWidth margin="normal" error={!!errors.userRole}>
                <InputLabel required>利用者区分</InputLabel>
                <Select
                  value={formData.userRole}
                  label="利用者区分"
                  onChange={e => handleInputChange('userRole', e.target.value)}
                  startAdornment={
                    formData.userRole === UserRole.ADMINISTRATOR ? (
                      <AdminPanelSettings
                        sx={{ mr: 1, color: 'action.active' }}
                      />
                    ) : (
                      <PersonOutline sx={{ mr: 1, color: 'action.active' }} />
                    )
                  }
                >
                  <MenuItem value={UserRole.GENERAL_STAFF}>一般行員</MenuItem>
                  <MenuItem value={UserRole.ADMINISTRATOR}>管理者</MenuItem>
                </Select>
                {errors.userRole && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 2 }}
                  >
                    {errors.userRole}
                  </Typography>
                )}
              </FormControl>

              {errors.general && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors.general}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                startIcon={
                  isLoading ? <CircularProgress size={20} /> : <LoginOutlined />
                }
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* デモアカウント情報 */}
        <Paper elevation={2} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            デモ用アカウント
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            テスト用ユーザー:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="一般行員"
                secondary="staff001, staff002 (パスワード: password123)"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="管理者"
                secondary="admin001 (パスワード: admin123)"
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginScreen;
