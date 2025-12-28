/**
 * Prismaクライアントの設定
 */

import { PrismaClient } from '../../generated/prisma';

// グローバルなPrismaクライアントインスタンス
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 開発環境では接続を再利用し、本番環境では新しいインスタンスを作成
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// アプリケーション終了時にPrismaクライアントを切断
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
