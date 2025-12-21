/**
 * 認証API ルート
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = express.Router();
const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

/**
 * ログイン API
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    // バリデーション
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDとパスワードは必須です。',
      });
    }

    // データベースからユーザーを取得
    const user = await prisma.user.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ユーザーIDまたはパスワードが正しくありません。',
      });
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'ユーザーIDまたはパスワードが正しくありません。',
      });
    }

    // 成功レスポンス
    res.json({
      success: true,
      user: {
        userId: user.userId,
        userRole: user.userRole,
      },
      message: 'ログインに成功しました。',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'ログイン処理中にエラーが発生しました。',
    });
  }
});

/**
 * ユーザー情報取得 API
 * GET /api/auth/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        userId: true,
        userRole: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません。',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザー情報の取得中にエラーが発生しました。',
    });
  }
});

/**
 * ログアウト API
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    // セッション管理はフロントエンド側で行うため、
    // ここでは成功レスポンスのみ返す
    res.json({
      success: true,
      message: 'ログアウトしました。',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'ログアウト処理中にエラーが発生しました。',
    });
  }
});

export default router;
