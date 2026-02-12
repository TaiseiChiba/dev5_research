/**
 * メッセージ管理コンテキスト
 * 要件 9.4 に対応 - 一貫したメッセージングパターン
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { MessageData, MessageType, ToastMessage } from './MessageDisplay';
import { v4 as uuidv4 } from 'uuid';

/**
 * メッセージコンテキストの型定義
 */
interface MessageContextType {
  messages: MessageData[];
  showMessage: (message: Omit<MessageData, 'id'>) => string;
  showSuccess: (message: string, options?: Partial<MessageData>) => string;
  showError: (message: string, options?: Partial<MessageData>) => string;
  showWarning: (message: string, options?: Partial<MessageData>) => string;
  showInfo: (message: string, options?: Partial<MessageData>) => string;
  hideMessage: (id: string) => void;
  clearMessages: () => void;
}

/**
 * メッセージコンテキスト
 */
const MessageContext = createContext<MessageContextType | undefined>(undefined);

/**
 * メッセージプロバイダーのプロパティ
 */
interface MessageProviderProps {
  children: React.ReactNode;
  maxMessages?: number;
}

/**
 * メッセージプロバイダーコンポーネント
 */
export const MessageProvider: React.FC<MessageProviderProps> = ({
  children,
  maxMessages = 5,
}) => {
  const [messages, setMessages] = useState<MessageData[]>([]);

  const showMessage = useCallback(
    (message: Omit<MessageData, 'id'>): string => {
      const id = uuidv4();
      const newMessage: MessageData = {
        ...message,
        id,
      };

      setMessages(prev => {
        const updated = [newMessage, ...prev];
        // 最大メッセージ数を超えた場合、古いメッセージを削除
        return updated.slice(0, maxMessages);
      });

      // 自動非表示が有効な場合、指定時間後にメッセージを削除
      if (newMessage.autoHide !== false) {
        const duration = newMessage.autoHideDuration || 6000;
        setTimeout(() => {
          hideMessage(id);
        }, duration);
      }

      return id;
    },
    [maxMessages]
  );

  const showSuccess = useCallback(
    (message: string, options?: Partial<MessageData>): string => {
      return showMessage({
        type: MessageType.SUCCESS,
        message,
        autoHide: true,
        autoHideDuration: 4000,
        ...options,
      });
    },
    [showMessage]
  );

  const showError = useCallback(
    (message: string, options?: Partial<MessageData>): string => {
      return showMessage({
        type: MessageType.ERROR,
        message,
        autoHide: false,
        ...options,
      });
    },
    [showMessage]
  );

  const showWarning = useCallback(
    (message: string, options?: Partial<MessageData>): string => {
      return showMessage({
        type: MessageType.WARNING,
        message,
        autoHide: false,
        ...options,
      });
    },
    [showMessage]
  );

  const showInfo = useCallback(
    (message: string, options?: Partial<MessageData>): string => {
      return showMessage({
        type: MessageType.INFO,
        message,
        autoHide: true,
        autoHideDuration: 6000,
        ...options,
      });
    },
    [showMessage]
  );

  const hideMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const contextValue: MessageContextType = {
    messages,
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideMessage,
    clearMessages,
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
      {/* トーストメッセージの表示 */}
      {messages.map(message => (
        <ToastMessage
          key={message.id}
          message={message}
          onClose={() => message.id && hideMessage(message.id)}
          variant="toast"
        />
      ))}
    </MessageContext.Provider>
  );
};

/**
 * メッセージコンテキストを使用するためのフック
 */
export const useMessage = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

/**
 * 便利なメッセージ表示フック
 */
export const useNotification = () => {
  const { showSuccess, showError, showWarning, showInfo } = useMessage();

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };
};

export default MessageContext;
