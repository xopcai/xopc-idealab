# AI 催化实现方案调研

## 一、xopcbot 可行性分析

### xopcbot 是什么

**xopcbot** = 超轻量个人 AI 助手（Node.js + TypeScript）

核心能力：
- ✅ Telegram/Feishu/Web UI 多通道
- ✅ 本地运行，20+ AI 模型支持
- ✅ 文件操作、Web 搜索、代码助手
- ✅ Cron 定时任务

GitHub: https://github.com/xopcai/xopcbot

---

### 使用 xopcbot 做 AI 催化的可行性

| 维度 | 评估 | 说明 |
|-----|------|------|
| **通道集成** | ✅ 成熟 | Telegram Bot 已有完整实现 |
| **AI 模型** | ✅ 成熟 | 20+ 提供商，支持阿里云百炼 |
| **定时任务** | ✅ 成熟 | 内置 Cron 支持 |
| **对话管理** | ✅ 成熟 | 多轮对话、上下文管理 |
| **扩展性** | ✅ 良好 | 插件驱动架构 |

**结论**：**xopcbot 完全可行**，且能大幅减少重复开发。

---

### 两种技术路线对比

| 方案 | 优点 | 缺点 | 推荐度 |
|-----|------|------|--------|
| **方案 A：基于 xopc-idealab 独立开发** | 完全可控、定制灵活 | 重复造轮子、AI 集成需从头做 | ⭐⭐⭐ |
| **方案 B：基于 xopcbot 扩展催化插件** | 复用 AI/通道/Cron、快速上线 | 需要学习 xopcbot 架构 | ⭐⭐⭐⭐⭐ |

**推荐方案 B**：
- xopc-idealab 当前代码量 ~500 行
- xopcbot 已有 ~2800 行成熟代码
- 催化逻辑核心是 AI 提示词 + 定时调度，xopcbot 都已支持

---

## 二、AI 催化实现方案

### 催化本质

**不是回答问题，而是提出好问题。**

催化目标：
1. 推动用户深化思考
2. 识别值得投入的 idea
3. 生成可执行的下一步

---

### 催化框架（基于 IDEA）

参考 Harvard DCE 的 Product Development with AI 框架：

```
┌─────────────────────────────────────────────────────────┐
│                    AI 催化四阶段                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  I - Identify（识别）                                   │
│  └─ 这个 idea 的核心价值假设是什么？                      │
│                                                         │
│  D - Develop（深化）                                    │
│  └─ 目标用户是谁？他们现在用什么解决方案？                │
│                                                         │
│  E - Evaluate（评估）                                   │
│  └─ 有什么潜在风险？最小验证方式是什么？                  │
│                                                         │
│  A - Act（行动）                                        │
│  └─ 下一步最小行动是什么？1 周内能完成什么？              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 心跳节奏设计

参考 OpenClaw + RelevanceAI 的 Follow-up 机制：

| 阶段 | 时间窗口 | 心跳间隔 | 催化类型 |
|-----|---------|---------|---------|
| **新鲜期** | 0-24h | 不催化 | 让灵感沉淀 |
| **孵化期** | 24h-7d | 24h | 提问式（深化思考） |
| **深化期** | 7d-30d | 72h | 行动式（MVP 路线） |
| **休眠期** | 30d+ | 7d | 唤醒式（放弃/重启） |

**关键设计**：
- 每个 idea 独立心跳（不是全局统一）
- 基于用户反馈调整节奏（有用→加快，没用→减慢）
- 每天最多推送 3 次（避免打扰）

---

### AI 提示词框架

```
你是 xopc.ai 的创意催化师，不是助手。

你的任务不是回答问题，而是提出好问题。

## 上下文
- 用户：超级个体/一人公司创始人
- 目标：从灵感到 MVP 的时间压缩
- 品味：{user_preference}

## Idea 信息
- 原始想法：{idea_content}
- 创建时间：{created_at}
- 当前阶段：{stage}
- 对话历史：{conversation_history}

## 催化规则
1. 每次只提 1-2 个核心问题（不要轰炸）
2. 问题应该推动用户思考下一步行动
3. 避免泛泛而谈（如"这个想法很好"）
4. 基于对话历史，不要重复已问过的问题

## 输出格式
{
  "questions": ["问题 1", "问题 2"],
  "suggestions": ["可选建议（不超过 3 条）"],
  "confidence": 0.7,  // AI 对 idea 价值的判断
  "nextBeat": "24h"   // 建议下次心跳时间
}
```

---

### 催化报告结构

参考 RelevanceAI 的 Follow-up Reminder：

```markdown
⚡ 催化报告 #001

**原始想法**：
做一个 AI 驱动的灵感催化器

---

**深化思考**：
❓ 这个 idea 的目标用户是谁？
❓ 他们现在用什么工具记录灵感？
❓ xopc.ai 和 Notion/备忘录的差异化在哪？

**行动建议**：
• 1 天内：写下 3 个目标用户故事
• 3 天内：访谈 2 个超级个体，验证痛点
• 7 天内：上线 Telegram Bot MVP

**外部信号**：
• 竞品 A 上周融资（说明市场认可）
• 用户 B 在 Twitter 抱怨现有工具（痛点真实）

---

💬 这个催化对你有帮助吗？回复"有用"或"没用"
```

---

## 三、技术实现路径

### 方案 B：基于 xopcbot 扩展

```
xopcbot/
├── src/
│   ├── agents/
│   │   └── catalyst/        # 新增：催化 Agent
│   │       ├── index.ts     # 入口
│   │       ├── heartbeat.ts # 心跳调度
│   │       ├── prompt.ts    # 催化提示词
│   │       └── report.ts    # 报告生成
│   ├── channels/
│   │   └── telegram.ts      # 已有
│   ├── tools/
│   │   └── ai.ts            # 已有（AI 调用）
│   └── cron/
│       └── scheduler.ts     # 已有（定时任务）
└── config/
    └── catalyst.yaml        # 催化配置
```

### 核心代码（伪代码）

```typescript
// catalyst/heartbeat.ts
class CatalystHeartbeat {
  async scan() {
    const ideas = await db.getPendingIdeas();
    
    for (const idea of ideas) {
      const stage = this.calculateStage(idea);
      const shouldCatalyze = this.shouldCatalyze(idea, stage);
      
      if (shouldCatalyze) {
        await this.catalyze(idea, stage);
      }
    }
  }
  
  async catalyze(idea: Idea, stage: Stage) {
    // 1. 生成催化提示词
    const prompt = await buildPrompt(idea, stage);
    
    // 2. 调用 AI
    const response = await ai.generate(prompt);
    
    // 3. 发送推送
    await bot.send(idea.userId, formatReport(response));
    
    // 4. 更新下次心跳时间
    await db.updateNextBeat(idea.id, response.nextBeat);
  }
}

// 注册 Cron 任务（每小时扫描一次）
cron.schedule('0 * * * *', () => heartbeat.scan());
```

---

## 四、品味学习机制

### 显式反馈

```
用户回复：
- "有用" → passionScore +1，加快心跳
- "没用" → passionScore -1，减慢心跳
- "放弃" → status = 'shelved'，停止催化
```

### 隐式学习

```
基于对话历史分析：
- 用户回应长度（长→感兴趣）
- 回应速度（快→高热情）
- 主动追问（是→深度参与）
- 标记行动完成（是→执行力强）
```

### 品味模型

```typescript
interface UserPreference {
  preferredQuestionStyle: 'direct' | 'gentle' | 'challenging';
  focusAreas: ['product' | 'tech' | 'market' | 'design'];
  actionOrientation: 'high' | 'medium' | 'low';
  avgResponseLength: number;
  bestCatalystTime: 'morning' | 'afternoon' | 'night';
}
```

---

## 五、外部数据源（V2）

催化报告可以集成外部信号，提升价值：

| 数据源 | 用途 | 实现难度 |
|-------|------|---------|
| **Product Hunt** | 发现类似产品 | ⭐⭐ |
| **GitHub Trends** | 技术栈热度 | ⭐⭐ |
| **Twitter/X API** | 用户痛点讨论 | ⭐⭐⭐ |
| **Google Trends** | 关键词热度 | ⭐⭐ |
| **Crunchbase** | 竞品融资动态 | ⭐⭐⭐ |

**V1 建议**：先不做外部数据，专注催化逻辑验证。

---

## 六、决策建议

### 技术选型

| 决策 | 推荐 | 理由 |
|-----|------|------|
| **基础框架** | xopcbot | 复用 AI/通道/Cron，减少重复 |
| **输入通道** | Telegram Bot | 最快上线，你已有经验 |
| **AI 模型** | 阿里云百炼 | 国内访问稳定，成本低 |
| **心跳节奏** | 基于状态动态调整 | 比固定间隔更智能 |
| **品味学习** | 隐式 + 显式结合 | 不增加用户负担 |

### MVP 范围（2 周）

| 周 | 任务 | 交付 |
|---|------|------|
| 1 | xopcbot 催化插件开发 | 心跳调度 + AI 提示词 |
| 1 | Telegram Bot 集成 | 输入 + 推送 |
| 2 | 品味反馈机制 | 有用/没用处理 |
| 2 | 你自己用起来 | 真实场景验证 |

---

## 七、风险与缓解

| 风险 | 影响 | 缓解 |
|-----|------|------|
| AI 催化质量差 | 用户觉得没用 | 快速迭代提示词，收集反馈 |
| 推送太频繁 | 用户屏蔽通知 | 限制每天最多 3 次，可配置 |
| 品味学习慢 | 催化不精准 | V1 用规则，V2 再上 ML |
| xopcbot 架构复杂 | 学习成本高 | 先读文档，有问题直接问 |

---

## 八、下一步行动

1. **确认技术路线**：方案 A（独立开发）还是方案 B（xopcbot 扩展）？
2. **阅读 xopcbot 文档**：https://xopcai.github.io/xopcbot/
3. **设计催化提示词**：基于 IDEA 框架
4. **搭建开发环境**：安装 xopcbot + 配置 AI 模型

---

*调研完成：2026-03-08*
*版本：v1.0*
