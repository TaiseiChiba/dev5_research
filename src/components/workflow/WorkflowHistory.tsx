import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { ServiceFactory } from '../../services/common/serviceFactory';
import type { WorkflowStep } from '../../types/workflow';
import type { TransactionStatus } from '../../types/transaction';

interface WorkflowHistoryProps {
  transactionId: string;
  showComments?: boolean;
}

export const WorkflowHistory: React.FC<WorkflowHistoryProps> = ({
  transactionId,
  showComments = true,
}) => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflowHistory();
  }, [transactionId]);

  const loadWorkflowHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const workflowService = ServiceFactory.getInstance().getWorkflowService();
      const history = await workflowService.getWorkflowHistory(transactionId);
      setWorkflowSteps(history);
    } catch (err) {
      setError('ワークフロー履歴の取得に失敗しました');
      console.error('ワークフロー履歴取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: TransactionStatus): string => {
    switch (status) {
      case 'pending_verification':
        return '検証待ち';
      case 'verification_complete':
        return '検証完了';
      case 'on_hold':
        return '保留';
      case 'returned_for_correction':
        return '差し戻し';
      case 'confirmed':
        return '確定';
      case 'cancelled':
        return '取消';
      default:
        return status;
    }
  };

  const getStatusColor = (
    status: TransactionStatus
  ): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'pending_verification':
        return 'warning';
      case 'verification_complete':
        return 'success';
      case 'on_hold':
        return 'info';
      case 'returned_for_correction':
        return 'error';
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'verification_complete':
      case 'confirmed':
        return <CheckCircleIcon />;
      case 'on_hold':
        return <PauseIcon />;
      case 'returned_for_correction':
      case 'cancelled':
        return <CancelIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getActionDescription = (
    fromStatus: TransactionStatus,
    toStatus: TransactionStatus
  ): string => {
    if (fromStatus === 'pending_verification') {
      switch (toStatus) {
        case 'verification_complete':
          return '取引を承認しました';
        case 'on_hold':
          return '取引を保留にしました';
        case 'returned_for_correction':
          return '取引を差し戻しました';
        default:
          return '状態を変更しました';
      }
    } else if (
      fromStatus === 'verification_complete' &&
      toStatus === 'confirmed'
    ) {
      return '取引を確定しました';
    } else if (toStatus === 'cancelled') {
      return '取引を取消しました';
    }
    return `${getStatusLabel(fromStatus)} → ${getStatusLabel(toStatus)}`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (workflowSteps.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <AssignmentIcon
            sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary">
            ワークフロー履歴はありません
          </Typography>
          <Typography variant="body2" color="text.secondary">
            この取引にはまだ状態変更履歴がありません
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AssignmentIcon sx={{ mr: 1 }} />
          <Typography variant="h6">ワークフロー履歴</Typography>
          <Chip
            label={`${workflowSteps.length}件`}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        <Stack spacing={2}>
          {workflowSteps.map((step, index) => (
            <Paper
              key={step.stepId}
              variant="outlined"
              sx={{
                p: 2,
                bgcolor:
                  index === workflowSteps.length - 1
                    ? 'primary.50'
                    : 'background.paper',
                borderLeft: 4,
                borderLeftColor: getStatusColor(step.toStatus) + '.main',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(step.toStatus)}
                  <Typography variant="subtitle1" fontWeight="medium">
                    {getActionDescription(step.fromStatus, step.toStatus)}
                  </Typography>
                  {index < workflowSteps.length - 1 && (
                    <ArrowForwardIcon fontSize="small" color="action" />
                  )}
                </Box>
                <Chip
                  label={getStatusLabel(step.toStatus)}
                  color={getStatusColor(step.toStatus)}
                  size="small"
                />
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {step.performedBy}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(step.performedAt).toLocaleString('ja-JP')}
                  </Typography>
                </Box>
              </Box>

              {showComments && step.comments && (
                <Accordion sx={{ mt: 1, boxShadow: 'none' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 'auto',
                      '& .MuiAccordionSummary-content': { margin: '8px 0' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CommentIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="primary">
                        コメントを表示
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderLeft: 3,
                        borderLeftColor: 'primary.main',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {step.comments}
                      </Typography>
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              )}

              {index < workflowSteps.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
