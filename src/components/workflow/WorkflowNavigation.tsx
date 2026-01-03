/**
 * ワークフローナビゲーションコンポーネント
 *
 * ワークフロー順序に従った適切なナビゲーションを提供します。
 * 要件: 10.3 - 入力→確認→確定の順序強制とガイダンス
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Navigation as NavigationIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  WorkflowProgress,
  WorkflowStage,
  TransitionControl,
} from '../../services/workflow/workflowOrderService.js';
import { useNavigation } from '../../contexts/NavigationContext.js';

interface WorkflowNavigationProps {
  progress: WorkflowProgress;
  transactionId?: string;
  currentPath: string;
  onNavigate?: (path: string) => void;
  showBlockedDialog?: boolean;
}

interface NavigationOption {
  stage: WorkflowStage;
  label: string;
  path: string;
  description: string;
  isAvailable: boolean;
  isRecommended: boolean;
  icon: React.ReactNode;
}

export const WorkflowNavigation: React.FC<WorkflowNavigationProps> = ({
  progress,
  transactionId,
  currentPath,
  onNavigate,
  showBlockedDialog = true,
}) => {
  const navigate = useNavigate();
  const { navigateWithData } = useNavigation();

  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<NavigationOption | null>(
    null
  );

  // ナビゲーションオプションの定義
  const getNavigationOptions = (): NavigationOption[] => {
    const options: NavigationOption[] = [
      {
        stage: WorkflowStage.INPUT,
        label: '取引入力',
        path: '/transactions/input',
        description: '新しい取引を入力または既存の取引を修正',
        isAvailable: true,
        isRecommended: progress.currentStage === WorkflowStage.INPUT,
        icon: <NavigationIcon />,
      },
      {
        stage: WorkflowStage.VERIFICATION,
        label: '取引検証',
        path: '/transactions/verification',
        description: 'ダブルチェックによる取引検証',
        isAvailable: progress.completedStages.includes(WorkflowStage.INPUT),
        isRecommended:
          progress.currentStage === WorkflowStage.VERIFICATION &&
          progress.canProceed,
        icon: <CheckCircleIcon />,
      },
      {
        stage: WorkflowStage.CONFIRMATION,
        label: '取引確定',
        path: '/transactions/final-confirmation',
        description: '検証済み取引の最終確定',
        isAvailable: progress.completedStages.includes(
          WorkflowStage.VERIFICATION
        ),
        isRecommended:
          progress.currentStage === WorkflowStage.CONFIRMATION &&
          progress.canProceed,
        icon: <CheckCircleIcon />,
      },
      {
        stage: WorkflowStage.COMPLETED,
        label: '取引履歴',
        path: '/transactions/history',
        description: '完了した取引の履歴確認',
        isAvailable: true,
        isRecommended: progress.currentStage === WorkflowStage.COMPLETED,
        icon: <InfoIcon />,
      },
    ];

    return options;
  };

  // ナビゲーション実行
  const handleNavigate = (option: NavigationOption) => {
    if (!option.isAvailable) {
      setSelectedOption(option);
      if (showBlockedDialog) {
        setBlockedDialogOpen(true);
      }
      return;
    }

    if (onNavigate) {
      onNavigate(option.path);
    } else {
      navigateWithData(option.path);
    }
  };

  // ブロックダイアログを閉じる
  const handleCloseBlockedDialog = () => {
    setBlockedDialogOpen(false);
    setSelectedOption(null);
  };

  // 推奨パスに移動
  const handleNavigateToRecommended = () => {
    const recommendedOption = getNavigationOptions().find(
      opt => opt.isRecommended
    );
    if (recommendedOption) {
      handleNavigate(recommendedOption);
    }
    handleCloseBlockedDialog();
  };

  const navigationOptions = getNavigationOptions();
  const currentOption = navigationOptions.find(opt =>
    currentPath.includes(opt.path.split('/').pop() || '')
  );
  const recommendedOption = navigationOptions.find(opt => opt.isRecommended);

  return (
    <Box>
      {/* 現在の状況表示 */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <NavigationIcon color="primary" />
            <Typography variant="h6">ワークフローナビゲーション</Typography>
          </Box>

          {/* 現在の段階 */}
          {currentOption && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                現在の段階
              </Typography>
              <Chip
                icon={currentOption.icon}
                label={currentOption.label}
                color="primary"
                variant="filled"
              />
            </Box>
          )}

          {/* ブロック状態の警告 */}
          {!progress.canProceed && progress.blockedReason && (
            <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
              <Typography variant="body2">{progress.blockedReason}</Typography>
            </Alert>
          )}

          {/* 推奨アクション */}
          {recommendedOption && progress.canProceed && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                推奨される次のアクション
              </Typography>
              <Button
                variant="contained"
                startIcon={<ArrowForwardIcon />}
                onClick={() => handleNavigate(recommendedOption)}
                size="large"
                fullWidth
              >
                {recommendedOption.label}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ナビゲーションオプション */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            利用可能な操作
          </Typography>

          <List disablePadding>
            {navigationOptions.map((option, index) => (
              <React.Fragment key={option.stage}>
                <ListItem
                  button={option.isAvailable}
                  onClick={() => handleNavigate(option)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: option.isRecommended
                      ? 'primary.50'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: option.isAvailable
                        ? option.isRecommended
                          ? 'primary.100'
                          : 'action.hover'
                        : 'transparent',
                    },
                    opacity: option.isAvailable ? 1 : 0.5,
                    cursor: option.isAvailable ? 'pointer' : 'not-allowed',
                  }}
                >
                  <ListItemIcon>
                    {option.isAvailable ? (
                      option.icon
                    ) : (
                      <BlockIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight={option.isRecommended ? 'bold' : 'normal'}
                        >
                          {option.label}
                        </Typography>
                        {option.isRecommended && (
                          <Chip
                            label="推奨"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {!option.isAvailable && (
                          <Chip
                            label="利用不可"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={option.description}
                  />
                </ListItem>
                {index < navigationOptions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* ブロックダイアログ */}
      <Dialog
        open={blockedDialogOpen}
        onClose={handleCloseBlockedDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            操作が制限されています
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedOption && (
              <>
                <strong>{selectedOption.label}</strong> は現在利用できません。
                <br />
                ワークフローの順序に従って処理を進めてください。
              </>
            )}
          </DialogContentText>

          {progress.blockedReason && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {progress.blockedReason}
            </Alert>
          )}

          {recommendedOption && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                推奨される操作:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {recommendedOption.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {recommendedOption.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlockedDialog}>キャンセル</Button>
          {recommendedOption && (
            <Button
              onClick={handleNavigateToRecommended}
              variant="contained"
              startIcon={<ArrowForwardIcon />}
            >
              {recommendedOption.label}に移動
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowNavigation;
