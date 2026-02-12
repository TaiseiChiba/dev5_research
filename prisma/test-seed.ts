/**
 * テスト用シードファイル
 */

import 'dotenv/config';
import { PrismaClient, UserRole } from '../generated/prisma';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('テスト用データを投入中...');

  // 1件だけテスト
  const user = await prisma.user.create({
    data: {
      userId: 'test001',
      passwordHash: 'test_hash',
      userRole: 'general_staff' as any, // 文字列として直接指定
      isActive: true,
    },
  });

  console.log('作成されたユーザー:', user);
}

main()
  .catch(e => {
    console.error('エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
