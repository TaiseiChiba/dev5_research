import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { ServiceFactory } from '../../services/common/serviceFactory';
import { WorkflowHistory } from './WorkflowHistory';
import type { Transaction, TransactionStatus } from '../../types/transaction';
import type { UserSession } from '../../types/auth';

interface TransactionStatusManagerProps {
  transaction: Transaction;
  session: UserSession;
  onStatusChanged: () => void;
  onClose: () => void;
}

interface StatusOption {
  value: TransactionStatus;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  icon: React.ReactNode;
  description: string;
  requiresComment?: boolean;
}

export const TransactionStatusManager: React.FC<
  TransactionStatusManagerProps
> = ({ transaction, session, onStatusChanged, onClose }) => {
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | ''>(
    ''
  );
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 現在の状態から遷移可能な状態を定義
  const getAvailableStatuses = (
    currentStatus: TransactionStatus
  ): StatusOption[] => {
    const baseOptions: Record<TransactionStatus, StatusOption[]> = {
      pending_verification: [
        {
          value: 'verification_complete' as TransactionStatus,
          label: '承認',
          color: 'success',
          icon: <CheckCircleIcon />,
          description: '取引内容を確認し、承認します',
        },
        {
          value: 'on_hold' as TransactionStatus,
          label: '保留',
          color: 'warning',
          icon: <PauseIcon />,
          description: '追加確認が必要なため保留します',
          requiresComment: true,
        },
        {
          value: 'returned_for_correction' as TransactionStatus,
          label: '差し戻し',
          color: 'error',
          icon: <CancelIcon />,
          description: '修正が必要なため差し戻します',
          requiresComment: true,
        },
      ],
      verification_complete: [
        {
          value: 'confirmed' as TransactionStatus,
          label: '確定',
          color: 'success',
          icon: <CheckCircleIcon />,
          description: '取引を確定し、残高を更新します',
        },
      ],
      on_hold: [
        {
          value: 'verification_complete' as TransactionStatus,
          label: '承認',
          color: 'success',
          icon: <CheckCircleIcon />,
          description: '保留を解除し、承認します',
        },
        {
          value: 'returned_for_correction' as TransactionStatus,
          label: '差し戻し',
          color: 'error',
          icon: <CancelIcon />,
          description: '修正が必要なため差し戻します',
          requiresComment: true,
        },
      ],
      confirmed: [
        {
          value: 'cancelled' as TransactionStatus,
          label: '取消',
          color: 'error',
          icon: <CancelIcon />,
          description: '確定済み取引を取消します（当日のみ）',
          requiresComment: true,
        },
      ],
      returned_for_correction: [],
      cancelled: [],
    };

    return baseOptions[currentStatus] || [];
  };

  const availableStatuses = getAvailableStatuses(transaction.status);

  const getCurrentStatusLabel = (status: TransactionStatus): string => {
    const statusLabels: Record<TransactionStatus, string> = {
      pending_verification: '検証待ち',
      verification_complete: '検証完了',
      on_hold: '保留',
      returned_for_correction: '差し戻し',
      confirmed: '確定',
      cancelled: '取消',
    };
    return statusLabels[status] || status;
  };

  const getCurrentStatusColor = (
    status: TransactionStatus
  ): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    const statusColors: Record<
      TransactionStatus,
      'primary' | 'success' | 'warning' | 'error' | 'info'
    > = {
      pending_verification: 'warning',
      verification_complete: 'success',
      on_hold: 'info',
      returned_for_correction: 'error',
      confirmed: 'success',
      cancelled: 'error',
    };
    return statusColors[status] || 'primary';
  };

  const canUserChangeStatus = (): boolean => {
    // 自己検証防止: 作成者は検証系の状態変更不可
    if (transaction.createdBy === session.userId) {
      const verificationStatuses: TransactionStatus[] = [
        'verification_complete',
        'on_hold',
        'returned_for_correction',
      ];
      return !availableStatuses.some(option =>
        verificationStatuses.includes(option.value)
      );
    }
    return true;
  };

  const getSelectedStatusOption = (): StatusOption | undefined => {
    return availableStatuses.find(option => option.value === selectedStatus);
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    const statusOption = getSelectedStatusOption();
    if (!statusOption) return;

    // コメント必須チェック
    if (statusOption.requiresComment && !comments.trim()) {
      setError('この操作にはコメントの入力が必要です。');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const transactionService =
        ServiceFactory.getInstance().getTransactionService();
      const result = await transactionService.changeTransactionStatus(
        transaction.transactionId,
        selectedStatus,
        session.userId,
        comments.trim() || undefined
      );

      if (result.success) {
        setSuccess(result.message || '状態変更が完了しました');
        onStatusChanged();

        // 成功時は少し待ってからダイアログを閉じる
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || '状態変更に失敗しました');
      }
    } catch (err) {
      setError('状態変更中にエラーが発生しました');
      console.error('Status change error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = (): boolean => {
    if (!selectedStatus) return false;
    const statusOption = getSelectedStatusOption();
    if (statusOption?.requiresComment && !comments.trim()) return false;
    return true;
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon color="primary" />
            <Box>
              <Typography variant="h6">取引状態管理</Typography>
              <Typography variant="body2" color="text.secondary">
                取引ID: {transaction.transactionId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 左側: 状態変更フォーム */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  状態変更
                </Typography>

                {/* 現在の状態 */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    現在の状態
                  </Typography>
                  <Chip
                    label={getCurrentStatusLabel(transaction.status)}
                    color={getCurrentStatusColor(transaction.status)}
                    size="medium"
                  />
                </Box>

                {/* 自己検証防止の警告 */}
                {!canUserChangeStatus() && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon />
                      <Typography variant="body2">
                        自分が作成した取引は検証できません
                      </Typography>
                    </Box>
                  </Alert>
                )}

                {/* エラーメッセージ */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {/* 成功メッセージ */}
                {success && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                  </Alert>
                )}

                {/* 状態選択 */}
                {availableStatuses.length > 0 && canUserChangeStatus() ? (
                  <>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>変更後の状態</InputLabel>
                      <Select
                        value={selectedStatus}
                        onChange={e =>
                          setSelectedStatus(e.target.value as TransactionStatus)
                        }
                        label="変更後の状態"
                        disabled={isProcessing}
                      >
                        {availableStatuses.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {option.icon}
                              <Box>
                                <Typography>{option.label}</Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {option.description}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* コメント入力 */}
                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <CommentIcon fontSize="small" />
                        <Typography variant="body2">
                          コメント
                          {getSelectedStatusOption()?.requiresComment && (
                            <Typography component="span" color="error.main">
                              {' '}
                              *必須
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder={
                          getSelectedStatusOption()?.requiresComment
                            ? 'この操作の理由やコメントを入力してください...'
                            : '任意でコメントを入力してください...'
                        }
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        disabled={isProcessing}
                        error={
                          getSelectedStatusOption()?.requiresComment &&
                          !comments.trim()
                        }
                        helperText={
                          getSelectedStatusOption()?.requiresComment &&
                          !comments.trim()
                            ? 'コメントの入力が必要です'
                            : undefined
                        }
                      />
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">
                    {!canUserChangeStatus()
                      ? '自分が作成した取引は検証できません'
                      : '現在の状態からは変更できません'}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 右側: ワークフロー履歴 */}
          <Grid item xs={12} md={6}>
            <WorkflowHistory
              transactionId={transaction.transactionId}
              showComments={true}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={isProcessing} variant="outlined">
          キャンセル
        </Button>
        {availableStatuses.length > 0 && canUserChangeStatus() && (
          <Button
            onClick={handleStatusChange}
            disabled={!isFormValid() || isProcessing}
            variant="contained"
            color={getSelectedStatusOption()?.color || 'primary'}
            startIcon={getSelectedStatusOption()?.icon}
          >
            {isProcessing
              ? '処理中...'
              : getSelectedStatusOption()?.label || '変更'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
