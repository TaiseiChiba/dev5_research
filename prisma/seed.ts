/**
 * データベース初期データ投入スクリプト
 */

import 'dotenv/config';
import {
  PrismaClient,
  UserRole,
  CustomerType,
  AccountType,
  AccountStatus,
} from '../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('データベースの初期データを投入中...');

  // 既存データをクリア（開発環境のみ）
  if (process.env.NODE_ENV !== 'production') {
    await prisma.auditLog.deleteMany();
    await prisma.workflowHistory.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
  }

  // パスワードハッシュの生成
  const saltRounds = 10;
  const staffPasswordHash = await bcrypt.hash('password123', saltRounds);
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);

  // 利用者データの投入
  const users = await Promise.all([
    prisma.user.create({
      data: {
        userId: 'staff001',
        passwordHash: staffPasswordHash,
        userRole: UserRole.GENERAL_STAFF,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        userId: 'staff002',
        passwordHash: staffPasswordHash,
        userRole: UserRole.GENERAL_STAFF,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        userId: 'admin001',
        passwordHash: adminPasswordHash,
        userRole: UserRole.ADMINISTRATOR,
        isActive: true,
      },
    }),
  ]);

  console.log(`${users.length}件の利用者データを投入しました`);

  // 顧客データの投入
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        customerId: 'CUST001',
        name: '田中太郎',
        phoneticName: 'タナカタロウ',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'tanaka@example.com',
          phone: '03-1234-5678',
          address: '東京都千代田区丸の内1-1-1',
          postalCode: '100-0005',
        },
        isDeleted: false,
      },
    }),
    prisma.customer.create({
      data: {
        customerId: 'CUST002',
        name: '佐藤花子',
        phoneticName: 'サトウハナコ',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'sato@example.com',
          phone: '03-2345-6789',
          address: '東京都新宿区西新宿2-2-2',
          postalCode: '160-0023',
        },
        isDeleted: false,
      },
    }),
    prisma.customer.create({
      data: {
        customerId: 'CUST003',
        name: '株式会社サンプル商事',
        phoneticName: 'カブシキガイシャサンプルショウジ',
        customerType: CustomerType.CORPORATE,
        contactInfo: {
          email: 'info@sample-corp.com',
          phone: '03-3456-7890',
          address: '東京都港区六本木3-3-3',
          postalCode: '106-0032',
        },
        isDeleted: false,
      },
    }),
    prisma.customer.create({
      data: {
        customerId: 'CUST004',
        name: '山田次郎',
        phoneticName: 'ヤマダジロウ',
        customerType: CustomerType.INDIVIDUAL,
        contactInfo: {
          email: 'yamada@example.com',
          phone: '03-4567-8901',
          address: '東京都渋谷区渋谷4-4-4',
          postalCode: '150-0002',
        },
        isDeleted: false,
      },
    }),
  ]);

  console.log(`${customers.length}件の顧客データを投入しました`);

  // 口座データの投入
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        accountId: 'ACC001',
        customerId: 'CUST001',
        accountNumber: '1001-001-12345',
        accountType: AccountType.SAVINGS,
        status: AccountStatus.ACTIVE,
        balance: 1500000,
      },
    }),
    prisma.account.create({
      data: {
        accountId: 'ACC002',
        customerId: 'CUST001',
        accountNumber: '1001-002-12346',
        accountType: AccountType.CHECKING,
        status: AccountStatus.ACTIVE,
        balance: 250000,
      },
    }),
    prisma.account.create({
      data: {
        accountId: 'ACC003',
        customerId: 'CUST002',
        accountNumber: '1002-001-23456',
        accountType: AccountType.SAVINGS,
        status: AccountStatus.ACTIVE,
        balance: 800000,
      },
    }),
    prisma.account.create({
      data: {
        accountId: 'ACC004',
        customerId: 'CUST003',
        accountNumber: '1003-001-34567',
        accountType: AccountType.CHECKING,
        status: AccountStatus.ACTIVE,
        balance: 5000000,
      },
    }),
    prisma.account.create({
      data: {
        accountId: 'ACC005',
        customerId: 'CUST004',
        accountNumber: '1004-001-45678',
        accountType: AccountType.SAVINGS,
        status: AccountStatus.ACTIVE,
        balance: 320000,
      },
    }),
  ]);

  console.log(`${accounts.length}件の口座データを投入しました`);

  console.log('初期データの投入が完了しました！');
}

main()
  .catch(e => {
    console.error('初期データ投入中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
