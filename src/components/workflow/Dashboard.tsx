/**
 * ダッシュボードコンポーネント
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Collapse,
  ListItemButton,
} from '@mui/material';
import {
  AccountBalanceOutlined,
  PeopleOutline,
  ReceiptLongOutlined,
  HistoryOutlined,
  SecurityOutlined,
  ExpandLess,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material';
import { UserSession, UserRole } from '../../types/auth.js';
import { PATHS } from '../../constants/paths.js';

interface DashboardProps {
  session: UserSession;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const handleExpandClick = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const features = [
    {
      icon: <SecurityOutlined />,
      title: 'ユーザー認証・セッション管理',
      description: '安全なログインとセッション管理機能',
      action: null,
    },
    {
      icon: <PeopleOutline />,
      title: '顧客情報管理',
      description: '顧客の登録、更新、検索機能',
      action: () => navigate(PATHS.CUSTOMER_LIST),
    },
    {
      icon: <AccountBalanceOutlined />,
      title: '口座管理',
      description: '口座の開設、管理、残高照会機能',
      action: () => navigate(PATHS.ACCOUNT_LIST),
    },
    {
      icon: <ReceiptLongOutlined />,
      title: '取引処理ワークフロー',
      description: '多段階承認による取引処理システム',
      action: () => navigate(PATHS.TRANSACTION_INPUT),
      subItems: [
        {
          title: '取引入力',
          description: '新規取引の入力',
          action: () => navigate(PATHS.TRANSACTION_INPUT),
        },
        {
          title: '取引検証',
          description: '取引のダブルチェック',
          action: () => navigate(PATHS.TRANSACTION_VERIFICATION),
        },
        ...(session.userRole === UserRole.ADMINISTRATOR
          ? [
              {
                title: '取引確定',
                description: '検証済み取引の確定処理',
                action: () => navigate(PATHS.TRANSACTION_FINAL_CONFIRMATION),
              },
            ]
          : []),
      ],
    },
    {
      icon: <HistoryOutlined />,
      title: '取引履歴照会',
      description: '過去の取引履歴の検索と表示機能',
      action: null,
    },
  ];

  const roleText =
    session.userRole === UserRole.ADMINISTRATOR ? '管理者' : '一般行員';

  return (
    <Box>
      {/* ウェルカムメッセージ */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            金融系業務アプリケーションへようこそ
          </Typography>
          <Typography variant="h6" gutterBottom>
            ログインが完了しました
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            利用者区分: {roleText}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            利用者ID: {session.userId}
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary">
            サンプル顧客、口座、取引データが利用可能です。
          </Typography>
        </CardContent>
      </Card>

      {/* 利用可能な機能 */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom color="primary">
          利用可能な機能
        </Typography>
        <List>
          {features.map((feature, index) => (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={
                    feature.subItems
                      ? () => handleExpandClick(index)
                      : feature.action || undefined
                  }
                  sx={{
                    cursor:
                      feature.action || feature.subItems
                        ? 'pointer'
                        : 'default',
                  }}
                >
                  <ListItemIcon>{feature.icon}</ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                  />
                  {feature.subItems &&
                    (expandedItems.includes(index) ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    ))}
                </ListItemButton>
              </ListItem>

              {feature.subItems && (
                <Collapse
                  in={expandedItems.includes(index)}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {feature.subItems.map((subItem, subIndex) => (
                      <ListItem key={subIndex} disablePadding>
                        <ListItemButton sx={{ pl: 4 }} onClick={subItem.action}>
                          <ListItemIcon>
                            <ChevronRight />
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.title}
                            secondary={subItem.description}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {index < features.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Dashboard;
