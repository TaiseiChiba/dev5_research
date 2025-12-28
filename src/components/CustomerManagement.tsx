/**
 * 顧客管理コンポーネント
 *
 * 顧客一覧・検索画面の実装
 * 要件: 2.4, 2.5
 */

import React, { useState, useEffect } from 'react';
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
  Person as PersonIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Customer,
  CustomerType,
  CustomerSearchCriteria,
} from '../types/customer';
import { ServiceFactory } from '../services/serviceFactory';

const CustomerManagement: React.FC = () => {
  // 状態管理
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // 検索条件の状態
  const [searchCriteria, setSearchCriteria] = useState<CustomerSearchCriteria>({
    customerId: '',
    name: '',
    phoneticName: '',
    customerType: undefined,
  });

  // 表示設定
  const itemsPerPage = 10;

  // サービス取得
  const customerService = ServiceFactory.getInstance().getCustomerService();

  // 初期データ読み込み
  useEffect(() => {
    loadCustomers();
  }, [currentPage]);

  /**
   * 顧客一覧を読み込む
   */
  const loadCustomers = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await customerService.listCustomers({
        page: currentPage,
        limit: itemsPerPage,
      });

      setTotalPages(result.totalPages);
      setTotalCustomers(result.total);
    } catch (err) {
      setError('顧客一覧の読み込みに失敗しました。');
      console.error('顧客一覧読み込みエラー:', err);
    } finally {
      setLoading(false);
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
      const filteredCriteria: CustomerSearchCriteria = {};

      if (searchCriteria.customerId?.trim()) {
        filteredCriteria.customerId = searchCriteria.customerId.trim();
      }
      if (searchCriteria.name?.trim()) {
        filteredCriteria.name = searchCriteria.name.trim();
      }
      if (searchCriteria.phoneticName?.trim()) {
        filteredCriteria.phoneticName = searchCriteria.phoneticName.trim();
      }
      if (searchCriteria.customerType) {
        filteredCriteria.customerType = searchCriteria.customerType;
      }

      // 検索条件がある場合は検索、ない場合は全件取得
      if (Object.keys(filteredCriteria).length > 0) {
        filteredCriteria.limit = itemsPerPage;
        filteredCriteria.offset = 0;

        const searchResults =
          await customerService.searchCustomers(filteredCriteria);
        setCustomers(searchResults);
        setTotalPages(Math.ceil(searchResults.length / itemsPerPage));
        setTotalCustomers(searchResults.length);
      } else {
        // 検索条件がない場合は通常の一覧表示
        await loadCustomers();
      }
    } catch (err) {
      setError('検索に失敗しました。');
      console.error('顧客検索エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 検索条件をクリアする
   */
  const handleClearSearch = () => {
    setSearchCriteria({
      customerId: '',
      name: '',
      phoneticName: '',
      customerType: undefined,
    });
    setCurrentPage(1);
    loadCustomers();
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
    field: keyof CustomerSearchCriteria,
    value: any
  ) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * 顧客タイプの表示名を取得
   */
  const getCustomerTypeLabel = (type: CustomerType): string => {
    return type === CustomerType.INDIVIDUAL ? '個人' : '法人';
  };

  /**
   * 顧客タイプのアイコンを取得
   */
  const getCustomerTypeIcon = (type: CustomerType) => {
    return type === CustomerType.INDIVIDUAL ? <PersonIcon /> : <BusinessIcon />;
  };

  /**
   * 日付をフォーマット
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Box>
      {/* ページタイトル */}
      <Typography variant="h4" gutterBottom color="primary">
        顧客管理
      </Typography>

      {/* 検索フォーム */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            顧客検索
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="顧客番号"
                value={searchCriteria.customerId || ''}
                onChange={e =>
                  handleSearchCriteriaChange('customerId', e.target.value)
                }
                placeholder="CUST001"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="氏名・法人名"
                value={searchCriteria.name || ''}
                onChange={e =>
                  handleSearchCriteriaChange('name', e.target.value)
                }
                placeholder="田中太郎"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="カナ"
                value={searchCriteria.phoneticName || ''}
                onChange={e =>
                  handleSearchCriteriaChange('phoneticName', e.target.value)
                }
                placeholder="タナカタロウ"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>顧客区分</InputLabel>
                <Select
                  value={searchCriteria.customerType || ''}
                  label="顧客区分"
                  onChange={e =>
                    handleSearchCriteriaChange(
                      'customerType',
                      e.target.value || undefined
                    )
                  }
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value={CustomerType.INDIVIDUAL}>個人</MenuItem>
                  <MenuItem value={CustomerType.CORPORATE}>法人</MenuItem>
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
          {totalCustomers}件の顧客が見つかりました
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ページ {currentPage} / {totalPages}
        </Typography>
      </Box>

      {/* 顧客一覧テーブル */}
      <Card elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>顧客番号</TableCell>
                <TableCell>氏名・法人名</TableCell>
                <TableCell>カナ</TableCell>
                <TableCell>顧客区分</TableCell>
                <TableCell>連絡先</TableCell>
                <TableCell>登録日時</TableCell>
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
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      顧客が見つかりませんでした
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map(customer => (
                  <TableRow key={customer.customerId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {customer.customerId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{customer.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {customer.phoneticName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getCustomerTypeIcon(customer.customerType)}
                        label={getCustomerTypeLabel(customer.customerType)}
                        size="small"
                        color={
                          customer.customerType === CustomerType.INDIVIDUAL
                            ? 'primary'
                            : 'secondary'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {customer.contactInfo.email && (
                          <Typography variant="caption" display="block">
                            {customer.contactInfo.email}
                          </Typography>
                        )}
                        {customer.contactInfo.phone && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {customer.contactInfo.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(customer.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="詳細表示">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="編集">
                          <IconButton size="small" color="secondary">
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

export default CustomerManagement;
