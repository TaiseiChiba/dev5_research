/**
 * メッセージ・確認ダイアログの使用例コンポーネント
 * 実装の参考用
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  MessageDisplay,
  createMessage,
  MessageType,
  MessageSeverity,
  useMessage,
  useNotification,
  ConfirmationDialog,
  ConfirmationType,
  ConfirmationSeverity,
  createConfirmation,
  ValidatedTextField,
  CommonValidations,
  FormValidator,
  type ConfirmationDialogProps,
  type ErrorDetail,
} from './index';

/**
 * メッセージ表示例コンポーネント
 */
export const MessageExample: React.FC = () => {
  const { showMessage } = useMessage();
  const notification = useNotification();
  const [inlineMessage, setInlineMessage] = useState<any>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    props: Partial<ConfirmationDialogProps>;
  }>({ open: false, props: {} });

  // フォーム検証の例
  const [formData, setFormData] = useState({
    customerName: '',
    phoneticName: '',
    email: '',
    amount: '',
  });

  const formValidator = new FormValidator({
    customerName: CommonValidations.customerName,
    phoneticName: CommonValidations.phoneticName,
    email: CommonValidations.email,
    amount: CommonValidations.amount,
  });

  const handleShowInlineMessage = (type: MessageType) => {
    const messages = {
      [MessageType.SUCCESS]: createMessage.success(
        '操作が正常に完了しました。',
        { title: '成功' }
      ),
      [MessageType.ERROR]: createMessage.error('エラーが発生しました。', {
        title: 'エラー',
        guidance: 'システム管理者にお問い合わせください。',
      }),
      [MessageType.WARNING]: createMessage.warning('注意が必要な状況です。', {
        title: '警告',
      }),
      [MessageType.INFO]: createMessage.info('情報をお知らせします。', {
        title: '情報',
      }),
    };

    setInlineMessage(messages[type]);
  };

  const handleShowToastMessage = (type: MessageType) => {
    switch (type) {
      case MessageType.SUCCESS:
        notification.success('取引が正常に処理されました。');
        break;
      case MessageType.ERROR:
        notification.error('処理中にエラーが発生しました。');
        break;
      case MessageType.WARNING:
        notification.warning('残高が不足しています。');
        break;
      case MessageType.INFO:
        notification.info('新しい通知があります。');
        break;
    }
  };

  const handleShowValidationError = () => {
    const errors: ErrorDetail[] = [
      {
        field: 'customerName',
        code: 'REQUIRED',
        message: '顧客名は必須です。',
        guidance: '顧客名を入力してください。',
      },
      {
        field: 'amount',
        code: 'MAX_VALUE',
        message: '金額が上限を超えています。',
        guidance: '1億円以下の金額を入力してください。',
      },
    ];

    const message = createMessage.validationError(
      '入力内容に問題があります。',
      errors
    );

    setInlineMessage(message);
  };

  const handleShowConfirmation = (type: ConfirmationType) => {
    const confirmations = {
      [ConfirmationType.DELETE]: createConfirmation.delete(
        '選択された顧客を削除しますか？',
        {
          items: [
            { label: '顧客名', value: '田中太郎' },
            { label: '顧客番号', value: '12345678' },
          ],
        }
      ),
      [ConfirmationType.SAVE]:
        createConfirmation.save('入力内容を保存しますか？'),
      [ConfirmationType.SUBMIT]: createConfirmation.submit(
        '取引を送信しますか？',
        [
          { label: '取引種別', value: '振込' },
          { label: '金額', value: '¥100,000', important: true },
          { label: '振込先', value: '山田花子' },
        ]
      ),
      [ConfirmationType.APPROVE]: createConfirmation.approve(
        '取引を承認しますか？',
        [
          { label: '取引ID', value: 'TXN-001' },
          { label: '金額', value: '¥500,000', important: true },
        ]
      ),
      [ConfirmationType.REJECT]:
        createConfirmation.reject('取引を却下しますか？'),
    };

    setConfirmationDialog({
      open: true,
      props: {
        ...confirmations[type],
        onConfirm: async () => {
          // 処理のシミュレーション
          await new Promise(resolve => setTimeout(resolve, 1000));
          setConfirmationDialog({ open: false, props: {} });
          notification.success('操作が完了しました。');
        },
        onCancel: () => {
          setConfirmationDialog({ open: false, props: {} });
        },
      },
    });
  };

  const handleFormSubmit = () => {
    const validation = formValidator.validateForm(formData);

    if (!validation.isValid) {
      const message = createMessage.validationError(
        'フォームの入力内容に問題があります。',
        validation.errors
      );
      setInlineMessage(message);
    } else {
      notification.success('フォームの検証が成功しました。');
      setInlineMessage(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        メッセージ・確認ダイアログの使用例
      </Typography>

      <Grid container spacing={3}>
        {/* インラインメッセージの例 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                インラインメッセージ
              </Typography>

              {inlineMessage && (
                <MessageDisplay
                  message={inlineMessage}
                  onClose={() => setInlineMessage(null)}
                  variant="inline"
                />
              )}

              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => handleShowInlineMessage(MessageType.SUCCESS)}
                >
                  成功メッセージ
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleShowInlineMessage(MessageType.ERROR)}
                >
                  エラーメッセージ
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => handleShowInlineMessage(MessageType.WARNING)}
                >
                  警告メッセージ
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => handleShowInlineMessage(MessageType.INFO)}
                >
                  情報メッセージ
                </Button>
                <Button variant="outlined" onClick={handleShowValidationError}>
                  検証エラー
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* トーストメッセージの例 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                トーストメッセージ
              </Typography>

              <Stack spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleShowToastMessage(MessageType.SUCCESS)}
                >
                  成功トースト
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleShowToastMessage(MessageType.ERROR)}
                >
                  エラートースト
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => handleShowToastMessage(MessageType.WARNING)}
                >
                  警告トースト
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => handleShowToastMessage(MessageType.INFO)}
                >
                  情報トースト
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 確認ダイアログの例 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                確認ダイアログ
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() =>
                    handleShowConfirmation(ConfirmationType.DELETE)
                  }
                >
                  削除確認
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleShowConfirmation(ConfirmationType.SAVE)}
                >
                  保存確認
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() =>
                    handleShowConfirmation(ConfirmationType.SUBMIT)
                  }
                >
                  送信確認
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() =>
                    handleShowConfirmation(ConfirmationType.APPROVE)
                  }
                >
                  承認確認
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() =>
                    handleShowConfirmation(ConfirmationType.REJECT)
                  }
                >
                  却下確認
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* フォーム検証の例 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                フォーム検証
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    fullWidth
                    name="customerName"
                    label="顧客名"
                    value={formData.customerName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    validation={CommonValidations.customerName}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    fullWidth
                    name="phoneticName"
                    label="フリガナ"
                    value={formData.phoneticName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        phoneticName: e.target.value,
                      }))
                    }
                    validation={CommonValidations.phoneticName}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    fullWidth
                    name="email"
                    label="メールアドレス"
                    value={formData.email}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    validation={CommonValidations.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    fullWidth
                    name="amount"
                    label="金額"
                    value={formData.amount}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    validation={CommonValidations.amount}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleFormSubmit}>
                    フォーム検証実行
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 確認ダイアログ */}
      <ConfirmationDialog
        {...confirmationDialog.props}
        open={confirmationDialog.open}
        onConfirm={confirmationDialog.props.onConfirm || (() => {})}
        onCancel={confirmationDialog.props.onCancel || (() => {})}
      />
    </Box>
  );
};

export default MessageExample;
