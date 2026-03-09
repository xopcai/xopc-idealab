/**
 * 实验 API 端点
 */

import { Elysia, t } from 'elysia';
import type { Storage } from '../storage/db.ts';
import { ExperimentEngine } from '../experiment/engine.ts';

export function createExperimentAPI(db: Storage) {
  const engine = new ExperimentEngine(db);

  return new Elysia({ prefix: '/api/experiment' })
    // 启动实验
    .post('/start', async ({ body, headers }) => {
      const { ideaId, framework } = body;
      const auth = headers['authorization'];

      if (!auth?.startsWith('Bearer ')) {
        return { error: '未授权' };
      }

      const idea = db.getIdeaById(ideaId);
      if (!idea) {
        return { error: '灵感不存在' };
      }

      // 启动实验循环（后台运行）
      engine.startExperimentLoop(idea);

      return {
        success: true,
        message: '实验已启动，完成后会推送通知'
      };
    }, {
      body: t.Object({
        ideaId: t.String(),
        framework: t.Optional(t.Object({
          type: t.Union([t.Literal('landing_page'), t.Literal('pricing'), t.Literal('interview')]),
          timeBudgetMs: t.Number(),
          successThreshold: t.Number()
        }))
      })
    })

    // 获取实验日志
    .get('/log/:ideaId', async ({ params, headers }) => {
      const { ideaId } = params;
      const auth = headers['authorization'];

      if (!auth?.startsWith('Bearer ')) {
        return { error: '未授权' };
      }

      const log = db.getExperimentLog(ideaId);
      if (!log) {
        return { error: '暂无实验日志' };
      }

      return { log };
    })

    // 获取实验总结
    .get('/summary/:ideaId', async ({ params, headers }) => {
      const { ideaId } = params;
      const auth = headers['authorization'];

      if (!auth?.startsWith('Bearer ')) {
        return { error: '未授权' };
      }

      const log = db.getExperimentLog(ideaId);
      if (!log?.learningSummary) {
        return { error: '实验未完成' };
      }

      return {
        summary: log.learningSummary,
        bestVariant: log.bestVariant,
        completedAt: log.completedAt
      };
    });
}
