/**
 * 实验引擎 - AI 自主探索核心
 * 基于 autoresearch 思想：约束下的迭代探索
 */

import type { Storage, Idea, ExperimentLog, Experiment } from '../storage/db.ts';
import { AICatalyst } from '../brain/ai.ts';

export interface ExperimentFramework {
  type: 'landing_page' | 'pricing' | 'interview';
  timeBudgetMs: number;
  successMetric: string;
  successThreshold: number;
  mutableVariables: string[];
  immutableConstraints: string[];
}

export interface ExperimentResult {
  success: boolean;
  conversionRate: number;
  positiveFeedback: number;
  totalContacts: number;
  notes?: string;
}

export class ExperimentEngine {
  private db: Storage;
  private ai: AICatalyst;
  private maxRounds: number = 10;
  private timeoutMultiplier: number = 2; // 超时倍数

  constructor(db: Storage) {
    this.db = db;
    this.ai = new AICatalyst();
  }

  /**
   * 启动实验循环
   */
  async startExperimentLoop(idea: Idea, bot?: any) {
    console.log(`🧪 启动实验循环：${idea.id}`);

    // 1. 生成或加载实验框架
    let log = this.db.getExperimentLog(idea.id);
    if (!log) {
      const framework = await this.generateFramework(idea);
      log = {
        ideaId: idea.id,
        framework,
        experiments: [],
        startedAt: Date.now()
      };
      this.db.saveExperimentLog(log);
    }

    // 2. 通知用户实验开始
    if (bot) {
      await bot.sendPush(`🧪 开始实验：${idea.content.substring(0, 50)}...
框架：${log.framework.type}
成功标准：${Math.round(log.framework.successThreshold * 100)}% ${log.framework.successMetric}
预计 ${log.framework.timeBudgetMs / 3600000} 小时后出结果`);
    }

    // 3. 实验循环
    for (let round = log.experiments.length + 1; round <= this.maxRounds; round++) {
      console.log(`  └─ 第 ${round} 轮实验...`);

      // 检查是否已超时
      const elapsed = Date.now() - log.startedAt;
      if (elapsed > 24 * 60 * 60 * 1000) { // 24 小时上限
        console.log(`  └─ 达到 24 小时上限，停止实验`);
        break;
      }

      // 生成并运行实验
      const experiment = await this.runSingleExperiment(idea, log, round);
      
      if (!experiment) {
        console.log(`  └─ 实验失败，跳过`);
        continue;
      }

      // 记录结果
      log.experiments.push(experiment);
      this.db.saveExperimentLog(log);

      // 检查是否达到成功阈值
      if (experiment.metrics.conversionRate >= log.framework.successThreshold) {
        console.log(`  └─ 达到成功阈值！转化率 ${Math.round(experiment.metrics.conversionRate * 100)}%`);
        break;
      }

      // 检查是否连续失败
      const recentFailures = log.experiments.slice(-3).every(e => e.status === 'discard');
      if (recentFailures) {
        console.log(`  └─ 连续 3 轮失败，停止实验`);
        break;
      }

      // 等待下一轮（避免过快）
      await this.sleep(1000);
    }

    // 4. 生成学习总结
    const summary = this.generateLearningSummary(log);
    log.learningSummary = summary;
    log.completedAt = Date.now();
    log.bestVariant = this.findBestVariant(log);
    this.db.saveExperimentLog(log);

    // 5. 推送结果
    if (bot) {
      await bot.sendPush(this.formatSummary(log, summary));
    }

    return log;
  }

  /**
   * 生成实验框架
   */
  private async generateFramework(idea: Idea): Promise<ExperimentFramework> {
    const prompt = `基于以下想法，推荐一个实验框架：

想法：${idea.content}

可选框架：
1. Landing Page 实验 - 适合验证价值主张（2 小时，5% 转化率目标）
2. 用户访谈实验 - 适合验证痛点真实性（48 小时，60% 愿意付费目标）
3. 定价实验 - 适合验证价格敏感度（24 小时，10% 点击购买目标）

返回 JSON：
{
  "type": "landing_page|pricing|interview",
  "timeBudgetMs": 数字，
  "successMetric": "指标名",
  "successThreshold": 0.05,
  "mutableVariables": ["可变因素"],
  "immutableConstraints": ["不可变假设"]
}`;

    try {
      const response = await this.ai.callAI(prompt);
      const framework = JSON.parse(response);
      return framework;
    } catch (error) {
      console.warn('框架生成失败，使用默认 Landing Page 框架');
      return {
        type: 'landing_page',
        timeBudgetMs: 7200000, // 2 小时
        successMetric: 'conversion_rate',
        successThreshold: 0.05,
        mutableVariables: ['headline', 'cta_text', 'pricing'],
        immutableConstraints: ['target_user', 'core_value']
      };
    }
  }

  /**
   * 运行单轮实验
   */
  private async runSingleExperiment(
    idea: Idea,
    log: ExperimentLog,
    round: number
  ): Promise<Experiment | null> {
    const lastExperiment = log.experiments[log.experiments.length - 1];

    // 1. 生成假设和变体
    const hypothesis = await this.generateHypothesis(idea, log, lastExperiment);
    const variant = await this.generateVariant(idea, log, lastExperiment, hypothesis);

    console.log(`    └─ 假设：${hypothesis}`);
    console.log(`    └─ 变体：${variant.changes.join(', ')}`);

    // 2. 部署实验（模拟 - 实际应该部署到真实环境）
    const deployed = await this.deployVariant(variant);
    if (!deployed) {
      return {
        id: crypto.randomUUID(),
        ideaId: idea.id,
        round,
        timestamp: Date.now(),
        hypothesis,
        variant,
        metrics: { positiveFeedback: 0, totalContacts: 0, conversionRate: 0 },
        status: 'crash',
        aiReflection: '部署失败'
      };
    }

    // 3. 收集数据（模拟 - 实际应该等待真实用户行为）
    const metrics = await this.collectMetrics(variant, log.framework);

    // 4. 评估结果
    const bestSoFar = this.findBestVariant(log);
    const bestRate = bestSoFar 
      ? log.experiments.find(e => e.id === bestSoFar)?.metrics.conversionRate || 0
      : 0;

    const status = metrics.conversionRate > bestRate ? 'keep' : 'discard';

    // 5. 生成反思
    const reflection = await this.generateReflection(hypothesis, metrics, status);

    return {
      id: crypto.randomUUID(),
      ideaId: idea.id,
      round,
      timestamp: Date.now(),
      hypothesis,
      variant,
      metrics,
      status,
      aiReflection: reflection
    };
  }

  /**
   * 生成假设
   */
  private async generateHypothesis(
    idea: Idea,
    log: ExperimentLog,
    lastExperiment?: Experiment
  ): Promise<string> {
    if (!lastExperiment) {
      return '基线实验：建立初始转化率基准';
    }

    const prompt = `上一轮实验：${lastExperiment.hypothesis}
结果：${lastExperiment.metrics.conversionRate * 100}% 转化率，状态：${lastExperiment.status}

可变因素：${log.framework.mutableVariables.join(', ')}

生成下一轮假设（格式："如果改 X，预计 Y 会提升"）：`;

    try {
      const response = await this.ai.callAI(prompt);
      return response.trim();
    } catch {
      return `优化 ${log.framework.mutableVariables[0]} 以提升转化`;
    }
  }

  /**
   * 生成变体
   */
  private async generateVariant(
    idea: Idea,
    log: ExperimentLog,
    lastExperiment?: Experiment,
    hypothesis?: string
  ): Promise<Experiment['variant']> {
    const changes: string[] = [];
    let content = '';

    if (log.framework.type === 'landing_page') {
      // Landing Page 实验
      const prompt = `基于假设 "${hypothesis}"，生成 Landing Page 变体。

上一版内容：${lastExperiment?.variant.content || '无'}
可变因素：${log.framework.mutableVariables.join(', ')}

返回 JSON：
{
  "changes": ["改了哪些地方"],
  "content": "完整 HTML"
}`;

      try {
        const response = await this.ai.callAI(prompt);
        const parsed = JSON.parse(response);
        changes.push(...parsed.changes);
        content = parsed.content;
      } catch {
        changes.push('生成默认 Landing Page');
        content = await this.generateDefaultLandingPage(idea);
      }
    } else if (log.framework.type === 'interview') {
      // 访谈实验
      content = await this.generateInterviewScript(idea, log);
      changes.push('生成访谈脚本');
    } else if (log.framework.type === 'pricing') {
      // 定价实验
      content = await this.generatePricingPage(idea, log);
      changes.push('生成定价页面');
    }

    return {
      type: log.framework.type,
      changes,
      content
    };
  }

  /**
   * 部署变体（模拟）
   */
  private async deployVariant(variant: Experiment['variant']): Promise<boolean> {
    // TODO: 实际部署逻辑
    // - Landing Page: 部署到临时 URL
    // - 访谈：发送邀请
    // - 定价：更新价格页面
    return true; // 模拟成功
  }

  /**
   * 收集数据（模拟）
   */
  private async collectMetrics(
    variant: Experiment['variant'],
    framework: ExperimentFramework
  ): Promise<ExperimentResult> {
    // TODO: 实际数据收集逻辑
    // - 等待时间预算耗尽
    // - 或达到样本量
    // - 从数据库/分析工具读取真实数据

    // 模拟数据（实际应该等待真实用户行为）
    const totalContacts = Math.floor(Math.random() * 100) + 50;
    const positiveFeedback = Math.floor(totalContacts * (Math.random() * 0.1));
    const conversionRate = positiveFeedback / totalContacts;

    return {
      success: conversionRate >= framework.successThreshold,
      conversionRate,
      positiveFeedback,
      totalContacts,
      notes: `模拟数据：${positiveFeedback}/${totalContacts}`
    };
  }

  /**
   * 生成反思
   */
  private async generateReflection(
    hypothesis: string,
    metrics: ExperimentResult,
    status: string
  ): Promise<string> {
    if (status === 'keep') {
      return `✅ 假设验证成功：${hypothesis}。转化率 ${Math.round(metrics.conversionRate * 100)}%。`;
    } else if (status === 'discard') {
      return `❌ 假设未验证：${hypothesis}。转化率 ${Math.round(metrics.conversionRate * 100)}% 未达预期。`;
    } else {
      return `⚠️ 实验失败：${hypothesis}`;
    }
  }

  /**
   * 找到最佳变体
   */
  private findBestVariant(log: ExperimentLog): string | undefined {
    if (log.experiments.length === 0) return undefined;

    const keepExperiments = log.experiments.filter(e => e.status === 'keep');
    if (keepExperiments.length === 0) return undefined;

    const best = keepExperiments.reduce((best, current) => 
      current.metrics.conversionRate > best.metrics.conversionRate ? current : best
    );

    return best.id;
  }

  /**
   * 生成学习总结
   */
  private generateLearningSummary(log: ExperimentLog): string {
    const experiments = log.experiments;
    const bestId = this.findBestVariant(log);
    const best = experiments.find(e => e.id === bestId);

    const lines = [
      `实验完成：共 ${experiments.length} 轮`,
      `最佳转化率：${best ? Math.round(best.metrics.conversionRate * 100) : 0}%`,
      '',
      '关键学习：'
    ];

    // 从反思中提取学习
    const learnings = experiments
      .filter(e => e.status === 'keep')
      .map(e => `- ${e.aiReflection}`);

    lines.push(...learnings.slice(0, 5));

    return lines.join('\n');
  }

  /**
   * 格式化总结消息
   */
  private formatSummary(log: ExperimentLog, summary: string): string {
    const best = log.experiments.find(e => e.id === log.bestVariant);

    return `✅ 实验完成！

${summary}

${best ? `
**最佳方案**（第 ${best.round} 轮）：
- 转化率：${Math.round(best.metrics.conversionRate * 100)}%
- 改动：${best.variant.changes.join(', ')}
- 假设：${best.hypothesis}
` : ''}
**下一步建议**：
1. 基于最佳方案正式上线
2. 联系留下联系方式的用户做深度访谈
3. 开始开发 MVP 核心功能

要开始吗？⚡`;
  }

  /**
   * 工具：生成默认 Landing Page
   */
  private async generateDefaultLandingPage(idea: Idea): Promise<string> {
    return `<!DOCTYPE html>
<html>
<head><title>${idea.content.substring(0, 50)}</title></head>
<body>
  <h1>${idea.content}</h1>
  <p>正在验证中...</p>
  <form>
    <input type="email" placeholder="留下邮箱" />
    <button type="submit">通知我</button>
  </form>
</body>
</html>`;
  }

  /**
   * 工具：生成访谈脚本
   */
  private async generateInterviewScript(idea: Idea, log: ExperimentLog): Promise<string> {
    return `访谈脚本：${idea.content}

1. 你目前如何解决这个问题？
2. 这个解决方案有什么痛点？
3. 如果有一个产品可以...你会考虑吗？
4. 你愿意为此付费吗？如果愿意，多少？`;
  }

  /**
   * 工具：生成定价页面
   */
  private async generatePricingPage(idea: Idea, log: ExperimentLog): Promise<string> {
    return `定价方案：${idea.content}

基础版：$9/月
专业版：$19/月
企业版：$49/月`;
  }

  /**
   * 工具：睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
