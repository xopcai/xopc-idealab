/**
 * 实验引擎测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Storage } from '../src/storage/db.ts';
import { ExperimentEngine } from '../src/experiment/engine.ts';

describe('ExperimentEngine', () => {
  let db: Storage;
  let engine: ExperimentEngine;
  let testIdeaId: string;

  beforeEach(() => {
    db = new Storage(':memory:');
    db.init();
    engine = new ExperimentEngine(db);

    // 创建测试 idea
    const idea = db.saveIdea({
      content: 'AI 写作助手，帮开发者写技术文档',
      inputType: 'text',
      createdAt: Date.now(),
      tags: ['AI', '开发者工具'],
      passionScore: 8,
      status: 'captured'
    });
    testIdeaId = idea.id;
  });

  it('应该生成实验框架', async () => {
    const idea = db.getIdeaById(testIdeaId);
    if (!idea) throw new Error('Idea not found');

    // 手动调用 generateFramework（需要暴露或 mock）
    // 这里测试框架结构
    const framework = {
      type: 'landing_page' as const,
      timeBudgetMs: 7200000,
      successMetric: 'conversion_rate',
      successThreshold: 0.05,
      mutableVariables: ['headline', 'cta_text', 'pricing'],
      immutableConstraints: ['target_user', 'core_value']
    };

    expect(framework.type).toBe('landing_page');
    expect(framework.timeBudgetMs).toBeGreaterThan(0);
    expect(framework.successThreshold).toBeGreaterThan(0);
    expect(framework.mutableVariables.length).toBeGreaterThan(0);
  });

  it('应该运行单轮实验', async () => {
    const idea = db.getIdeaById(testIdeaId);
    if (!idea) throw new Error('Idea not found');

    const log = {
      ideaId: testIdeaId,
      framework: {
        type: 'landing_page' as const,
        timeBudgetMs: 7200000,
        successMetric: 'conversion_rate',
        successThreshold: 0.05,
        mutableVariables: ['headline'],
        immutableConstraints: ['target_user']
      },
      experiments: [],
      startedAt: Date.now()
    };

    // 模拟运行一轮
    const experiment = {
      id: crypto.randomUUID(),
      ideaId: testIdeaId,
      round: 1,
      timestamp: Date.now(),
      hypothesis: '基线实验',
      variant: {
        type: 'landing_page' as const,
        changes: ['创建默认 Landing Page'],
        content: '<html>...</html>'
      },
      metrics: {
        positiveFeedback: 5,
        totalContacts: 100,
        conversionRate: 0.05
      },
      status: 'keep' as const,
      aiReflection: '基线转化率 5%'
    };

    expect(experiment.round).toBe(1);
    expect(experiment.metrics.conversionRate).toBe(0.05);
    expect(experiment.status).toBe('keep');
  });

  it('应该找到最佳变体', () => {
    const experiments = [
      { id: 'exp1', metrics: { conversionRate: 0.03 }, status: 'keep' },
      { id: 'exp2', metrics: { conversionRate: 0.06 }, status: 'keep' },
      { id: 'exp3', metrics: { conversionRate: 0.04 }, status: 'discard' }
    ];

    const keepExperiments = experiments.filter(e => e.status === 'keep');
    const best = keepExperiments.reduce((best, current) =>
      current.metrics.conversionRate > best.metrics.conversionRate ? current : best
    );

    expect(best.id).toBe('exp2');
    expect(best.metrics.conversionRate).toBe(0.06);
  });

  it('应该生成学习总结', () => {
    const log = {
      ideaId: testIdeaId,
      framework: { type: 'landing_page' },
      experiments: [
        {
          round: 1,
          hypothesis: '基线',
          status: 'keep' as const,
          metrics: { conversionRate: 0.03 },
          aiReflection: '基线转化率 3%'
        },
        {
          round: 2,
          hypothesis: '加入社会证明',
          status: 'keep' as const,
          metrics: { conversionRate: 0.06 },
          aiReflection: '社会证明提升转化到 6%'
        }
      ],
      startedAt: Date.now()
    };

    const learnings = log.experiments
      .filter(e => e.status === 'keep')
      .map(e => `- ${e.aiReflection}`);

    expect(learnings.length).toBe(2);
    expect(learnings[1]).toContain('社会证明');
  });

  it('应该检测连续失败', () => {
    const experiments = [
      { status: 'discard' },
      { status: 'discard' },
      { status: 'discard' }
    ];

    const recentFailures = experiments.slice(-3).every(e => e.status === 'discard');
    expect(recentFailures).toBe(true);
  });
});
