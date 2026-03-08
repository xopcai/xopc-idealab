/**
 * 催化引擎 - AI 心跳 + 深化
 */

import type { Storage, Idea } from '../storage/db.ts';
import { AICatalyst, type CatalysisReport } from '../brain/ai.ts';

export class Catalyst {
  private db: Storage;
  private ai: AICatalyst;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private intervalHours: number;

  constructor(db: Storage) {
    this.db = db;
    this.ai = new AICatalyst();
    this.intervalHours = parseInt(process.env.CATALYST_INTERVAL_HOURS || '24');
  }

  /**
   * 启动心跳 - 定时扫描催化
   */
  startHeartbeat(bot: any) {
    const intervalMs = this.intervalHours * 60 * 60 * 1000;
    
    console.log(`⏰ 催化心跳启动 - 每 ${this.intervalHours} 小时`);
    
    // 立即执行一次
    this.heartbeat(bot);
    
    // 定时执行
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat(bot);
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
  private async heartbeat(bot: any) {
    console.log('💓 催化心跳触发...');

    const ideas = this.db.getPendingCatalysis();
    
    if (ideas.length === 0) {
      console.log('  └─ 暂无待催化灵感');
      return;
    }

    console.log(`  └─ 待催化灵感：${ideas.length} 条`);

    // 每次只催化 1 条，避免骚扰
    for (const idea of ideas.slice(0, 1)) {
      if (idea.status === 'captured') {
        const report = await this.catalyzeIdea(idea);
        if (report) {
          await this.pushReport(report, bot);
        }
      }
    }
  }

  /**
   * 催化单条 idea
   */
  private async catalyzeIdea(idea: Idea) {
    console.log(`  └─ 催化中：${idea.id}`);

    try {
      // 调用 AI 生成催化报告
      const report = await this.ai.generate(idea.content, {
        pastIdeas: await this.getRelatedIdeas(idea)
      });

      // 更新状态
      this.db.updateIdea(idea.id, {
        status: 'catalyzed',
        catalysisReport: JSON.stringify(report)
      });

      console.log(`  └─ 催化完成，置信度：${Math.round(report.confidence * 100)}%`);

      // 推送给用户
      return report;
    } catch (error) {
      console.error(`  └─ 催化失败：`, error);
      return null;
    }
  }

  /**
   * 获取相关 idea（用于 AI 上下文）
   */
  private async getRelatedIdeas(idea: Idea): Promise<string[]> {
    const allIdeas = this.db.getIdeas('catalyzed');
    // 返回最近 5 条已催化的 idea 作为上下文
    return allIdeas.slice(0, 5).map(i => i.content);
  }

  /**
   * 推送催化报告
   */
  async pushReport(report: CatalysisReport, bot: any) {
    const message = AICatalyst.formatReport(report);
    await bot.sendPush(message);
  }
}
