/**
 * AI 催化引擎单元测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { AICatalyst } from '../src/brain/ai.ts';

describe('AICatalyst', () => {
  let catalyst: AICatalyst;

  beforeEach(() => {
    catalyst = new AICatalyst();
  });

  it('应该成功实例化', () => {
    expect(catalyst).toBeDefined();
  });

  it('应该在没有 API key 时返回降级报告', async () => {
    const report = await catalyst.generate('测试想法');

    expect(report).toBeDefined();
    expect(report.originalIdea).toBe('测试想法');
    expect(report.generatedAt).toBeDefined();
    expect(report.confidence).toBe(0.5); // 降级报告默认置信度
  });

  it('降级报告应该包含基本结构', async () => {
    const report = await catalyst.generate('做一个 AI 驱动的灵感催化器');

    expect(report.userStory).toBeDefined();
    expect(report.mvpFeatures).toBeDefined();
    expect(report.mvpFeatures.mustHave).toBeInstanceOf(Array);
    expect(report.mvpFeatures.niceToHave).toBeInstanceOf(Array);
    expect(report.techStack).toBeDefined();
    expect(report.keyQuestions).toBeInstanceOf(Array);
    expect(report.keyQuestions.length).toBeGreaterThan(0);
    expect(report.nextSteps).toBeInstanceOf(Array);
  });

  it('降级报告应该包含 5 个关键问题', async () => {
    const report = await catalyst.generate('测试想法');

    expect(report.keyQuestions.length).toBe(5);
    expect(report.keyQuestions[0]).toContain('核心价值假设');
  });

  it('应该正确处理带上下文的生成', async () => {
    const report = await catalyst.generate('新想法', {
      pastIdeas: ['旧想法 1', '旧想法 2'],
      marketSignals: [
        {
          source: 'producthunt' as const,
          title: '竞品 A',
          url: 'https://example.com',
          upvotes: 100,
          collectedAt: Date.now()
        }
      ]
    });

    expect(report).toBeDefined();
    expect(report.originalIdea).toBe('新想法');
  });

  it('formatReport 应该生成格式化的消息', () => {
    const report = {
      ideaId: 'test-123',
      originalIdea: '测试想法',
      generatedAt: Date.now(),
      userStory: {
        targetUser: '超级个体',
        painPoint: '想法难以落地',
        scenario: '随时随地捕获',
        value: '加速 MVP'
      },
      mvpFeatures: {
        mustHave: ['功能 1', '功能 2'],
        niceToHave: ['功能 3']
      },
      techStack: {
        frontend: 'React',
        backend: 'Node.js',
        database: 'PostgreSQL',
        infrastructure: 'Vercel'
      },
      keyQuestions: ['问题 1', '问题 2'],
      marketSignals: ['信号 1'],
      risks: ['风险 1'],
      confidence: 0.8,
      nextSteps: ['步骤 1', '步骤 2']
    };

    const formatted = AICatalyst.formatReport(report as any);

    expect(formatted).toContain('⚡ 催化报告');
    expect(formatted).toContain('测试想法');
    expect(formatted).toContain('超级个体');
    expect(formatted).toContain('功能 1');
    expect(formatted).toContain('问题 1');
    expect(formatted).toContain('80%');
  });

  it('应该处理空的市场信号', async () => {
    const report = await catalyst.generate('测试', {
      marketSignals: []
    });

    expect(report).toBeDefined();
  });

  it('置信度应该在 0-1 之间', async () => {
    const report = await catalyst.generate('测试');

    expect(report.confidence).toBeGreaterThanOrEqual(0);
    expect(report.confidence).toBeLessThanOrEqual(1);
  });
});
