/**
 * 取引管理API
 */

import express from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 取引作成
 * POST /api/transactions
 */
router.post('/', async (req, res) => {
  try {
    const {
      type,
      sourceAccountId,
      destinationAccountId,
      amount,
      description,
      createdBy,
    } = req.body;

    // 必須項目チェック
    if (!type || !amount || !description || !createdBy) {
      return res.status(400).json({
        success: false,
        message: '必須項目が不足しています。',
      });
    }

    // 口座の存在確認
    if (sourceAccountId) {
      const sourceAccount = await prisma.account.findUnique({
        where: { accountId: sourceAccountId },
      });
      if (!sourceAccount || sourceAccount.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: '振込元口座が見つからないか、無効な状態です。',
        });
      }
    }

    if (destinationAccountId) {
      const destAccount = await prisma.account.findUnique({
        where: { accountId: destinationAccountId },
      });
      if (!destAccount || destAccount.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: '振込先口座が見つからないか、無効な状態です。',
        });
      }
    }

    // 取引作成
    const transaction = await prisma.transaction.create({
      data: {
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        transactionType: type.toUpperCase() as any,
        sourceAccountId,
        destinationAccountId,
        amount: parseFloat(amount),
        description,
        status: 'PENDING_VERIFICATION',
        createdBy,
      },
    });

    res.json({
      success: true,
      data: transaction,
      message: '取引が正常に作成されました。',
    });
  } catch (error) {
    console.error('取引作成エラー:', error);
    res.status(500).json({
      success: false,
      message: '取引作成中にエラーが発生しました。',
    });
  }
});

/**
 * 検証待ち取引取得
 * GET /api/transactions/pending
 */
router.get('/pending', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING_VERIFICATION',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('検証待ち取引取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'データの取得に失敗しました。',
    });
  }
});

/**
 * 確定準備完了取引取得
 * GET /api/transactions/ready
 */
router.get('/ready', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'VERIFICATION_COMPLETE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('確定準備完了取引取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'データの取得に失敗しました。',
    });
  }
});

/**
 * 取引検証
 * PUT /api/transactions/:id/verify
 */
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments, verifiedBy } = req.body;

    // 取引の存在確認
    const transaction = await prisma.transaction.findUnique({
      where: { transactionId: id },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '取引が見つかりません。',
      });
    }

    // 自己検証防止
    if (transaction.createdBy === verifiedBy) {
      return res.status(400).json({
        success: false,
        message: '自分が作成した取引は検証できません。',
      });
    }

    // 状態マッピング
    let newStatus: string;
    let actionMessage: string;
    switch (action) {
      case 'approve':
        newStatus = 'VERIFICATION_COMPLETE';
        actionMessage = '取引が承認されました。';
        break;
      case 'hold':
        newStatus = 'ON_HOLD';
        actionMessage = '取引が保留されました。';
        break;
      case 'return':
        newStatus = 'RETURNED_FOR_CORRECTION';
        actionMessage = '取引が差し戻されました。';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '無効な検証アクションです。',
        });
    }

    // 取引更新
    const updatedTransaction = await prisma.transaction.update({
      where: { transactionId: id },
      data: {
        status: newStatus as any,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: updatedTransaction,
      message: actionMessage,
    });
  } catch (error) {
    console.error('取引検証エラー:', error);
    res.status(500).json({
      success: false,
      message: '取引検証中にエラーが発生しました。',
    });
  }
});

/**
 * 取引確定
 * PUT /api/transactions/:id/confirm
 */
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedBy } = req.body;

    // トランザクション開始
    const result = await prisma.$transaction(async tx => {
      // 取引の存在確認
      const transaction = await tx.transaction.findUnique({
        where: { transactionId: id },
      });

      if (!transaction) {
        throw new Error('取引が見つかりません。');
      }

      if (transaction.status !== 'VERIFICATION_COMPLETE') {
        throw new Error('取引が確定可能な状態ではありません。');
      }

      // 残高更新
      const newBalances: Record<string, number> = {};

      // 振込元口座から減額
      if (transaction.sourceAccountId) {
        const sourceAccount = await tx.account.findUnique({
          where: { accountId: transaction.sourceAccountId },
        });

        if (!sourceAccount) {
          throw new Error('振込元口座が見つかりません。');
        }

        if (sourceAccount.balance.toNumber() < transaction.amount.toNumber()) {
          throw new Error('残高不足です。');
        }

        const updatedSourceAccount = await tx.account.update({
          where: { accountId: transaction.sourceAccountId },
          data: {
            balance:
              sourceAccount.balance.toNumber() - transaction.amount.toNumber(),
            updatedAt: new Date(),
          },
        });

        newBalances[transaction.sourceAccountId] =
          updatedSourceAccount.balance.toNumber();
      }

      // 振込先口座に加算
      if (transaction.destinationAccountId) {
        const destAccount = await tx.account.findUnique({
          where: { accountId: transaction.destinationAccountId },
        });

        if (!destAccount) {
          throw new Error('振込先口座が見つかりません。');
        }

        const updatedDestAccount = await tx.account.update({
          where: { accountId: transaction.destinationAccountId },
          data: {
            balance:
              destAccount.balance.toNumber() + transaction.amount.toNumber(),
            updatedAt: new Date(),
          },
        });

        newBalances[transaction.destinationAccountId] =
          updatedDestAccount.balance.toNumber();
      }

      // 取引状態更新
      const updatedTransaction = await tx.transaction.update({
        where: { transactionId: id },
        data: {
          status: 'CONFIRMED',
          confirmedBy,
          confirmedAt: new Date(),
        },
      });

      return { transaction: updatedTransaction, newBalances };
    });

    res.json({
      success: true,
      data: result.transaction,
      newBalance: result.newBalances,
      message: '取引が正常に確定されました。',
    });
  } catch (error: any) {
    console.error('取引確定エラー:', error);
    res.status(500).json({
      success: false,
      message: `取引確定中にエラーが発生しました: ${error.message}`,
    });
  }
});

/**
 * 取引取消
 * PUT /api/transactions/:id/cancel
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    // トランザクション開始
    const result = await prisma.$transaction(async tx => {
      // 取引の存在確認
      const transaction = await tx.transaction.findUnique({
        where: { transactionId: id },
      });

      if (!transaction) {
        throw new Error('取引が見つかりません。');
      }

      // 当日取引のみ取消可能
      const today = new Date();
      const transactionDate = new Date(
        transaction.confirmedAt || transaction.createdAt
      );

      if (transactionDate.toDateString() !== today.toDateString()) {
        throw new Error('当日の取引のみ取消可能です。');
      }

      // 確定済み取引の場合、残高を元に戻す
      if (transaction.status === 'CONFIRMED') {
        // 振込元口座に加算（元に戻す）
        if (transaction.sourceAccountId) {
          const sourceAccount = await tx.account.findUnique({
            where: { accountId: transaction.sourceAccountId },
          });

          if (sourceAccount) {
            await tx.account.update({
              where: { accountId: transaction.sourceAccountId },
              data: {
                balance:
                  sourceAccount.balance.toNumber() +
                  transaction.amount.toNumber(),
                updatedAt: new Date(),
              },
            });
          }
        }

        // 振込先口座から減額（元に戻す）
        if (transaction.destinationAccountId) {
          const destAccount = await tx.account.findUnique({
            where: { accountId: transaction.destinationAccountId },
          });

          if (destAccount) {
            await tx.account.update({
              where: { accountId: transaction.destinationAccountId },
              data: {
                balance:
                  destAccount.balance.toNumber() -
                  transaction.amount.toNumber(),
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      // 取引状態を取消に更新
      const updatedTransaction = await tx.transaction.update({
        where: { transactionId: id },
        data: {
          status: 'CANCELLED',
        },
      });

      return updatedTransaction;
    });

    res.json({
      success: true,
      data: result,
      message: '取引が正常に取消されました。',
    });
  } catch (error: any) {
    console.error('取引取消エラー:', error);
    res.status(500).json({
      success: false,
      message: `取引取消中にエラーが発生しました: ${error.message}`,
    });
  }
});

/**
 * 取引履歴取得
 * GET /api/transactions/history
 */
router.get('/history', async (req, res) => {
  try {
    const { dateFrom, dateTo, type, sourceAccountId, destinationAccountId } =
      req.query;

    const where: any = {
      status: 'CONFIRMED',
    };

    // 日付範囲フィルター
    if (dateFrom || dateTo) {
      where.confirmedAt = {};
      if (dateFrom) {
        where.confirmedAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.confirmedAt.lte = new Date(dateTo as string);
      }
    }

    // その他のフィルター
    if (type) {
      where.type = type;
    }
    if (sourceAccountId) {
      where.sourceAccountId = sourceAccountId;
    }
    if (destinationAccountId) {
      where.destinationAccountId = destinationAccountId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        confirmedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('取引履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'データの取得に失敗しました。',
    });
  }
});

export default router;
