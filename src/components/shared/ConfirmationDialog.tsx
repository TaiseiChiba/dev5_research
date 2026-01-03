/**
 * 確認ダイアログコンポーネント
 * 要件 9.1 に対応 - 破壊的な操作を実行する際の確認ダイアログ
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  WarningAmberOutlined,
  ErrorOutline,
  InfoOutlined,
  CheckCircleOutline,
  DeleteOutline,
  EditOutlined,
  SaveOutlined,
  CancelOutlined,
} from '@mui/icons-material';

/**
 * 確認ダイアログの種類
 */
export enum ConfirmationType {
  DELETE = 'delete',
  EDIT = 'edit',
  SAVE = 'save',
  CANCEL = 'cancel',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  CUSTOM = 'custom',
}

/**
 * 確認ダイアログの重要度
 */
export enum ConfirmationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 確認項目
 */
export interface ConfirmationItem {
  label: string;
  value: string;
  important?: boolean;
}

/**
 * 確認ダイアログのプロパティ
 */
export interface ConfirmationDialogProps {
  open: boolean;
  type: ConfirmationType;
  severity?: ConfirmationSeverity;
  title?: string;
  message: string;
  details?: string;
  items?: ConfirmationItem[];
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 確認ダイアログコンポーネント
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  type,
  severity = ConfirmationSeverity.MEDIUM,
  title,
  message,
  details,
  items,
  warning,
  confirmText,
  cancelText,
  loading = false,
  onConfirm,
  onCancel,
  maxWidth = 'sm',
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const getTypeConfig = (type: ConfirmationType) => {
    switch (type) {
      case ConfirmationType.DELETE:
        return {
          icon: <DeleteOutline />,
          defaultTitle: '削除の確認',
          defaultConfirmText: '削除',
          color: 'error' as const,
          severity: ConfirmationSeverity.HIGH,
        };
      case ConfirmationType.EDIT:
        return {
          icon: <EditOutlined />,
          defaultTitle: '編集の確認',
          defaultConfirmText: '編集',
          color: 'warning' as const,
          severity: ConfirmationSeverity.MEDIUM,
        };
      case ConfirmationType.SAVE:
        return {
          icon: <SaveOutlined />,
          defaultTitle: '保存の確認',
          defaultConfirmText: '保存',
          color: 'primary' as const,
          severity: ConfirmationSeverity.MEDIUM,
        };
      case ConfirmationType.CANCEL:
        return {
          icon: <CancelOutlined />,
          defaultTitle: 'キャンセルの確認',
          defaultConfirmText: 'キャンセル',
          color: 'warning' as const,
          severity: ConfirmationSeverity.MEDIUM,
        };
      case ConfirmationType.SUBMIT:
        return {
          icon: <CheckCircleOutline />,
          defaultTitle: '送信の確認',
          defaultConfirmText: '送信',
          color: 'primary' as const,
          severity: ConfirmationSeverity.MEDIUM,
        };
      case ConfirmationType.APPROVE:
        return {
          icon: <CheckCircleOutline />,
          defaultTitle: '承認の確認',
          defaultConfirmText: '承認',
          color: 'success' as const,
          severity: ConfirmationSeverity.HIGH,
        };
      case ConfirmationType.REJECT:
        return {
          icon: <ErrorOutline />,
          defaultTitle: '却下の確認',
          defaultConfirmText: '却下',
          color: 'error' as const,
          severity: ConfirmationSeverity.HIGH,
        };
      default:
        return {
          icon: <InfoOutlined />,
          defaultTitle: '確認',
          defaultConfirmText: 'OK',
          color: 'primary' as const,
          severity: ConfirmationSeverity.MEDIUM,
        };
    }
  };

  const getSeverityAlert = (severity: ConfirmationSeverity) => {
    switch (severity) {
      case ConfirmationSeverity.CRITICAL:
        return 'error';
      case ConfirmationSeverity.HIGH:
        return 'error';
      case ConfirmationSeverity.MEDIUM:
        return 'warning';
      case ConfirmationSeverity.LOW:
        return 'info';
      default:
        return 'info';
    }
  };

  const typeConfig = getTypeConfig(type);
  const effectiveSeverity = severity || typeConfig.severity;
  const effectiveTitle = title || typeConfig.defaultTitle;
  const effectiveConfirmText = confirmText || typeConfig.defaultConfirmText;
  const effectiveCancelText = cancelText || 'キャンセル';

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDestructive =
    type === ConfirmationType.DELETE ||
    type === ConfirmationType.REJECT ||
    effectiveSeverity === ConfirmationSeverity.HIGH ||
    effectiveSeverity === ConfirmationSeverity.CRITICAL;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">
        <Box display="flex" alignItems="center">
          <Box sx={{ mr: 1, color: `${typeConfig.color}.main` }}>
            {typeConfig.icon}
          </Box>
          {effectiveTitle}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="confirmation-dialog-description" sx={{ mb: 2 }}>
          {message}
        </DialogContentText>

        {details && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {details}
          </Typography>
        )}

        {/* 確認項目の表示 */}
        {items && items.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              確認項目:
            </Typography>
            <List dense>
              {items.map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <InfoOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.value}
                    primaryTypographyProps={{
                      fontWeight: item.important ? 'bold' : 'normal',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* 警告メッセージ */}
        {(warning || isDestructive) && (
          <Alert
            severity={getSeverityAlert(effectiveSeverity)}
            sx={{ mb: 2 }}
            icon={<WarningAmberOutlined />}
          >
            {warning ||
              (isDestructive ? 'この操作は取り消すことができません。' : '')}
          </Alert>
        )}

        {/* 重要度が高い場合の追加警告 */}
        {effectiveSeverity === ConfirmationSeverity.CRITICAL && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              重要: この操作はシステムに重大な影響を与える可能性があります。
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onCancel}
          disabled={isProcessing || loading}
          variant="outlined"
        >
          {effectiveCancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing || loading}
          variant="contained"
          color={typeConfig.color}
          autoFocus={!isDestructive}
        >
          {isProcessing || loading ? '処理中...' : effectiveConfirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * 確認ダイアログ作成ヘルパー関数
 */
export const createConfirmation = {
  delete: (
    message: string,
    options?: Partial<ConfirmationDialogProps>
  ): Omit<ConfirmationDialogProps, 'open' | 'onConfirm' | 'onCancel'> => ({
    type: ConfirmationType.DELETE,
    severity: ConfirmationSeverity.HIGH,
    message,
    warning: 'この操作は取り消すことができません。',
    ...options,
  }),

  edit: (
    message: string,
    options?: Partial<ConfirmationDialogProps>
  ): Omit<ConfirmationDialogProps, 'open' | 'onConfirm' | 'onCancel'> => ({
    type: ConfirmationType.EDIT,
    severity: ConfirmationSeverity.MEDIUM,
    message,
    ...options,
  }),

  save: (
    message: string,
    options?: Partial<ConfirmationDialogProps>
  ): Omit<ConfirmationDialogProps, 'open' | 'onConfirm' | 'onCancel'> => ({
    type: ConfirmationType.SAVE,
    severity: ConfirmationSeverity.MEDIUM,
    message,
    ...options,
  }),

  submit: (
    message: string,
    items?: ConfirmationItem[],
    options?: Partial<ConfirmationDialogProps>
  ): Omit<ConfirmationDialogProps, 'open' | 'onConfirm' | 'onCancel'> => ({
    type: ConfirmationType.SUBMIT,
    severity: ConfirmationSeverity.MEDIUM,
    message,
    items,
    ...options,
  }),

  approve: (
    message: string,
    items?: ConfirmationItem[],
    options?: Partial<ConfirmationDialogProps>
  ): Omit<ConfirmationDialogProps, 'open' | 'onConfirm' | 'onCancel'> => ({
    type: ConfirmationType.APPROVE,
    severity: ConfirmationSeverity.HIGH,
    message,
    items,
    ...options,
  }),

  reject: (
    message: string,
    options?: Partial<ConfirmationDialogProps>
  ): Omit<ConfirmationDialogProps, 'open' | 'onConfirm' | 'onCancel'> => ({
    type: ConfirmationType.REJECT,
    severity: ConfirmationSeverity.HIGH,
    message,
    warning: 'この操作により、取引は差し戻されます。',
    ...options,
  }),
};

export default ConfirmationDialog;
