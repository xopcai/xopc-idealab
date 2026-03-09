/**
 * AI 催化引擎 - 调用大模型生成深度报告
 */

import type { MarketSignal } from './scanner.ts';

export interface CatalysisReport {
  ideaId: string;
  originalIdea: string;
  generatedAt: number;
  userStory: {
    targetUser: string;
    painPoint: string;
    scenario: string;
    value: string;
  };
  mvpFeatures: {
    mustHave: string[];
    niceToHave: string[];
  };
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    infrastructure: string;
  };
  keyQuestions: string[];
  marketSignals: string[];
  risks: string[];
  confidence: number; // 0-1
  nextSteps: string[];
}

export class AICatalyst {
  private apiUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    // 使用 MiniMax API (默认) 或配置的大模型 API
    this.apiUrl = process.env.AI_API_URL || 'https://api.minimaxi.com/v1/chat/completions';
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'MiniMax-M2.5';
  }

  /**
   * 生成催化报告
   */
  async generate(idea: string, context?: {
    pastIdeas?: string[];
    marketSignals?: MarketSignal[];
    userPreferences?: any;
  }): Promise<CatalysisReport> {
    const prompt = this.buildPrompt(idea, context);

    try {
      const response = await this.callAI(prompt);
      return this.parseReport(response, idea);
    } catch (error) {
      console.error('AI 催化失败:', error);
      // 降级：返回基础报告
      return this.fallbackReport(idea);
    }
  }

  /**
   * 构建 AI 提示词
   */
  private buildPrompt(idea: string, context?: any): string {
    return `你是一个超级个体灵感催化助手。你的任务是帮助用户深化他们的产品想法，从"我有个想法"推进到"这是个可落地的 MVP"。

## 用户的想法
${idea}

${context?.pastIdeas?.length ? `
## 用户历史想法（供参考关联）
${context.pastIdeas.join('\n')}
` : ''}

${context?.marketSignals?.length ? `
## 当前市场信号（Product Hunt 热门）
${context.marketSignals.map((s: any) => `• ${s.title}${s.upvotes ? ` (${s.upvotes} upvotes)` : ''} - ${s.url}`).join('\n')}
` : ''}

## 你的任务
请生成一份催化报告，包含以下内容（用 JSON 格式返回）：

1. **用户故事** - 目标用户、痛点、场景、价值
2. **MVP 功能** - 必须有 vs 锦上添花
3. **技术栈建议** - 前后端 + 数据库 + 基础设施
4. **关键问题** - 5-7 个苏格拉底式问题，帮助用户思考本质
5. **市场信号** - 结合上方真实市场数据
6. **风险评估** - 技术/市场/执行风险
7. **置信度** - 0-1 之间，表示这个想法的可行性
8. **下一步行动** - 3-5 个具体可执行步骤

## 输出格式
严格返回 JSON，不要多余文字。格式如下：
{
  "userStory": {
    "targetUser": "...",
    "painPoint": "...",
    "scenario": "...",
    "value": "..."
  },
  "mvpFeatures": {
    "mustHave": ["...", "..."],
    "niceToHave": ["...", "..."]
  },
  "techStack": {
    "frontend": "...",
    "backend": "...",
    "database": "...",
    "infrastructure": "..."
  },
  "keyQuestions": ["...", "..."],
  "marketSignals": ["...", "..."],
  "risks": ["...", "..."],
  "confidence": 0.7,
  "nextSteps": ["...", "..."]
}

## 产品哲学
- 简单是一切，复杂是 bug
- 用第一性原理思考本质
- 一人公司要用杠杆放大产能
- 1 周内能上线的才是 MVP
`;
  }

  /**
   * 调用大模型 API
   */
  private async callAI(prompt: string): Promise<string> {
    // 如果有 API key，调用真实 API
    if (this.apiKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 秒超时

      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API 错误：${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('AI 响应超时（30 秒）');
        }
        throw error;
      }
    }

    // 没有 API key 时，返回占位符
    throw new Error('未配置 AI API key');
  }

  /**
   * 解析 AI 响应为报告
   */
  private parseReport(aiResponse: string, originalIdea: string): CatalysisReport {
    try {
      // 提取 JSON（处理可能的思考过程）
      let jsonStr = aiResponse;
      
      // 移除可能的 Markdown 代码块标记
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // 提取第一个 { 到最后一个 }
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');
      
      if (startIdx === -1 || endIdx === -1) {
        throw new Error('未找到 JSON 内容');
      }
      
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);

      return {
        ideaId: crypto.randomUUID(),
        originalIdea,
        generatedAt: Date.now(),
        userStory: parsed.userStory || {},
        mvpFeatures: parsed.mvpFeatures || { mustHave: [], niceToHave: [] },
        techStack: parsed.techStack || {},
        keyQuestions: parsed.keyQuestions || [],
        marketSignals: parsed.marketSignals || [],
        risks: parsed.risks || [],
        confidence: parsed.confidence || 0.5,
        nextSteps: parsed.nextSteps || []
      };
    } catch (e: any) {
      console.warn('AI 响应解析失败:', e.message, '使用降级报告');
      return this.fallbackReport(originalIdea);
    }
  }

  /**
   * 降级报告（AI 不可用时）
   */
  private fallbackReport(idea: string): CatalysisReport {
    return {
      ideaId: crypto.randomUUID(),
      originalIdea: idea,
      generatedAt: Date.now(),
      userStory: {
        targetUser: '待分析',
        painPoint: '待分析',
        scenario: '待分析',
        value: '待分析'
      },
      mvpFeatures: {
        mustHave: ['核心功能 1', '核心功能 2'],
        niceToHave: ['增强功能 1']
      },
      techStack: {
        frontend: 'TBD',
        backend: 'TBD',
        database: 'TBD',
        infrastructure: 'TBD'
      },
      keyQuestions: [
        '这个想法的核心价值假设是什么？如何验证？',
        '目标用户愿意为什么付费？',
        '最小可验证 MVP 是什么？（1 周内能上线的）',
        '有什么潜在的技术/市场风险？',
        '和现有解决方案的差异点在哪？'
      ],
      marketSignals: ['待接入外部数据源'],
      risks: ['待分析'],
      confidence: 0.5,
      nextSteps: [
        '明确目标用户和核心痛点',
        '设计 1 周内可上线的 MVP',
        '找到 3 个目标用户做访谈'
      ]
    };
  }

  /**
   * 格式化报告为可读消息
   */
  static formatReport(report: CatalysisReport): string {
    const r = report;
    return `
⚡ 催化报告

**原始想法**：
${r.originalIdea}

---

**用户故事**：
👤 目标用户：${r.userStory.targetUser}
💔 痛点：${r.userStory.painPoint}
📍 场景：${r.userStory.scenario}
💎 价值：${r.userStory.value}

**MVP 功能**：
🔴 必须有：
${r.mvpFeatures.mustHave.map(f => `   • ${f}`).join('\n')}
🟡 锦上添花：
${r.mvpFeatures.niceToHave.map(f => `   • ${f}`).join('\n')}

**技术建议**：
• 前端：${r.techStack.frontend}
• 后端：${r.techStack.backend}
• 数据库：${r.techStack.database}
• 基础设施：${r.techStack.infrastructure}

**关键问题**：
${r.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**市场信号**：
${r.marketSignals.map(s => `• ${s}`).join('\n') || '待接入外部数据源'}

**风险**：
${r.risks.map(r => `• ${r}`).join('\n') || '待分析'}

**置信度**：${Math.round(r.confidence * 100)}%

**下一步**：
${r.nextSteps.map(s => `→ ${s}`).join('\n')}

---

💬 这个催化对你有帮助吗？回复"有用"或"没用"帮我学习你的品味。
    `.trim();
  }
}
