/**
 * 口座一覧・検索コンポーネント
 *
 * 口座一覧・検索画面の実装
 * 要件: 3.4, 3.5, 3.6
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  Account,
  AccountType,
  AccountStatus,
  AccountSearchCriteria,
  Customer,
} from '../types/index.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { generatePath, PATHS } from '../constants/paths.js';

const AccountList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 状態管理
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);

  // 検索条件の状態
  const [searchCriteria, setSearchCriteria] = useState<AccountSearchCriteria>({
    accountId: '',
    customerId: '',
    accountNumber: '',
    accountType: undefined,
    status: undefined,
  });

  // 表示設定
  const itemsPerPage = 10;

  // サービス取得
  const accountService = ServiceFactory.getInstance().getAccountService();
  const customerService = ServiceFactory.getInstance().getCustomerService();

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, [currentPage]);

  // URLパラメータから顧客IDを取得して初期検索条件を設定
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      setSearchCriteria(prev => ({
        ...prev,
        customerId: customerId,
      }));
    }
  }, [searchParams]);

  // 成功メッセージの処理
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // 状態をクリア
      navigate(location.pathname, { replace: true });
      // 3秒後にメッセージを消す
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [location.state, navigate, location.pathname]);

  /**
   * 初期データを読み込む
   */
  const loadInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      // 顧客一覧を読み込み（検索用）
      const customerResult = await customerService.listCustomers({
        page: 1,
        limit: 1000, // 全顧客を取得
      });
      setCustomers(customerResult.data);

      // 口座一覧を読み込み
      await loadAccounts();
    } catch (err) {
      setError('データの読み込みに失敗しました。');
      console.error('初期データ読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 口座一覧を読み込む
   */
  const loadAccounts = async () => {
    try {
      // 検索条件がない場合は全件取得、ある場合は検索
      const hasSearchCriteria = Object.values(searchCriteria).some(
        value => value !== undefined && value !== ''
      );

      let searchResults: Account[];

      if (hasSearchCriteria) {
        searchResults = await accountService.searchAccounts({
          ...searchCriteria,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        });
      } else {
        searchResults = await accountService.listAccounts();
      }

      setAccounts(searchResults);
      setTotalPages(Math.ceil(searchResults.length / itemsPerPage));
      setTotalAccounts(searchResults.length);
    } catch (err) {
      setError('口座一覧の読み込みに失敗しました。');
      console.error('口座一覧読み込みエラー:', err);
    }
  };

  /**
   * 検索を実行する
   */
  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setCurrentPage(1);

    try {
      // 空の検索条件をフィルタリング
      const filteredCriteria: AccountSearchCriteria = {};

      if (searchCriteria.accountId?.trim()) {
        filteredCriteria.accountId = searchCriteria.accountId.trim();
      }
      if (searchCriteria.customerId?.trim()) {
        filteredCriteria.customerId = searchCriteria.customerId.trim();
      }
      if (searchCriteria.accountNumber?.trim()) {
        filteredCriteria.accountNumber = searchCriteria.accountNumber.trim();
      }
      if (searchCriteria.accountType) {
        filteredCriteria.accountType = searchCriteria.accountType;
      }
      if (searchCriteria.status) {
        filteredCriteria.status = searchCriteria.status;
      }

      // 検索条件がある場合は検索、ない場合は全件取得
      filteredCriteria.limit = itemsPerPage;
      filteredCriteria.offset = 0;

      const searchResults =
        await accountService.searchAccounts(filteredCriteria);
      setAccounts(searchResults);
      setTotalPages(Math.ceil(searchResults.length / itemsPerPage));
      setTotalAccounts(searchResults.length);
    } catch (err) {
      setError('検索に失敗しました。');
      console.error('口座検索エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 口座詳細画面への遷移
   */
  const handleViewDetails = (accountId: string) => {
    navigate(generatePath.accountDetail(accountId));
  };

  /**
   * 口座編集画面への遷移
   */
  const handleEdit = (accountId: string) => {
    navigate(generatePath.accountEdit(accountId));
  };

  /**
   * 顧客詳細画面への遷移
   */
  const handleViewCustomer = (customerId: string) => {
    navigate(generatePath.customerDetail(customerId));
  };

  /**
   * 検索条件をクリアする
   */
  const handleClearSearch = () => {
    setSearchCriteria({
      accountId: '',
      customerId: '',
      accountNumber: '',
      accountType: undefined,
      status: undefined,
    });
    setCurrentPage(1);
    loadAccounts();
  };

  /**
   * ページ変更ハンドラ
   */
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  };

  /**
   * 検索条件の変更ハンドラ
   */
  const handleSearchCriteriaChange = (
    field: keyof AccountSearchCriteria,
    value: any
  ) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * 口座タイプの表示名を取得
   */
  const getAccountTypeLabel = (type: AccountType): string => {
    switch (type) {
      case AccountType.SAVINGS:
        return '普通預金';
      case AccountType.CHECKING:
        return '当座預金';
      case AccountType.FIXED_DEPOSIT:
        return '定期預金';
      case AccountType.LOAN:
        return 'ローン';
      default:
        return type;
    }
  };

  /**
   * 口座状態の表示名を取得
   */
  const getAccountStatusLabel = (status: AccountStatus): string => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return '有効';
      case AccountStatus.CLOSED:
        return '解約済み';
      case AccountStatus.SUSPENDED:
        return '停止中';
      default:
        return status;
    }
  };

  /**
   * 口座状態の色を取得
   */
  const getAccountStatusColor = (status: AccountStatus) => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return 'success';
      case AccountStatus.CLOSED:
        return 'default';
      case AccountStatus.SUSPENDED:
        return 'warning';
      default:
        return 'default';
    }
  };

  /**
   * 顧客名を取得
   */
  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.name : customerId;
  };

  /**
   * 金額をフォーマット
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  /**
   * 日付をフォーマット
   */
  const formatDate = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      // 無効な日付をチェック
      if (isNaN(dateObj.getTime())) {
        return '無効な日付';
      }

      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error, 'Date value:', date);
      return '日付エラー';
    }
  };

  return (
    <Box>
      {/* ページタイトル */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" color="primary">
          口座管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(PATHS.ACCOUNT_CREATE)}
          color="primary"
        >
          新規口座開設
        </Button>
      </Box>

      {/* 検索フォーム */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            口座検索
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="口座ID"
                value={searchCriteria.accountId || ''}
                onChange={e =>
                  handleSearchCriteriaChange('accountId', e.target.value)
                }
                placeholder="ACC001"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="口座番号"
                value={searchCriteria.accountNumber || ''}
                onChange={e =>
                  handleSearchCriteriaChange('accountNumber', e.target.value)
                }
                placeholder="1001-001-12345"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>顧客</InputLabel>
                <Select
                  value={searchCriteria.customerId || ''}
                  label="顧客"
                  onChange={e =>
                    handleSearchCriteriaChange(
                      'customerId',
                      e.target.value || undefined
                    )
                  }
                >
                  <MenuItem value="">すべて</MenuItem>
                  {customers.map(customer => (
                    <MenuItem
                      key={customer.customerId}
                      value={customer.customerId}
                    >
                      {customer.name} ({customer.customerId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>口座種別</InputLabel>
                <Select
                  value={searchCriteria.accountType || ''}
                  label="口座種別"
                  onChange={e =>
                    handleSearchCriteriaChange(
                      'accountType',
                      e.target.value || undefined
                    )
                  }
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value={AccountType.SAVINGS}>普通預金</MenuItem>
                  <MenuItem value={AccountType.CHECKING}>当座預金</MenuItem>
                  <MenuItem value={AccountType.FIXED_DEPOSIT}>
                    定期預金
                  </MenuItem>
                  <MenuItem value={AccountType.LOAN}>ローン</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>状態</InputLabel>
                <Select
                  value={searchCriteria.status || ''}
                  label="状態"
                  onChange={e =>
                    handleSearchCriteriaChange(
                      'status',
                      e.target.value || undefined
                    )
                  }
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value={AccountStatus.ACTIVE}>有効</MenuItem>
                  <MenuItem value={AccountStatus.CLOSED}>解約済み</MenuItem>
                  <MenuItem value={AccountStatus.SUSPENDED}>停止中</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  検索
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearSearch}
                  disabled={loading}
                >
                  クリア
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 成功メッセージ */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 検索結果サマリー */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="body1" color="text.secondary">
          {totalAccounts}件の口座が見つかりました
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ページ {currentPage} / {totalPages}
        </Typography>
      </Box>

      {/* 口座一覧テーブル */}
      <Card elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>口座番号</TableCell>
                <TableCell>顧客名</TableCell>
                <TableCell>口座種別</TableCell>
                <TableCell>状態</TableCell>
                <TableCell align="right">残高</TableCell>
                <TableCell>更新日時</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      口座が見つかりませんでした
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map(account => (
                  <TableRow key={account.accountId} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalanceIcon fontSize="small" color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {account.accountNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {account.accountId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="action" />
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ cursor: 'pointer' }}
                            color="primary"
                            onClick={() =>
                              handleViewCustomer(account.customerId)
                            }
                          >
                            {getCustomerName(account.customerId)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {account.customerId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getAccountTypeLabel(account.accountType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getAccountStatusLabel(account.status)}
                        size="small"
                        color={getAccountStatusColor(account.status) as any}
                        variant={
                          account.status === AccountStatus.ACTIVE
                            ? 'filled'
                            : 'outlined'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={account.balance >= 0 ? 'text.primary' : 'error'}
                      >
                        {formatAmount(account.balance)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(account.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="詳細表示">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(account.accountId)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="編集">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleEdit(account.accountId)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ページネーション */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              disabled={loading}
            />
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default AccountList;
