/**
 * 検証済み取引のテストデータ作成スクリプト
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('検証済み取引のテストデータを作成中...');

  // 既存の口座を取得
  const accounts = await prisma.account.findMany({
    take: 3,
    where: {
      status: 'ACTIVE',
    },
  });

  if (accounts.length < 2) {
    console.error(
      'テスト用の口座が不足しています。先にシードデータを実行してください。'
    );
    return;
  }

  // 既存のユーザーを取得
  const users = await prisma.user.findMany({
    take: 2,
  });

  if (users.length < 2) {
    console.error(
      'テスト用のユーザーが不足しています。先にシードデータを実行してください。'
    );
    return;
  }

  // 検証待ち取引を作成
  const pendingTransaction = await prisma.transaction.create({
    data: {
      transactionId: `TXN-PENDING-${Date.now()}`,
      transactionType: 'TRANSFER',
      sourceAccountId: accounts[0].accountId,
      destinationAccountId: accounts[1].accountId,
      amount: 50000,
      description: '検証待ち取引のテスト',
      status: 'PENDING_VERIFICATION',
      createdBy: users[0].userId,
    },
  });

  console.log('検証待ち取引を作成:', pendingTransaction.transactionId);

  // 検証済み取引を作成
  const verifiedTransaction = await prisma.transaction.create({
    data: {
      transactionId: `TXN-VERIFIED-${Date.now()}`,
      transactionType: 'TRANSFER',
      sourceAccountId: accounts[1].accountId,
      destinationAccountId: accounts[2]
        ? accounts[2].accountId
        : accounts[0].accountId,
      amount: 75000,
      description: '検証済み取引のテスト - 最終確認待ち',
      status: 'VERIFICATION_COMPLETE',
      createdBy: users[0].userId,
      verifiedBy: users[1].userId,
      verifiedAt: new Date(),
    },
  });

  console.log('検証済み取引を作成:', verifiedTransaction.transactionId);

  // もう1件検証済み取引を作成
  const verifiedTransaction2 = await prisma.transaction.create({
    data: {
      transactionId: `TXN-VERIFIED2-${Date.now()}`,
      transactionType: 'DEPOSIT',
      destinationAccountId: accounts[0].accountId,
      amount: 100000,
      description: '入金取引のテスト - 検証済み',
      status: 'VERIFICATION_COMPLETE',
      createdBy: users[1].userId,
      verifiedBy: users[0].userId,
      verifiedAt: new Date(),
    },
  });

  console.log('検証済み取引2を作成:', verifiedTransaction2.transactionId);

  console.log('テストデータの作成が完了しました！');
}

main()
  .catch(e => {
    console.error('エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
