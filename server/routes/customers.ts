/**
 * 顧客API ルート
 */

import express from 'express';
import { CustomerType, PrismaClient } from '../../generated/prisma/index.js';

const router = express.Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

console.log('🔵 Customers router module loaded');

/**
 * 顧客一覧検索api
 * /api/customers/list
 */
router.get('/list', async (req, res) => {
  console.log('✅ /list endpoint hit!');
  try {
    // 顧客一覧取得
    const customers = await prisma.customer.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        customerId: true,
        name: true,
        phoneticName: true,
        contactInfo: true,
        customerType: true,
      },
    });

    console.log('in list, customers:', customers.length);

    // 成功レスポンス
    res.json({
      success: true,
      customers: customers,
      count: customers.length,
      message: '顧客情報の取得に成功しました。',
    });
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(500).json({
      success: false,
      message: '顧客情報の取得中にエラーが発生しました。',
    });
  }
});

/**
 * 顧客検索api
 * /api/customers/search
 */
router.get('/search', async (req, res) => {
  try {
    const { customerId, name, phoneticName, customerType } = req.query;

    // customerTypeを大文字に変換してPrismaのEnumに合わせる
    let validCustomerType: CustomerType | undefined;
    if (customerType) {
      const typeStr = (customerType as string).toUpperCase();
      if (typeStr === 'INDIVIDUAL') {
        validCustomerType = CustomerType.INDIVIDUAL;
      } else if (typeStr === 'CORPORATE') {
        validCustomerType = CustomerType.CORPORATE;
      }
    }
    console.log(validCustomerType);

    // 顧客一覧取得
    const customers = await prisma.customer.findMany({
      where: {
        ...(customerId && { customerId: customerId as string }),
        ...(name && { name: name as string }),
        ...(phoneticName && { phoneticName: phoneticName as string }),
        ...(validCustomerType && { customerType: validCustomerType }),
        isDeleted: false,
      },
      select: {
        customerId: true,
        name: true,
        phoneticName: true,
        contactInfo: true,
        customerType: true,
      },
    });

    // 成功レスポンス
    res.json({
      success: true,
      customers: customers,
      count: customers.length,
      message: '顧客情報の取得に成功しました。',
    });
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(500).json({
      success: false,
      message: '顧客情報の取得中にエラーが発生しました。',
    });
  }
});

/**
 * 顧客詳細検索api
 * /api/customers/details
 */
router.get('/details', async (req, res) => {
  try {
    const { customerId } = req.query;

    // 顧客取得
    const customer = await prisma.customer.findFirst({
      where: {
        ...(customerId && { customerId: customerId as string }),
        isDeleted: false,
      },
      select: {
        customerId: true,
        name: true,
        phoneticName: true,
        contactInfo: true,
        customerType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 成功レスポンス
    res.json({
      success: true,
      customer: customer,
      message: '顧客情報の取得に成功しました。',
    });
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(500).json({
      success: false,
      message: '顧客情報の取得中にエラーが発生しました。',
    });
  }
});

/**
 * 顧客作成API
 * POST /api/customers
 */
router.post('/', async (req, res) => {
  try {
    const { name, phoneticName, customerType, contactInfo } = req.body;

    // バリデーション
    if (!name || !phoneticName || !customerType) {
      return res.status(400).json({
        success: false,
        message: '必須項目が不足しています。',
      });
    }

    // 顧客番号を生成（CUST + タイムスタンプ）
    const customerId = `CUST${Date.now()}`;

    // 顧客作成
    const customer = await prisma.customer.create({
      data: {
        customerId,
        name,
        phoneticName,
        customerType: customerType.toUpperCase() as CustomerType,
        contactInfo: contactInfo || {},
        isDeleted: false,
      },
    });

    res.status(201).json({
      success: true,
      customer,
      message: '顧客が正常に作成されました。',
    });
  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({
      success: false,
      message: '顧客作成中にエラーが発生しました。',
    });
  }
});

/**
 * 顧客更新API
 * PUT /api/customers/:customerId
 */
router.put('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, phoneticName, customerType, contactInfo } = req.body;

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findFirst({
      where: { customerId, isDeleted: false },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: '顧客が見つかりません。',
      });
    }

    // 顧客更新
    const updatedCustomer = await prisma.customer.update({
      where: { customerId },
      data: {
        ...(name && { name }),
        ...(phoneticName && { phoneticName }),
        ...(customerType && {
          customerType: customerType.toUpperCase() as CustomerType,
        }),
        ...(contactInfo && { contactInfo }),
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      customer: updatedCustomer,
      message: '顧客情報が正常に更新されました。',
    });
  } catch (error) {
    console.error('Customer update error:', error);
    res.status(500).json({
      success: false,
      message: '顧客更新中にエラーが発生しました。',
    });
  }
});

/**
 * 顧客削除API（論理削除）
 * DELETE /api/customers/:customerId
 */
router.delete('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findFirst({
      where: { customerId, isDeleted: false },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: '顧客が見つかりません。',
      });
    }

    // アクティブな口座があるかチェック
    const activeAccounts = await prisma.account.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
      },
    });

    if (activeAccounts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'アクティブな口座が存在するため、顧客を削除できません。',
      });
    }

    // 論理削除
    await prisma.customer.update({
      where: { customerId },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: '顧客が正常に削除されました。',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Customer deletion error:', error);
    res.status(500).json({
      success: false,
      message: '顧客削除中にエラーが発生しました。',
    });
  }
});

export default router;
