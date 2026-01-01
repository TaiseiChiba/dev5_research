/**
 * エラーページコンポーネント
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { ErrorOutline, LockOutlined, HomeOutlined } from '@mui/icons-material';
import { PATHS } from '../../constants/paths.js';

/**
 * 404 - ページが見つからない
 */
export const NotFoundError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Card elevation={4} sx={{ maxWidth: 500, textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            404 - ページが見つかりません
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            お探しのページは存在しないか、移動された可能性があります。
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<HomeOutlined />}
              onClick={() => navigate(PATHS.DASHBOARD)}
            >
              ダッシュボードに戻る
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              前のページに戻る
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

/**
 * 401 - 認証エラー
 */
export const UnauthorizedError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Card elevation={4} sx={{ maxWidth: 500, textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <LockOutlined sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            401 - アクセス権限がありません
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            この機能にアクセスするには管理者権限が必要です。
          </Typography>
          <Alert severity="warning" sx={{ mb: 3 }}>
            管理者権限が必要な機能です。システム管理者にお問い合わせください。
          </Alert>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<HomeOutlined />}
              onClick={() => navigate(PATHS.DASHBOARD)}
            >
              ダッシュボードに戻る
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              前のページに戻る
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

/**
 * 500 - サーバーエラー
 */
export const ServerError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Card elevation={4} sx={{ maxWidth: 500, textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            500 - サーバーエラー
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            サーバーで問題が発生しました。しばらく時間をおいて再度お試しください。
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            システムエラーが発生しました。問題が継続する場合は、システム管理者にお問い合わせください。
          </Alert>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<HomeOutlined />}
              onClick={() => navigate(PATHS.DASHBOARD)}
            >
              ダッシュボードに戻る
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              ページを再読み込み
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
