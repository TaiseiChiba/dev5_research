/**
 * ワークフロー進行状況表示コンポーネント
 *
 * 取引処理の進行状況を視覚的に表示し、現在の段階と次のステップを明示します。
 * 要件: 10.3 - プロセス進行状況の表示
 */

import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Chip,
  Alert,
  Button,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  WorkflowStage,
  WorkflowProgress,
} from '../../services/workflow/workflowOrderService.js';

interface WorkflowProgressIndicatorProps {
  progress: WorkflowProgress;
  transactionId?: string;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showActions?: boolean;
  onStageClick?: (stage: WorkflowStage) => void;
}

interface StageInfo {
  stage: WorkflowStage;
  label: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
}

export const WorkflowProgressIndicator: React.FC<
  WorkflowProgressIndicatorProps
> = ({
  progress,
  transactionId,
  variant = 'horizontal',
  showActions = true,
  onStageClick,
}) => {
  const navigate = useNavigate();

  // ワークフロー段階の定義
  const stages: StageInfo[] = [
    {
      stage: WorkflowStage.INPUT,
      label: '入力',
      description: '取引内容の入力',
      icon: <EditIcon />,
      path: '/transactions/input',
    },
    {
      stage: WorkflowStage.VERIFICATION,
      label: '検証',
      description: 'ダブルチェック検証',
      icon: <VerifiedUserIcon />,
      path: '/transactions/verification',
    },
    {
      stage: WorkflowStage.CONFIRMATION,
      label: '確定',
      description: '取引の最終確定',
      icon: <CheckCircleIcon />,
      path: '/transactions/final-confirmation',
    },
    {
      stage: WorkflowStage.COMPLETED,
      label: '完了',
      description: '処理完了',
      icon: <CheckCircleIcon />,
      path: '/transactions/history',
    },
  ];

  // 段階の状態を取得
  const getStageStatus = (
    stage: WorkflowStage
  ): 'completed' | 'active' | 'pending' | 'blocked' => {
    if (progress.completedStages.includes(stage)) {
      return 'completed';
    }
    if (progress.currentStage === stage) {
      return progress.canProceed ? 'active' : 'blocked';
    }
    return 'pending';
  };

  // 段階の色を取得
  const getStageColor = (
    status: string
  ): 'success' | 'primary' | 'default' | 'error' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  // 進行率を計算
  const getProgressPercentage = (): number => {
    const totalStages = stages.length;
    const completedCount = progress.completedStages.length;
    const currentProgress = progress.canProceed ? 0.5 : 0; // 現在の段階の進行度

    return Math.round(((completedCount + currentProgress) / totalStages) * 100);
  };

  // 段階クリックハンドラー
  const handleStageClick = (stageInfo: StageInfo) => {
    if (onStageClick) {
      onStageClick(stageInfo.stage);
    } else if (stageInfo.path) {
      navigate(stageInfo.path);
    }
  };

  // 次のアクションボタンハンドラー
  const handleNextAction = () => {
    if (progress.nextStage) {
      const nextStageInfo = stages.find(s => s.stage === progress.nextStage);
      if (nextStageInfo?.path) {
        navigate(nextStageInfo.path);
      }
    }
  };

  // コンパクト表示
  if (variant === 'compact') {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                進行状況
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getProgressPercentage()}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary">
                {getProgressPercentage()}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stages.find(s => s.stage === progress.currentStage)?.label ||
                  '不明'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 水平表示
  if (variant === 'horizontal') {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ワークフロー進行状況
          </Typography>

          {/* 進行率バー */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                進行率
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="bold">
                {getProgressPercentage()}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgressPercentage()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* ステップ表示 */}
          <Stepper
            activeStep={progress.completedStages.length}
            alternativeLabel
          >
            {stages.map(stageInfo => {
              const status = getStageStatus(stageInfo.stage);
              const isClickable = status === 'completed' || status === 'active';

              return (
                <Step key={stageInfo.stage} completed={status === 'completed'}>
                  <StepLabel
                    icon={stageInfo.icon}
                    error={status === 'blocked'}
                    sx={{
                      cursor: isClickable ? 'pointer' : 'default',
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                        fontWeight: status === 'active' ? 'bold' : 'normal',
                      },
                    }}
                    onClick={
                      isClickable
                        ? () => handleStageClick(stageInfo)
                        : undefined
                    }
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="inherit">
                        {stageInfo.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stageInfo.description}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          {/* 状態メッセージ */}
          {progress.blockedReason && (
            <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
              {progress.blockedReason}
            </Alert>
          )}

          {/* 次のアクション */}
          {showActions && progress.canProceed && progress.nextStage && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<ArrowForwardIcon />}
                onClick={handleNextAction}
                size="large"
              >
                次の段階:{' '}
                {stages.find(s => s.stage === progress.nextStage)?.label}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // 垂直表示
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ワークフロー進行状況
        </Typography>

        <Stepper
          orientation="vertical"
          activeStep={progress.completedStages.length}
        >
          {stages.map(stageInfo => {
            const status = getStageStatus(stageInfo.stage);
            const isClickable = status === 'completed' || status === 'active';

            return (
              <Step key={stageInfo.stage} completed={status === 'completed'}>
                <StepLabel
                  icon={stageInfo.icon}
                  error={status === 'blocked'}
                  sx={{
                    cursor: isClickable ? 'pointer' : 'default',
                  }}
                  onClick={
                    isClickable ? () => handleStageClick(stageInfo) : undefined
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body1"
                      fontWeight={status === 'active' ? 'bold' : 'normal'}
                    >
                      {stageInfo.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        status === 'completed'
                          ? '完了'
                          : status === 'active'
                            ? '進行中'
                            : status === 'blocked'
                              ? 'ブロック'
                              : '待機中'
                      }
                      color={getStageColor(status)}
                      variant={status === 'pending' ? 'outlined' : 'filled'}
                    />
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {stageInfo.description}
                  </Typography>

                  {status === 'active' &&
                    progress.canProceed &&
                    showActions && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleStageClick(stageInfo)}
                        >
                          この段階を実行
                        </Button>
                      </Box>
                    )}

                  {status === 'blocked' && progress.blockedReason && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {progress.blockedReason}
                    </Alert>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </CardContent>
    </Card>
  );
};

export default WorkflowProgressIndicator;
