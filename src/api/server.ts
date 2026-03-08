/**
 * REST API 服务器 - Bun 内置 HTTP
 */

import { Server } from 'bun';
import { Storage } from '../storage/db.ts';
import { Catalyst } from '../catalyst/engine.ts';
import type { Bot } from '../capture/bot.ts';

interface Env {
  db: Storage;
  catalyst: Catalyst;
  bot?: Bot;
  tokens: Map<string, { userId: number; createdAt: number }>;
}

let env: Env;

/**
 * 生成 Token
 */
function generateToken(): string {
  return `xopc_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/**
 * 验证 Token
 */
function authenticate(req: Request): { valid: boolean; userId?: number } {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.slice(7);
  const user = env.tokens.get(token);
  
  if (!user) {
    return { valid: false };
  }

  return { valid: true, userId: user.userId };
}

/**
 * JSON 响应
 */
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 错误响应
 */
function error(message: string, status = 400) {
  return json({ error: message }, status);
}

/**
 * 路由处理
 */
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // CORS 预检
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // 公开端点 - Token 生成
  if (path === '/api/auth/token' && method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const { telegramUserId } = body;

    if (!telegramUserId) {
      return error('telegramUserId 必填', 400);
    }

    // 生成新 Token
    const token = generateToken();
    env.tokens.set(token, {
      userId: telegramUserId,
      createdAt: Date.now()
    });

    console.log(`🔑 Token 生成：${token} (user: ${telegramUserId})`);

    return json({
      token,
      telegramUserId,
      expiresAt: null // 永不过期
    });
  }

  // 需要认证的端点
  const auth = authenticate(req);
  if (!auth.valid) {
    return error('未授权', 401);
  }

  const userId = auth.userId!;

  // API 路由
  // GET /api/ideas - 获取灵感列表
  if (path === '/api/ideas' && method === 'GET') {
    const ideas = env.db.getIdeas();
    return json({ ideas, count: ideas.length });
  }

  // POST /api/ideas - 创建灵感
  if (path === '/api/ideas' && method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const { content, inputType = 'text', tags = [] } = body;

    if (!content) {
      return error('content 必填', 400);
    }

    const idea = env.db.saveIdea({
      content,
      inputType,
      createdAt: Date.now(),
      tags,
      status: 'captured'
    });

    console.log(`💡 新灵感 (API): ${idea.id}`);

    return json({ idea }, 201);
  }

  // GET /api/ideas/:id - 获取单个灵感
  const ideaMatch = path.match(/^\/api\/ideas\/([^/]+)$/);
  if (ideaMatch && method === 'GET') {
    const ideaId = ideaMatch[1];
    const idea = env.db.getIdeaById(ideaId);

    if (!idea) {
      return error('灵感不存在', 404);
    }

    return json({ idea });
  }

  // PUT /api/ideas/:id - 更新灵感
  if (ideaMatch && method === 'PUT') {
    const ideaId = ideaMatch[1];
    const body = await req.json().catch(() => ({}));
    const { content, tags, passionScore, status } = body;

    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (passionScore !== undefined) updates.passionScore = passionScore;
    if (status !== undefined) updates.status = status;

    env.db.updateIdea(ideaId, updates);

    const idea = env.db.getIdeaById(ideaId);
    return json({ idea });
  }

  // DELETE /api/ideas/:id - 删除灵感
  if (ideaMatch && method === 'DELETE') {
    const ideaId = ideaMatch[1];
    // 软删除：更新状态
    env.db.updateIdea(ideaId, { status: 'shelved' });
    return json({ success: true });
  }

  // POST /api/catalyst/:id - 手动触发催化
  const catalystMatch = path.match(/^\/api\/catalyst\/([^/]+)$/);
  if (catalystMatch && method === 'POST') {
    const ideaId = catalystMatch[1];
    const idea = env.db.getIdeaById(ideaId);

    if (!idea) {
      return error('灵感不存在', 404);
    }

    // 触发催化
    const report = await env.catalyst.catalyzeIdea(idea);

    if (!report) {
      return error('催化失败', 500);
    }

    return json({ report });
  }

  // POST /api/feedback - 提交反馈
  if (path === '/api/feedback' && method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const { ideaId, type } = body; // type: 'positive' | 'negative'

    if (!ideaId || !type) {
      return error('ideaId 和 type 必填', 400);
    }

    // 记录反馈
    env.db.saveUserProfile('feedback_history', {
      [userId]: {
        [ideaId]: {
          type,
          timestamp: Date.now()
        }
      }
    });

    console.log(`📝 反馈：idea=${ideaId}, type=${type}`);

    return json({ success: true });
  }

  // 404
  return error('Not Found', 404);
}

/**
 * 启动 API 服务器
 */
export async function startApiServer(
  db: Storage,
  catalyst: Catalyst,
  bot?: Bot,
  port: number = 3001
) {
  env = {
    db,
    catalyst,
    bot,
    tokens: new Map()
  };

  const server = Bun.serve({
    port,
    fetch: handleRequest,
    development: true
  });

  console.log(`🌐 API 服务器启动：http://localhost:${port}`);
  console.log(`   CORS: 启用`);
  console.log(`   认证：Bearer Token`);

  return server;
}
