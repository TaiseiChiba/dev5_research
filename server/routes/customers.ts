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
 * /api/customers/search
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

export default router;
