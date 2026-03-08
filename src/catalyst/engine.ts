/**
 * 催化引擎 - AI 心跳 + 深化
 */

import type { Storage, Idea } from '../storage/db.ts';

export class Catalyst {
  private db: Storage;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private intervalHours: number;

  constructor(db: Storage) {
    this.db = db;
    this.intervalHours = parseInt(process.env.CATALYST_INTERVAL_HOURS || '24');
  }

  /**
   * 启动心跳 - 定时扫描催化
   */
  startHeartbeat() {
    const intervalMs = this.intervalHours * 60 * 60 * 1000;
    
    console.log(`⏰ 催化心跳启动 - 每 ${this.intervalHours} 小时`);
    
    // 立即执行一次
    this.heartbeat();
    
    // 定时执行
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 心跳核心逻辑
   */
  private async heartbeat() {
    console.log('💓 催化心跳触发...');

    const ideas = this.db.getPendingCatalysis();
    
    if (ideas.length === 0) {
      console.log('  └─ 暂无待催化灵感');
      return;
    }

    console.log(`  └─ 待催化灵感：${ideas.length} 条`);

    // TODO: AI 分析逻辑
    // 1. 跨 idea 关联
    // 2. 外部信号扫描
    // 3. 价值判断
    // 4. 生成催化报告

    // 简化版：先输出一个占位报告
    for (const idea of ideas.slice(0, 1)) { // 每次只催化 1 条，避免骚扰
      if (idea.status === 'captured') {
        await this.catalyzeIdea(idea);
      }
    }
  }

  /**
   * 催化单条 idea
   */
  private async catalyzeIdea(idea: Idea) {
    console.log(`  └─ 催化中：${idea.id}`);

    // TODO: 调用 AI 生成催化报告
    const report = await this.generateReport(idea);

    // 更新状态
    this.db.updateIdea(idea.id, {
      status: 'catalyzed',
      catalysisReport: JSON.stringify(report)
    });

    console.log(`  └─ 催化完成`);

    // TODO: 推送给用户
    // await bot.sendPush(formatReport(report));
  }

  /**
   * 生成催化报告
   */
  private async generateReport(idea: Idea) {
    // TODO: 调用大模型 API
    // 这里先用占位逻辑

    return {
      ideaId: idea.id,
      generatedAt: Date.now(),
      userStory: this.generateUserStory(idea),
      mvpFeatures: this.generateMvpFeatures(idea),
      techStack: this.generateTechStack(idea),
      keyQuestions: this.generateKeyQuestions(idea),
      marketSignals: [], // TODO: 外部数据
      confidence: 0.7 // TODO: AI 评估
    };
  }

  private generateUserStory(idea: Idea) {
    return `
**目标用户**：超级个体/一人公司创始人
**痛点**：有灵感但难以落地
**场景**：随时随地捕获想法，AI 辅助深化
**价值**：从灵感到 MVP 的时间缩短 10 倍
    `.trim();
  }

  private generateMvpFeatures(idea: Idea) {
    return [
      'Telegram Bot 输入（文字/语音/链接/图片）',
      'AI 定时催化分析',
      '催化报告推送（用户故事 + MVP 建议）',
      '价值反馈收集（训练品味模型）'
    ];
  }

  private generateTechStack(idea: Idea) {
    return {
      frontend: 'Telegram Bot (V2: Web/Mobile App)',
      backend: 'Bun + TypeScript',
      database: 'Bun SQLite',
      ai: '大模型 API (当前环境)'
    };
  }

  private generateKeyQuestions(idea: Idea) {
    return [
      '这个想法的核心价值假设是什么？如何验证？',
      '目标用户愿意为什么付费？',
      '最小可验证 MVP 是什么？（1 周内能上线的）',
      '有什么潜在的技术/市场风险？',
      '和现有解决方案的差异点在哪？'
    ];
  }

  /**
   * 格式化报告为推送消息
   */
  formatReport(report: any): string {
    return `
⚡ 催化报告

**原始想法**：
${report.idea.content}

---

**用户故事**：
${report.userStory}

**MVP 功能**：
${report.mvpFeatures.map((f: string) => `• ${f}`).join('\n')}

**技术建议**：
${Object.entries(report.techStack).map(([k, v]) => `• ${k}: ${v}`).join('\n')}

**关键问题**：
${report.keyQuestions.map((q: string) => `❓ ${q}`).join('\n')}

---

💬 这个催化对你有帮助吗？回复"有用"或"没用"帮我学习你的品味。
    `.trim();
  }
}
