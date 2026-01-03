/**
 * 取引履歴一覧コンポーネント
 *
 * 完了取引の一覧表示、ページネーション機能、取引詳細の表示を提供します。
 * 要件: 7.1, 7.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionSearchCriteria,
} from '../../types/transaction.js';
import { UserSession } from '../../types/auth.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';

interface TransactionHistoryProps {
  session: UserSession;
}

interface SortConfig {
  key: keyof Transaction;
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 20;

const TransactionHistory: React.FC<TransactionHistoryProps> = () => {
  const transactionService =
    ServiceFactory.getInstance().getTransactionService();

  // 状態管理
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'confirmedAt',
    direction: 'desc',
  });

  // 取引詳細ダイアログ
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 取引履歴の取得
  const loadTransactionHistory = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError('');

        // 確定済み取引のみを取得する検索条件
        const criteria: TransactionSearchCriteria = {
          status: TransactionStatus.CONFIRMED,
        };

        const result = await transactionService.getTransactionHistoryPaginated(
          criteria,
          { page, limit: ITEMS_PER_PAGE }
        );

        setTransactions(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.total);
        setCurrentPage(page);
      } catch (err) {
        console.error('取引履歴の取得に失敗しました:', err);
        setError(
          err instanceof Error
            ? err.message
            : '取引履歴の取得に失敗しました。ページを再読み込みしてください。'
        );
      } finally {
        setLoading(false);
      }
    },
    [transactionService]
  );

  // 初期データ読み込み
  useEffect(() => {
    loadTransactionHistory(1);
  }, [loadTransactionHistory]);

  // ページ変更ハンドラー
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    loadTransactionHistory(page);
  };

  // ソートハンドラー
  const handleSort = (key: keyof Transaction) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    setSortConfig({ key, direction });

    // ローカルソート（実際のAPIではサーバーサイドソートが推奨）
    const sortedTransactions = [...transactions].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setTransactions(sortedTransactions);
  };

  // 取引詳細表示
  const handleViewDetail = async (transaction: Transaction) => {
    // 既存のデータを使用（追加のAPI呼び出しなし）
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  // 取引詳細ダイアログを閉じる
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedTransaction(null);
  };

  // 取引タイプのラベル取得
  const getTransactionTypeLabel = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.TRANSFER:
        return '振込';
      case TransactionType.DEPOSIT:
        return '入金';
      case TransactionType.WITHDRAWAL:
        return '出金';
      default:
        return '不明';
    }
  };

  // 取引タイプの色取得
  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.TRANSFER:
        return 'primary';
      case TransactionType.DEPOSIT:
        return 'success';
      case TransactionType.WITHDRAWAL:
        return 'warning';
      default:
        return 'default';
    }
  };

  // 日時フォーマット
  const formatDateTime = (date: Date | undefined): string => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // 金額フォーマット
  const formatAmount = (amount: number): string => {
    return `¥${amount.toLocaleString()}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>取引履歴を読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        取引履歴
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        確定済みの取引履歴を表示しています。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* 統計情報 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              取引統計
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {totalCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総取引件数
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {
                      transactions.filter(
                        t => t.type === TransactionType.DEPOSIT
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    入金取引
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {
                      transactions.filter(
                        t => t.type === TransactionType.WITHDRAWAL
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    出金取引
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* 取引一覧テーブル */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'confirmedAt'}
                      direction={
                        sortConfig.key === 'confirmedAt'
                          ? sortConfig.direction
                          : 'asc'
                      }
                      onClick={() => handleSort('confirmedAt')}
                    >
                      確定日時
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'type'}
                      direction={
                        sortConfig.key === 'type' ? sortConfig.direction : 'asc'
                      }
                      onClick={() => handleSort('type')}
                    >
                      取引種別
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'amount'}
                      direction={
                        sortConfig.key === 'amount'
                          ? sortConfig.direction
                          : 'asc'
                      }
                      onClick={() => handleSort('amount')}
                    >
                      金額
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>取引内容</TableCell>
                  <TableCell>処理者</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        取引履歴がありません
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map(transaction => (
                    <TableRow key={transaction.transactionId} hover>
                      <TableCell>
                        {formatDateTime(transaction.confirmedAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTransactionTypeLabel(transaction.type)}
                          color={getTransactionTypeColor(transaction.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatAmount(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {transaction.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.confirmedBy || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="詳細を表示">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(transaction)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ページネーション */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                disabled={loading}
              />
            </Box>
          )}

          {/* ページ情報 */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {totalCount > 0 && (
                <>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} 件目 （全{' '}
                  {totalCount} 件）
                </>
              )}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 取引詳細ダイアログ */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          取引詳細
          {selectedTransaction && (
            <Typography variant="body2" color="text.secondary">
              取引ID: {selectedTransaction.transactionId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  取引種別
                </Typography>
                <Chip
                  label={getTransactionTypeLabel(selectedTransaction.type)}
                  color={getTransactionTypeColor(selectedTransaction.type)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  金額
                </Typography>
                <Typography variant="h6">
                  {formatAmount(selectedTransaction.amount)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  取引内容
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  作成者
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.createdBy}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  確定者
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.confirmedBy || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  作成日時
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(selectedTransaction.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  確定日時
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(selectedTransaction.confirmedAt)}
                </Typography>
              </Grid>
              {selectedTransaction.sourceAccountId && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    振込元口座ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.sourceAccountId}
                  </Typography>
                </Grid>
              )}
              {selectedTransaction.destinationAccountId && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    振込先口座ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.destinationAccountId}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionHistory;
