/**
 * 統一されたメッセージ表示コンポーネント
 * 要件 8.5, 9.2, 9.3, 9.4 に対応
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Snackbar,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  WarningAmberOutlined,
  InfoOutlined,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

/**
 * メッセージの種類
 */
export enum MessageType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * メッセージの重要度
 */
export enum MessageSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * エラー詳細情報
 */
export interface ErrorDetail {
  field?: string;
  code: string;
  message: string;
  guidance?: string;
}

/**
 * メッセージデータ
 */
export interface MessageData {
  id?: string;
  type: MessageType;
  severity?: MessageSeverity;
  title?: string;
  message: string;
  details?: ErrorDetail[];
  guidance?: string;
  autoHide?: boolean;
  autoHideDuration?: number;
  actions?: React.ReactNode;
}

/**
 * メッセージ表示プロパティ
 */
interface MessageDisplayProps {
  message: MessageData;
  onClose?: () => void;
  showDetails?: boolean;
  variant?: 'inline' | 'toast';
}

/**
 * インラインメッセージ表示コンポーネント
 */
export const InlineMessage: React.FC<MessageDisplayProps> = ({
  message,
  onClose,
  showDetails = true,
}) => {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const getIcon = (type: MessageType) => {
    switch (type) {
      case MessageType.SUCCESS:
        return <CheckCircleOutline />;
      case MessageType.ERROR:
        return <ErrorOutline />;
      case MessageType.WARNING:
        return <WarningAmberOutlined />;
      case MessageType.INFO:
        return <InfoOutlined />;
      default:
        return <InfoOutlined />;
    }
  };

  const getSeverityColor = (severity?: MessageSeverity) => {
    switch (severity) {
      case MessageSeverity.CRITICAL:
        return 'error';
      case MessageSeverity.HIGH:
        return 'error';
      case MessageSeverity.MEDIUM:
        return 'warning';
      case MessageSeverity.LOW:
        return 'info';
      default:
        return message.type;
    }
  };

  return (
    <Alert
      severity={getSeverityColor(message.severity) as any}
      onClose={onClose}
      icon={getIcon(message.type)}
      sx={{ mb: 2 }}
    >
      {message.title && <AlertTitle>{message.title}</AlertTitle>}

      <Typography
        variant="body2"
        sx={{ mb: message.guidance || message.details ? 1 : 0 }}
      >
        {message.message}
      </Typography>

      {/* ガイダンス表示 */}
      {message.guidance && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>解決方法:</strong> {message.guidance}
        </Typography>
      )}

      {/* エラー詳細表示 */}
      {showDetails && message.details && message.details.length > 0 && (
        <Box>
          <Box
            display="flex"
            alignItems="center"
            sx={{ cursor: 'pointer', mb: 1 }}
            onClick={() => setDetailsExpanded(!detailsExpanded)}
          >
            <Typography variant="body2" sx={{ mr: 1 }}>
              詳細情報
            </Typography>
            {detailsExpanded ? <ExpandLess /> : <ExpandMore />}
          </Box>

          <Collapse in={detailsExpanded}>
            <List dense>
              {message.details.map((detail, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ErrorOutline fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={detail.message}
                    secondary={
                      <Box>
                        {detail.field && (
                          <Typography variant="caption" display="block">
                            フィールド: {detail.field}
                          </Typography>
                        )}
                        {detail.code && (
                          <Typography variant="caption" display="block">
                            エラーコード: {detail.code}
                          </Typography>
                        )}
                        {detail.guidance && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="primary"
                          >
                            対処法: {detail.guidance}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      )}

      {/* カスタムアクション */}
      {message.actions && <Box sx={{ mt: 1 }}>{message.actions}</Box>}
    </Alert>
  );
};

/**
 * トーストメッセージ表示コンポーネント
 */
export const ToastMessage: React.FC<MessageDisplayProps> = ({
  message,
  onClose,
}) => {
  const [open, setOpen] = React.useState(true);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    onClose?.();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={
        message.autoHide !== false ? message.autoHideDuration || 6000 : null
      }
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={message.type}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message.title && <AlertTitle>{message.title}</AlertTitle>}
        {message.message}
      </Alert>
    </Snackbar>
  );
};

/**
 * 統一メッセージ表示コンポーネント
 */
export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  variant = 'inline',
  ...props
}) => {
  if (variant === 'toast') {
    return <ToastMessage {...props} />;
  }
  return <InlineMessage {...props} />;
};

/**
 * メッセージ作成ヘルパー関数
 */
export const createMessage = {
  success: (message: string, options?: Partial<MessageData>): MessageData => ({
    type: MessageType.SUCCESS,
    message,
    autoHide: true,
    autoHideDuration: 4000,
    ...options,
  }),

  error: (message: string, options?: Partial<MessageData>): MessageData => ({
    type: MessageType.ERROR,
    severity: MessageSeverity.HIGH,
    message,
    autoHide: false,
    ...options,
  }),

  warning: (message: string, options?: Partial<MessageData>): MessageData => ({
    type: MessageType.WARNING,
    severity: MessageSeverity.MEDIUM,
    message,
    autoHide: false,
    ...options,
  }),

  info: (message: string, options?: Partial<MessageData>): MessageData => ({
    type: MessageType.INFO,
    severity: MessageSeverity.LOW,
    message,
    autoHide: true,
    autoHideDuration: 6000,
    ...options,
  }),

  validationError: (
    message: string,
    details: ErrorDetail[],
    options?: Partial<MessageData>
  ): MessageData => ({
    type: MessageType.ERROR,
    severity: MessageSeverity.MEDIUM,
    title: '入力検証エラー',
    message,
    details,
    guidance: '以下の項目を確認して、再度お試しください。',
    autoHide: false,
    ...options,
  }),

  businessRuleError: (
    message: string,
    guidance: string,
    options?: Partial<MessageData>
  ): MessageData => ({
    type: MessageType.ERROR,
    severity: MessageSeverity.HIGH,
    title: 'ビジネスルール違反',
    message,
    guidance,
    autoHide: false,
    ...options,
  }),

  systemError: (
    message?: string,
    options?: Partial<MessageData>
  ): MessageData => ({
    type: MessageType.ERROR,
    severity: MessageSeverity.CRITICAL,
    title: 'システムエラー',
    message:
      message ||
      'システムで問題が発生しました。しばらく時間をおいて再度お試しください。',
    guidance: '問題が継続する場合は、システム管理者にお問い合わせください。',
    autoHide: false,
    ...options,
  }),
};

export default MessageDisplay;
