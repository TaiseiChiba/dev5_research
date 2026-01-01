/**
 * 口座API ルート
 */

import express from 'express';
import {
  AccountType,
  AccountStatus,
  PrismaClient,
} from '../../generated/prisma/index.js';

const router = express.Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

console.log('🔵 Accounts router module loaded');

/**
 * 口座一覧取得API
 * GET /api/accounts/list
 */
router.get('/list', async (req, res) => {
  console.log('✅ /accounts/list endpoint hit!');
  try {
    const accounts = await prisma.account.findMany({
      include: {
        customer: {
          select: {
            name: true,
            customerType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('in accounts list, accounts:', accounts.length);

    res.json({
      success: true,
      accounts: accounts,
      count: accounts.length,
      message: '口座情報の取得に成功しました。',
    });
  } catch (error) {
    console.error('Account fetch error:', error);
    res.status(500).json({
      success: false,
      message: '口座情報の取得中にエラーが発生しました。',
    });
  }
});

/**
 * 口座検索API
 * GET /api/accounts/search
 */
router.get('/search', async (req, res) => {
  try {
    const {
      accountId,
      customerId,
      accountNumber,
      accountType,
      status,
      offset,
      limit,
    } = req.query;

    // accountTypeとstatusを適切なEnumに変換
    let validAccountType: AccountType | undefined;
    if (accountType) {
      const typeStr = (accountType as string).toUpperCase();
      if (Object.values(AccountType).includes(typeStr as AccountType)) {
        validAccountType = typeStr as AccountType;
      }
    }

    let validStatus: AccountStatus | undefined;
    if (status) {
      const statusStr = (status as string).toUpperCase();
      if (Object.values(AccountStatus).includes(statusStr as AccountStatus)) {
        validStatus = statusStr as AccountStatus;
      }
    }

    const accounts = await prisma.account.findMany({
      where: {
        ...(accountId && { accountId: accountId as string }),
        ...(customerId && { customerId: customerId as string }),
        ...(accountNumber && {
          accountNumber: {
            contains: accountNumber as string,
            mode: 'insensitive',
          },
        }),
        ...(validAccountType && { accountType: validAccountType }),
        ...(validStatus && { status: validStatus }),
      },
      include: {
        customer: {
          select: {
            name: true,
            customerType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset ? parseInt(offset as string) : 0,
      take: limit ? parseInt(limit as string) : 50,
    });

    res.json({
      success: true,
      accounts: accounts,
      count: accounts.length,
      message: '口座情報の取得に成功しました。',
    });
  } catch (error) {
    console.error('Account search error:', error);
    res.status(500).json({
      success: false,
      message: '口座検索中にエラーが発生しました。',
    });
  }
});

/**
 * 口座詳細取得API
 * GET /api/accounts/details
 */
router.get('/details', async (req, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountIdが必要です。',
      });
    }

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId as string,
      },
      include: {
        customer: {
          select: {
            customerId: true,
            name: true,
            phoneticName: true,
            customerType: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: '口座が見つかりません。',
      });
    }

    res.json({
      success: true,
      account: account,
      message: '口座情報の取得に成功しました。',
    });
  } catch (error) {
    console.error('Account details error:', error);
    res.status(500).json({
      success: false,
      message: '口座詳細の取得中にエラーが発生しました。',
    });
  }
});

/**
 * 顧客別口座取得API
 * GET /api/accounts/customer/:customerId
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const accounts = await prisma.account.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        customer: {
          select: {
            name: true,
            customerType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      accounts: accounts,
      count: accounts.length,
      message: '顧客の口座情報の取得に成功しました。',
    });
  } catch (error) {
    console.error('Customer accounts error:', error);
    res.status(500).json({
      success: false,
      message: '顧客の口座情報取得中にエラーが発生しました。',
    });
  }
});

/**
 * 口座残高取得API
 * GET /api/accounts/:accountId/balance
 */
router.get('/:accountId/balance', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
      },
      select: {
        accountId: true,
        accountNumber: true,
        balance: true,
        updatedAt: true,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: '口座が見つかりません。',
      });
    }

    res.json({
      success: true,
      balance: {
        accountId: account.accountId,
        accountNumber: account.accountNumber,
        balance: parseFloat(account.balance.toString()),
        availableBalance: parseFloat(account.balance.toString()), // 簡易版では同じ値
        lastUpdated: account.updatedAt,
      },
      message: '口座残高の取得に成功しました。',
    });
  } catch (error) {
    console.error('Account balance error:', error);
    res.status(500).json({
      success: false,
      message: '口座残高の取得中にエラーが発生しました。',
    });
  }
});

/**
 * 口座開設API
 * POST /api/accounts
 */
router.post('/', async (req, res) => {
  try {
    const { customerId, accountType, initialBalance } = req.body;

    // バリデーション
    if (!customerId || !accountType) {
      return res.status(400).json({
        success: false,
        message: '必須項目が不足しています。',
      });
    }

    // 顧客の存在確認
    const customer = await prisma.customer.findFirst({
      where: {
        customerId: customerId,
        isDeleted: false,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '指定された顧客が見つかりません。',
      });
    }

    // accountTypeを適切なEnumに変換
    const validAccountType = accountType.toUpperCase() as AccountType;
    if (!Object.values(AccountType).includes(validAccountType)) {
      return res.status(400).json({
        success: false,
        message: '無効な口座タイプです。',
      });
    }

    // 口座番号を生成（CUST部分を除いた数字 + タイムスタンプ + ランダム）
    const customerNum = customerId.replace('CUST', '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');
    const accountNumber = `${customerNum}-${timestamp}-${random}`;

    // 口座IDを生成
    const accountId = `ACC${Date.now()}`;

    // 口座作成
    const account = await prisma.account.create({
      data: {
        accountId,
        customerId,
        accountNumber,
        accountType: validAccountType,
        status: AccountStatus.ACTIVE,
        balance: initialBalance || 0,
      },
      include: {
        customer: {
          select: {
            name: true,
            customerType: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      account,
      message: '口座が正常に開設されました。',
    });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({
      success: false,
      message: '口座開設中にエラーが発生しました。',
    });
  }
});

/**
 * 口座更新API
 * PUT /api/accounts/:accountId
 */
router.put('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { accountType, status } = req.body;

    // 口座の存在確認
    const existingAccount = await prisma.account.findFirst({
      where: { accountId },
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: '口座が見つかりません。',
      });
    }

    // 更新データの準備
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (accountType) {
      const validAccountType = accountType.toUpperCase() as AccountType;
      if (!Object.values(AccountType).includes(validAccountType)) {
        return res.status(400).json({
          success: false,
          message: '無効な口座タイプです。',
        });
      }
      updateData.accountType = validAccountType;
    }

    if (status) {
      const validStatus = status.toUpperCase() as AccountStatus;
      if (!Object.values(AccountStatus).includes(validStatus)) {
        return res.status(400).json({
          success: false,
          message: '無効な口座状態です。',
        });
      }
      updateData.status = validStatus;
    }

    // 口座更新
    const updatedAccount = await prisma.account.update({
      where: { accountId },
      data: updateData,
      include: {
        customer: {
          select: {
            name: true,
            customerType: true,
          },
        },
      },
    });

    res.json({
      success: true,
      account: updatedAccount,
      message: '口座情報が正常に更新されました。',
    });
  } catch (error) {
    console.error('Account update error:', error);
    res.status(500).json({
      success: false,
      message: '口座更新中にエラーが発生しました。',
    });
  }
});

/**
 * 口座解約API
 * DELETE /api/accounts/:accountId
 */
router.delete('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    // 口座の存在確認
    const existingAccount = await prisma.account.findFirst({
      where: { accountId },
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: '口座が見つかりません。',
      });
    }

    // 残高チェック
    if (parseFloat(existingAccount.balance.toString()) !== 0) {
      return res.status(400).json({
        success: false,
        message: '残高がゼロでないため、口座を解約できません。',
      });
    }

    // 進行中の取引があるかチェック
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId },
        ],
        status: {
          not: 'CONFIRMED',
        },
      },
    });

    if (pendingTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: '進行中の取引があるため、口座を解約できません。',
      });
    }

    // 口座状態を解約済みに変更
    await prisma.account.update({
      where: { accountId },
      data: {
        status: AccountStatus.CLOSED,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: '口座が正常に解約されました。',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Account closure error:', error);
    res.status(500).json({
      success: false,
      message: '口座解約中にエラーが発生しました。',
    });
  }
});

export default router;
