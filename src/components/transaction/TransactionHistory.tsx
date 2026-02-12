/**
 * 取引履歴一覧コンポーネント
 *
 * 完了取引の一覧表示、ページネーション機能、取引詳細の表示、検索機能を提供します。
 * 要件: 7.1, 7.2, 7.3
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Collapse,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionSearchCriteria,
} from '../../types/transaction.js';
import { Customer } from '../../types/customer.js';
import { Account } from '../../types/account.js';
import { UserSession } from '../../types/auth.js';
import { ServiceFactory } from '../../services/common/serviceFactory.js';

interface TransactionHistoryProps {
  session: UserSession;
}

interface SortConfig {
  key: keyof Transaction;
  direction: 'asc' | 'desc';
}

interface SearchFormData {
  dateFrom: string;
  dateTo: string;
  customerId: string;
  accountId: string;
  transactionType: TransactionType | '';
}

interface SavedSearchCondition {
  name: string;
  criteria: TransactionSearchCriteria;
  createdAt: Date;
}

const ITEMS_PER_PAGE = 20;
const SEARCH_CONDITIONS_STORAGE_KEY = 'transactionHistorySearchConditions';

const TransactionHistory: React.FC<TransactionHistoryProps> = () => {
  const transactionService =
    ServiceFactory.getInstance().getTransactionService();
  const customerService = ServiceFactory.getInstance().getCustomerService();
  const accountService = ServiceFactory.getInstance().getAccountService();

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

  // 検索関連の状態
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    dateFrom: '',
    dateTo: '',
    customerId: '',
    accountId: '',
    transactionType: '',
  });
  const [currentSearchCriteria, setCurrentSearchCriteria] =
    useState<TransactionSearchCriteria>({
      status: TransactionStatus.CONFIRMED,
    });

  // 検索用データ
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingSearchData, setLoadingSearchData] = useState(false);

  // 保存された検索条件
  const [savedConditions, setSavedConditions] = useState<
    SavedSearchCondition[]
  >([]);
  const [saveConditionName, setSaveConditionName] = useState('');

  // 取引詳細ダイアログ
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 取引履歴の取得
  const loadTransactionHistory = useCallback(
    async (page: number = 1, searchCriteria?: TransactionSearchCriteria) => {
      try {
        setLoading(true);
        setError('');

        // 検索条件を使用、なければデフォルトの確定済み取引のみ
        const criteria: TransactionSearchCriteria = searchCriteria || {
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

  // 検索用データの読み込み
  const loadSearchData = useCallback(async () => {
    try {
      setLoadingSearchData(true);
      const [customersData, accountsData] = await Promise.all([
        customerService.searchCustomers({ limit: 100 }),
        accountService.listAccounts(),
      ]);
      setCustomers(customersData);
      setAccounts(accountsData);
    } catch (err) {
      console.error('検索用データの取得に失敗しました:', err);
    } finally {
      setLoadingSearchData(false);
    }
  }, [customerService, accountService]);

  // 保存された検索条件の読み込み
  const loadSavedConditions = useCallback(() => {
    try {
      const saved = localStorage.getItem(SEARCH_CONDITIONS_STORAGE_KEY);
      if (saved) {
        const conditions = JSON.parse(saved).map((condition: any) => ({
          ...condition,
          createdAt: new Date(condition.createdAt),
          criteria: {
            ...condition.criteria,
            dateFrom: condition.criteria.dateFrom
              ? new Date(condition.criteria.dateFrom)
              : undefined,
            dateTo: condition.criteria.dateTo
              ? new Date(condition.criteria.dateTo)
              : undefined,
          },
        }));
        setSavedConditions(conditions);
      }
    } catch (err) {
      console.error('保存された検索条件の読み込みに失敗しました:', err);
    }
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    loadTransactionHistory(1);
    loadSearchData();
    loadSavedConditions();
  }, [loadTransactionHistory, loadSearchData, loadSavedConditions]);

  // ページ変更ハンドラー
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    loadTransactionHistory(page, currentSearchCriteria);
  };

  // 検索フォーム変更ハンドラー
  const handleSearchFormChange = (
    field: keyof SearchFormData,
    value: string
  ) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 検索実行
  const handleSearch = async () => {
    try {
      const criteria: TransactionSearchCriteria = {
        status: TransactionStatus.CONFIRMED,
      };

      // 日付範囲
      if (searchForm.dateFrom) {
        criteria.dateFrom = new Date(searchForm.dateFrom);
      }
      if (searchForm.dateTo) {
        criteria.dateTo = new Date(searchForm.dateTo);
      }

      // 顧客
      if (searchForm.customerId) {
        criteria.customerId = searchForm.customerId;
      }

      // 口座（振込元または振込先）
      if (searchForm.accountId) {
        criteria.accountId = searchForm.accountId;
      }

      // 取引種別
      if (searchForm.transactionType) {
        criteria.type = searchForm.transactionType;
      }

      setCurrentSearchCriteria(criteria);
      await loadTransactionHistory(1, criteria);
      setCurrentPage(1);
    } catch (err) {
      console.error('検索に失敗しました:', err);
      setError('検索に失敗しました。条件を確認してください。');
    }
  };

  // 検索条件クリア
  const handleClearSearch = () => {
    setSearchForm({
      dateFrom: '',
      dateTo: '',
      customerId: '',
      accountId: '',
      transactionType: '',
    });
    const defaultCriteria = { status: TransactionStatus.CONFIRMED };
    setCurrentSearchCriteria(defaultCriteria);
    loadTransactionHistory(1, defaultCriteria);
    setCurrentPage(1);
  };

  // 検索条件保存
  const handleSaveCondition = () => {
    if (!saveConditionName.trim()) {
      setError('検索条件名を入力してください。');
      return;
    }

    const newCondition: SavedSearchCondition = {
      name: saveConditionName.trim(),
      criteria: currentSearchCriteria,
      createdAt: new Date(),
    };

    const updatedConditions = [...savedConditions, newCondition];
    setSavedConditions(updatedConditions);

    try {
      localStorage.setItem(
        SEARCH_CONDITIONS_STORAGE_KEY,
        JSON.stringify(updatedConditions)
      );
      setSaveConditionName('');
      setError('');
    } catch (err) {
      console.error('検索条件の保存に失敗しました:', err);
      setError('検索条件の保存に失敗しました。');
    }
  };

  // 保存された検索条件の適用
  const handleApplySavedCondition = (condition: SavedSearchCondition) => {
    const criteria = condition.criteria;
    setCurrentSearchCriteria(criteria);

    // フォームにも反映
    setSearchForm({
      dateFrom: criteria.dateFrom
        ? criteria.dateFrom.toISOString().split('T')[0]
        : '',
      dateTo: criteria.dateTo
        ? criteria.dateTo.toISOString().split('T')[0]
        : '',
      customerId: criteria.customerId || '',
      accountId: criteria.accountId || criteria.sourceAccountId || '',
      transactionType: criteria.type || '',
    });

    loadTransactionHistory(1, criteria);
    setCurrentPage(1);
  };

  // 保存された検索条件の削除
  const handleDeleteSavedCondition = (index: number) => {
    const updatedConditions = savedConditions.filter((_, i) => i !== index);
    setSavedConditions(updatedConditions);

    try {
      localStorage.setItem(
        SEARCH_CONDITIONS_STORAGE_KEY,
        JSON.stringify(updatedConditions)
      );
    } catch (err) {
      console.error('検索条件の削除に失敗しました:', err);
    }
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
        確定済みの取引履歴を表示しています。検索条件を指定して絞り込むことができます。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* 検索フォーム */}
          <Box sx={{ mb: 3 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">検索条件</Typography>
              <Button
                startIcon={
                  searchExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
                onClick={() => setSearchExpanded(!searchExpanded)}
                variant="outlined"
                size="small"
              >
                {searchExpanded ? '検索を閉じる' : '検索を開く'}
              </Button>
            </Box>

            <Collapse in={searchExpanded}>
              <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
                <Grid container spacing={2}>
                  {/* 期間検索 */}
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="開始日"
                      type="date"
                      value={searchForm.dateFrom}
                      onChange={e =>
                        handleSearchFormChange('dateFrom', e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="終了日"
                      type="date"
                      value={searchForm.dateTo}
                      onChange={e =>
                        handleSearchFormChange('dateTo', e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  {/* 顧客検索 */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      options={customers}
                      getOptionLabel={option =>
                        `${option.name} (${option.customerId})`
                      }
                      value={
                        customers.find(
                          c => c.customerId === searchForm.customerId
                        ) || null
                      }
                      onChange={(_, newValue) =>
                        handleSearchFormChange(
                          'customerId',
                          newValue?.customerId || ''
                        )
                      }
                      loading={loadingSearchData}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="顧客"
                          size="small"
                          fullWidth
                        />
                      )}
                      size="small"
                    />
                  </Grid>

                  {/* 口座検索 */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      options={accounts}
                      getOptionLabel={option =>
                        `${option.accountNumber} (残高: ¥${option.balance.toLocaleString()})`
                      }
                      value={
                        accounts.find(
                          a => a.accountId === searchForm.accountId
                        ) || null
                      }
                      onChange={(_, newValue) =>
                        handleSearchFormChange(
                          'accountId',
                          newValue?.accountId || ''
                        )
                      }
                      loading={loadingSearchData}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="口座"
                          size="small"
                          fullWidth
                        />
                      )}
                      size="small"
                    />
                  </Grid>

                  {/* 取引種別検索 */}
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>取引種別</InputLabel>
                      <Select
                        value={searchForm.transactionType}
                        label="取引種別"
                        onChange={e =>
                          handleSearchFormChange(
                            'transactionType',
                            e.target.value as TransactionType | ''
                          )
                        }
                      >
                        <MenuItem value="">すべて</MenuItem>
                        <MenuItem value={TransactionType.TRANSFER}>
                          振込
                        </MenuItem>
                        <MenuItem value={TransactionType.DEPOSIT}>
                          入金
                        </MenuItem>
                        <MenuItem value={TransactionType.WITHDRAWAL}>
                          出金
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* 検索ボタン */}
                  <Grid item xs={12}>
                    <Box
                      display="flex"
                      justifyContent="center"
                      gap={1}
                      sx={{ mt: 2 }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleSearch}
                        disabled={loading}
                        size="small"
                      >
                        検索
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={handleClearSearch}
                        disabled={loading}
                        size="small"
                      >
                        クリア
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                {/* 検索条件の保存・読み込み */}
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="検索条件名"
                      value={saveConditionName}
                      onChange={e => setSaveConditionName(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="例: 今月の振込取引"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveCondition}
                      disabled={!saveConditionName.trim()}
                      size="small"
                    >
                      保存
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {savedConditions.length > 0 && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          保存された検索条件:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {savedConditions.map((condition, index) => (
                            <Chip
                              key={index}
                              label={condition.name}
                              onClick={() =>
                                handleApplySavedCondition(condition)
                              }
                              onDelete={() => handleDeleteSavedCondition(index)}
                              size="small"
                              variant="outlined"
                              clickable
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>
          </Box>

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
