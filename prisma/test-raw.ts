import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('データベース接続テスト...');

  // 生のSQLでユーザーを作成
  const result = await prisma.$executeRaw`
    INSERT INTO users (user_id, password_hash, user_role, is_active, created_at, updated_at)
    VALUES ('test002', 'test_hash', 'general_staff', true, NOW(), NOW())
  `;

  console.log('挿入結果:', result);

  // 確認
  const users = await prisma.$queryRaw`SELECT * FROM users`;
  console.log('ユーザー一覧:', users);
}

main()
  .catch(e => {
    console.error('エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
