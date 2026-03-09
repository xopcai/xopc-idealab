#!/usr/bin/env bun
/**
 * 手动测试实验引擎 - 完整流程
 */

import { Storage } from '../src/storage/db.ts';
import { ExperimentEngine } from '../src/experiment/engine.ts';

console.log('🧪 xopc-idealab 实验引擎 - 手动测试\n');

// 1. 初始化数据库
console.log('1️⃣ 初始化数据库...');
const db = new Storage('./data/test-experiment.sqlite');
await db.init();

// 2. 创建测试 idea
console.log('\n2️⃣ 创建测试想法...');
const testIdea = db.saveIdea({
  content: 'AI 写作助手，帮开发者自动生成 API 文档，节省 80% 时间',
  inputType: 'text',
  createdAt: Date.now(),
  tags: ['AI', '开发者工具', '文档'],
  passionScore: 8,
  status: 'captured'
});
console.log(`   想法 ID: ${testIdea.id}`);
console.log(`   内容：${testIdea.content}`);

// 3. 初始化实验引擎
console.log('\n3️⃣ 初始化实验引擎...');
const engine = new ExperimentEngine(db);

// 4. 生成实验框架
console.log('\n4️⃣ 生成实验框架...');
const framework = {
  type: 'landing_page' as const,
  timeBudgetMs: 7200000, // 2 小时
  successMetric: 'conversion_rate',
  successThreshold: 0.05, // 5% 转化率
  mutableVariables: ['headline', 'cta_text', 'pricing'],
  immutableConstraints: ['target_user=开发者', 'core_value=节省时间']
};

console.log(`   类型：${framework.type}`);
console.log(`   时间预算：${framework.timeBudgetMs / 3600000} 小时`);
console.log(`   成功标准：${Math.round(framework.successThreshold * 100)}% ${framework.successMetric}`);
console.log(`   可变因素：${framework.mutableVariables.join(', ')}`);
console.log(`   不可变：${framework.immutableConstraints.join(', ')}`);

// 5. 初始化实验日志
console.log('\n5️⃣ 初始化实验日志...');
const log = {
  ideaId: testIdea.id,
  framework,
  experiments: [] as any[],
  startedAt: Date.now()
};
db.saveExperimentLog(log);
console.log('   ✅ 日志已创建');

// 6. 模拟运行 3 轮实验
console.log('\n6️⃣ 运行实验循环 (模拟 3 轮)...\n');

const mockExperiments = [
  {
    round: 1,
    hypothesis: '基线实验：建立初始转化率基准',
    changes: ['创建默认 Landing Page'],
    conversionRate: 0.03,
    positiveFeedback: 3,
    totalContacts: 100,
    status: 'keep' as const,
    reflection: '基线转化率 3%，低于目标 5%'
  },
  {
    round: 2,
    hypothesis: '如果加入"节省 80% 时间"的量化描述，预计转化率会提升',
    changes: ['标题加入"节省 80% 时间"', 'CTA 改为"免费试用"'],
    conversionRate: 0.06,
    positiveFeedback: 6,
    totalContacts: 100,
    status: 'keep' as const,
    reflection: '✅ 量化描述有效！转化率提升到 6%，超过目标'
  },
  {
    round: 3,
    hypothesis: '如果加入 GitHub 集成关键词，预计开发者信任度会提升',
    changes: ['加入"GitHub 集成"关键词', '添加开发者评价'],
    conversionRate: 0.04,
    positiveFeedback: 4,
    totalContacts: 100,
    status: 'discard' as const,
    reflection: '❌ GitHub 关键词未达预期，用户对功能不敏感'
  }
];

for (const mock of mockExperiments) {
  console.log(`   ━━ 第 ${mock.round} 轮 ━━`);
  console.log(`   假设：${mock.hypothesis}`);
  console.log(`   改动：${mock.changes.join(', ')}`);
  
  // 模拟等待（缩短为 1 秒）
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`   结果：${mock.positiveFeedback}/${mock.totalContacts} = ${Math.round(mock.conversionRate * 100)}%`);
  console.log(`   评估：${mock.status === 'keep' ? '✅ 保留' : '❌ 丢弃'}`);
  console.log(`   反思：${mock.reflection}`);
  
  // 记录到日志
  const experiment = {
    id: `exp_${mock.round}`,
    ideaId: testIdea.id,
    round: mock.round,
    timestamp: Date.now(),
    hypothesis: mock.hypothesis,
    variant: {
      type: framework.type,
      changes: mock.changes,
      content: '<html>...</html>'
    },
    metrics: {
      positiveFeedback: mock.positiveFeedback,
      totalContacts: mock.totalContacts,
      conversionRate: mock.conversionRate,
      notes: mock.reflection
    },
    status: mock.status,
    aiReflection: mock.reflection
  };
  
  log.experiments.push(experiment);
  db.saveExperimentLog(log);
  
  console.log('');
}

// 7. 生成学习总结
console.log('7️⃣ 生成学习总结...\n');

const keepExperiments = log.experiments.filter(e => e.status === 'keep');
const best = keepExperiments.reduce((best, current) =>
  current.metrics.conversionRate > best.metrics.conversionRate ? current : best
);

const learnings = log.experiments
  .filter(e => e.status === 'keep')
  .map(e => `- ${e.aiReflection}`);

const summary = `实验完成：共 ${log.experiments.length} 轮
最佳转化率：${Math.round(best.metrics.conversionRate * 100)}%
关键学习：
${learnings.join('\n')}`;

log.learningSummary = summary;
log.completedAt = Date.now();
log.bestVariant = best.id;
db.saveExperimentLog(log);

console.log(summary);

// 8. 输出最终报告
console.log('\n8️⃣ 最终报告\n');
console.log('═══════════════════════════════════════════');
console.log('✅ 实验完成！');
console.log('═══════════════════════════════════════════');
console.log(`
原始想法：${testIdea.content}

实验框架：
  类型：${framework.type}
  时间预算：${framework.timeBudgetMs / 3600000} 小时
  成功标准：${Math.round(framework.successThreshold * 100)}% ${framework.successMetric}

实验结果：
  总轮数：${log.experiments.length}
  最佳方案：第 ${best.round} 轮
  最佳转化率：${Math.round(best.metrics.conversionRate * 100)}%
  达成目标：${best.metrics.conversionRate >= framework.successThreshold ? '✅ 是' : '❌ 否'}

最佳方案详情：
  假设：${best.hypothesis}
  改动：${best.variant.changes.join(', ')}

关键学习：
${learnings.map(l => `  ${l}`).join('\n')}

下一步建议：
  1. 基于最佳方案正式上线 Landing Page
  2. 联系留下邮箱的 ${best.metrics.positiveFeedback} 个用户做深度访谈
  3. 开始开发 MVP 核心功能（建议优先做"量化描述"相关功能）

═══════════════════════════════════════════
`);

// 9. 清理测试数据
console.log('9️⃣ 清理测试数据...');
db.updateIdea(testIdea.id, { status: 'shelved' });
console.log('   ✅ 测试完成\n');
