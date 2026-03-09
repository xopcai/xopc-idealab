# xopc-idealab × autoresearch 思维映射

**日期**: 2026-03-09  
**作者**: Claw ⚡

---

## 核心洞察

**当前 xopc-idealab 的问题**：
> 一次性催化报告 = "AI 告诉你答案"  
> 但超级个体需要的是**探索过程**，不是**标准答案**

**autoresearch 的启示**：
> 不是让 AI 写代码，是让 AI**在约束下自主探索**  
> 人类早上醒来看到的是**实验日志 + 最佳结果**，不是**唯一答案**

---

## 映射表

| autoresearch | xopc-idealab 当前 | xopc-idealab 进化版 |
|--------------|------------------|---------------------|
| `train.py` (可修改) | 催化报告 (静态) | **MVP 实验脚本** (可迭代) |
| `prepare.py` (固定) | AI 提示词 (固定) | **实验框架** (固定评估标准) |
| `program.md` (人类写) | 无 | **产品策略指令** (人类定义禁忌/方向) |
| `val_bpb` (单一指标) | 置信度评分 (无意义) | **成功指标** (用户访谈正反馈数/转化率) |
| 5 分钟训练预算 | 一次性生成 | **2 小时实验预算** |
| 100 实验/夜 | 1 次催化/天 | **10 实验/工作日** |
| 分支前进/回退 | 无版本概念 | **方案版本树** |
| results.tsv | 催化报告存储 | **实验日志时间线** |

---

## 产品设计：Experiment-First Catalysis

### 核心流程

```
用户输入想法
    ↓
xopc-idealab 生成"最小实验框架"
    ├── 固定时间预算（2 小时/实验）
    ├── 单一成功指标（如：5 个用户访谈中 3 个说愿意付费）
    ├── 可修改范围（Landing Page 文案 / 定价 / 功能优先级）
    └── 禁止修改范围（目标用户定义 / 核心价值假设）
    ↓
Agent 自主迭代 N 次
    ├── 实验 #1: Landing Page A → 0/5 正反馈 → 丢弃
    ├── 实验 #2: Landing Page B → 2/5 正反馈 → 保留
    ├── 实验 #3: 定价调整 → 4/5 正反馈 → 保留 + 前进
    └── ...
    ↓
早晨交付：实验日志 + 最佳方案 + 下一步建议
```

### 数据结构变化

#### 当前 `CatalysisReport`
```typescript
interface CatalysisReport {
  ideaId: string;
  userStory: { ... };
  mvpFeatures: { mustHave[], niceToHave[] };
  techStack: { ... };
  keyQuestions: string[];
  confidence: number;  // ← 问题：这是 AI 的"猜测"，不是真实验证
  nextSteps: string[];
}
```

#### 进化版 `ExperimentLog`
```typescript
interface ExperimentLog {
  ideaId: string;
  experiments: Experiment[];
  bestVariant: string;  // 最佳方案 commit hash
  learningSummary: string;
}

interface Experiment {
  id: string;
  timestamp: number;
  hypothesis: string;  // 本次实验假设
  changes: string[];   // 改了什麼（Landing Page 文案 / 定价）
  metrics: {
    positiveFeedback: number;  // 正反馈数
    totalContacts: number;     // 总接触用户数
    conversionRate: number;    // 转化率
  };
  status: 'keep' | 'discard' | 'crash';
  notes: string;  // AI 的反思
}
```

---

## 技术实现路径

### Phase 1: 实验框架模板 (1 周)

创建 3 个标准实验模板：

1. **Landing Page 实验**
   - 可变：标题 / 副标题 / CTA 文案 / 定价
   - 固定：目标用户 / 核心价值
   - 指标：访问→留资转化率

2. **用户访谈实验**
   - 可变：问题顺序 / 场景描述
   - 固定：核心痛点假设
   - 指标：5 个访谈中"愿意付费"的数量

3. **定价实验**
   - 可变：价格点 / 付费层级
   - 固定：功能范围
   - 指标：点击"购买"的比例

### Phase 2: Agent 自主循环 (2 周)

```typescript
class ExperimentAgent {
  async runExperimentLoop(idea: Idea, maxExperiments: number = 10) {
    let bestVariant = null;
    let bestMetric = 0;

    for (let i = 0; i < maxExperiments; i++) {
      // 1. 生成实验变体
      const variant = await this.generateVariant(idea, bestVariant);
      
      // 2. 部署实验（如：更新 Landing Page）
      await this.deployVariant(variant);
      
      // 3. 收集数据（如：等待 2 小时 / 发送 10 个访谈邀请）
      const metrics = await this.collectMetrics(variant, {
        timeBudget: 2 * 60 * 60 * 1000,  // 2 小时
        sampleSize: 10
      });
      
      // 4. 评估：改进则保留，否则回退
      if (metrics.successRate > bestMetric) {
        bestVariant = variant;
        bestMetric = metrics.successRate;
        await this.logExperiment({ status: 'keep', ...metrics });
      } else {
        await this.logExperiment({ status: 'discard', ...metrics });
      }
    }

    return this.generateSummary(bestVariant, bestMetric);
  }
}
```

### Phase 3: 用户界面 (1 周)

PWA 新增页面：
- `/experiment/:id` - 实验时间线（类似 GitHub Actions 日志）
- `/report/:id` - 最终报告（当前报告页升级）

---

## 关键设计决策

### 1. 时间预算 vs 样本量

**问题**：实验应该跑多久？

**autoresearch 的答案**：固定时间（5 分钟），让 AI 自己找到最优解。

**xopc-idealab 的选择**：
- **Landing Page 实验**：固定 2 小时（或 100 个访问）
- **用户访谈实验**：固定 5 个访谈（或 48 小时）
- **定价实验**：固定 24 小时（或 50 次点击）

**理由**：超级个体的时间是稀缺资源，需要**可预测的等待时间**。

### 2. 成功指标的设计

**问题**：用什么指标判断实验成功？

**错误答案**：AI 置信度、页面浏览量、点赞数

**正确答案**：**用户愿意付出成本的行为**
- 留下邮箱（成本：隐私）
- 预约访谈（成本：时间）
- 预付定金（成本：金钱）

### 3. 人类的角色

**当前**：被动接收报告

**进化后**：
- **实验前**：定义禁忌（"不要做企业客户"）+ 成功标准（"3/5 用户说愿意付费"）
- **实验中**：完全放手（Agent 自主迭代）
- **实验后**：决策（继续深入 / 转向 / 放弃）

---

## 与 xopc.ai 愿景的对齐

### 第一性原理思考

**问题**：xopc.ai 要解决的是什么？

**表层答案**：想法→MVP 的时间压缩

**深层答案**：**帮助超级个体建立"实验直觉"**

- 不是"帮你做"，是"帮你学会怎么做"
- 不是"交付代码"，是"交付认知"
- 不是"减少工作"，是"提高单位时间的学习密度"

### 克制的产品哲学

**autoresearch 的克制**：
- 只改一个文件 (`train.py`)
- 只用一个指标 (`val_bpb`)
- 只跑固定时间（5 分钟）

**xopc-idealab 的克制**：
- 只改实验变量（文案/定价），不改核心假设
- 只用真实用户行为指标，不用虚荣指标
- 只跑固定预算，不无限探索

---

## 下一步行动

### 本周可做的 MVP 验证

1. **手动跑一次循环**（不用写代码）
   - 选一个真实想法
   - 手动改 3 版 Landing Page 文案
   - 发给 5 个目标用户
   - 记录反馈
   - 反思：如果让 AI 做，哪里可以自动化？

2. **写 `program.md` 原型**
   - 定义 Agent 的产品实验指令
   - 明确禁忌和成功标准

3. **设计实验日志数据结构**
   - 参考 `results.tsv` 格式
   - 适配 MVP 验证场景

### 技术债清理

- [ ] 当前 `confidence` 字段无意义 → 改为 `validationMetrics`
- [ ] 催化报告是静态 JSON → 改为实验日志数组
- [ ] 市场信号扫描与实验脱节 → 改为实验前/后对比

---

## 风险与反思

### 风险 1: 过度工程化

**警示**：autoresearch 只有 3 个核心文件，xopc-idealab 不要做成"企业级实验平台"。

**对策**：
- 先手动跑通流程，再自动化
- 第一个版本只支持一种实验类型（Landing Page）
- 指标只跟踪一个（转化率）

### 风险 2: 用户不理解"实验"思维

**警示**：用户可能期待"一键生成 MVP"，不是"10 次实验日志"。

**对策**：
- 产品文案明确预期："7 天实验，验证你的想法"
- 首次使用引导：解释"为什么实验比答案重要"
- 报告页强调学习，不是功能列表

### 风险 3: 伦理边界

**警示**：Agent 自主联系用户可能被视为骚扰。

**对策**：
- 所有用户接触需要人类预先授权
- 提供"实验联系人列表"供用户审核
- 默认使用被动收集（Landing Page 访问），不是主动 outreach

---

## 总结

**autoresearch 的本质**：
> 用约束换取可重复性，用迭代换取最优解

**xopc-idealab 的进化方向**：
> 从"AI 生成答案"到"AI 帮你探索"  
> 从"一次性报告"到"实验日志时间线"  
> 从"置信度评分"到"真实用户验证"

**最终目标**：
> 让用户在 7 天后，不仅有一个验证过的 MVP，还有一套**可复用的实验直觉**

---

*⚡ Built by Claw, for Xu's xopc.ai vision*
