/**
 * MUI利用者切替モーダルコンポーネント
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  SwitchAccountOutlined,
  PersonOutline,
} from '@mui/icons-material';
import { ServiceFactory } from '../../services/common/serviceFactory.js';
import { UserSession, SwitchUserRequest } from '../../types/auth.js';

interface UserSwitchModalProps {
  open: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onSwitchSuccess: (session: UserSession) => void;
}

interface FormData {
  newUserId: string;
  password: string;
}

interface FormErrors {
  newUserId?: string;
  password?: string;
  general?: string;
}

const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  open,
  onClose,
  currentSession,
  onSwitchSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    newUserId: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case 'newUserId':
        if (!value.trim()) return '利用者IDは必須です。';
        if (value.trim().length < 3)
          return '利用者IDは3文字以上で入力してください。';
        break;
      case 'password':
        if (!value) return 'パスワードは必須です。';
        if (value.length < 6)
          return 'パスワードは6文字以上で入力してください。';
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
      const error = validateField(fieldName, formData[fieldName]);
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

      const switchRequest: SwitchUserRequest = {
        currentSessionId: currentSession.sessionId,
        newUserId: formData.newUserId.trim(),
        password: formData.password,
      };

      const result = await authService.switchUser(switchRequest);

      if (result.success && result.userRole) {
        // 利用者切替成功 - 新しいセッション情報を取得
        const newSession = authService.getCurrentSession();
        if (newSession) {
          onSwitchSuccess(newSession);
        }
      } else {
        setErrors({
          general: result.errorMessage || '利用者切替に失敗しました。',
        });
      }
    } catch (error) {
      console.error('利用者切替エラー:', error);
      setErrors({ general: '利用者切替処理中にエラーが発生しました。' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ newUserId: '', password: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 8,
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SwitchAccountOutlined color="primary" />
            利用者切替
          </Box>
          <IconButton onClick={handleClose} disabled={isLoading} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <TextField
            fullWidth
            label="新しい利用者ID"
            name="newUserId"
            value={formData.newUserId}
            onChange={e => handleInputChange('newUserId', e.target.value)}
            error={!!errors.newUserId}
            helperText={errors.newUserId}
            margin="normal"
            required
            autoComplete="username"
            placeholder="新しい利用者IDを入力してください"
            autoFocus
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

          {errors.general && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.general}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={isLoading} variant="outlined">
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SwitchAccountOutlined />
              )
            }
          >
            {isLoading ? '切替中...' : '切替実行'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UserSwitchModal;
