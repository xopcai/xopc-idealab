/**
 * 市场扫描器单元测试
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MarketScanner, type MarketSignal } from '../src/brain/scanner.ts';

describe('MarketScanner', () => {
  let scanner: MarketScanner;

  beforeEach(() => {
    scanner = new MarketScanner();
  });

  it('应该成功实例化', () => {
    expect(scanner).toBeDefined();
  });

  it('scanAll 应该返回市场信号数组', async () => {
    const signals = await scanner.scanAll();

    expect(signals).toBeInstanceOf(Array);
    expect(signals.length).toBeGreaterThan(0);
  });

  it('返回的信号应该有正确的结构', async () => {
    const signals = await scanner.scanAll();
    const signal = signals[0];

    expect(signal.source).toBeDefined();
    expect(signal.title).toBeDefined();
    expect(signal.url).toBeDefined();
    expect(signal.collectedAt).toBeDefined();
  });

  it('信号来源应该是有效的', async () => {
    const signals = await scanner.scanAll();
    const sources = signals.map(s => s.source);

    sources.forEach(source => {
      expect(['producthunt', 'github']).toContain(source);
    });
  });

  it('应该正确缓存结果', async () => {
    const first = await scanner.scanAll();
    const second = await scanner.scanAll();

    // 缓存未过期时应该返回相同数据
    expect(first.length).toBe(second.length);
  });

  it('getRelatedSignals 应该返回相关信号', async () => {
    // 先扫描填充缓存
    await scanner.scanAll();

    const related = scanner.getRelatedSignals('AI 产品');
    
    // 可能没有完全匹配的，但不应该报错
    expect(related).toBeInstanceOf(Array);
  });

  it('formatSignals 应该生成格式化文本', () => {
    const signals: MarketSignal[] = [
      {
        source: 'producthunt',
        title: '产品 A',
        url: 'https://a.com',
        upvotes: 100,
        collectedAt: Date.now()
      },
      {
        source: 'github',
        title: '项目 B',
        url: 'https://b.com',
        upvotes: 500,
        collectedAt: Date.now()
      }
    ];

    const formatted = MarketScanner.formatSignals(signals);

    expect(formatted).toContain('产品 A');
    expect(formatted).toContain('100 upvotes');
    expect(formatted).toContain('项目 B');
  });

  it('formatSignals 应该处理空数组', () => {
    const formatted = MarketScanner.formatSignals([]);
    expect(formatted).toBe('暂无市场信号');
  });

  it('信号应该有时间戳', async () => {
    const signals = await scanner.scanAll();
    
    signals.forEach(signal => {
      expect(signal.collectedAt).toBeGreaterThan(0);
      expect(signal.collectedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  it('Product Hunt 信号应该有正确的来源标识', async () => {
    const signals = await scanner.scanAll();
    const phSignals = signals.filter(s => s.source === 'producthunt');

    phSignals.forEach(signal => {
      expect(signal.url).toContain('producthunt.com');
    });
  });

  it('GitHub 信号应该有正确的来源标识', async () => {
    const signals = await scanner.scanAll();
    const ghSignals = signals.filter(s => s.source === 'github');

    ghSignals.forEach(signal => {
      expect(signal.url).toContain('github.com');
    });
  });
});
