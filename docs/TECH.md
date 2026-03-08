# xopc-idealab 技术方案

## 技术栈

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| Runtime | Bun | 内置 SQLite/HTTP/测试，一个运行时搞定 |
| Language | TypeScript | 类型安全，开发体验好 |
| Database | Bun SQLite | 轻量，无需额外依赖，适合 MVP |
| Bot | Telegram Bot API | 最快上线，用户无学习成本 |
| AI | 大模型 API | 催化引擎核心 |

---

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      xopc-idealab                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │   Capture    │    │   Catalyst   │    │    Brain   │ │
│  │   (Bot)      │───▶│   (Engine)   │◀───│   (Data)   │ │
│  │              │    │              │    │            │ │
│  │ - Telegram   │    │ - 心跳扫描    │    │ - 外部信号  │ │
│  │ - 输入捕获    │    │ - AI 深化     │    │ - 趋势分析  │ │
│  │ - 多模态     │    │ - 报告生成    │    │ - 关联洞察  │ │
│  └──────────────┘    └──────────────┘    └────────────┘ │
│         │                    │                           │
│         ▼                    ▼                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │                    Storage                           ││
│  │                   (SQLite)                           ││
│  │  ┌───────────┐  ┌───────────┐  ┌─────────────────┐  ││
│  │  │  ideas    │  │user_profile│  │   value_feedback│  ││
│  │  └───────────┘  └───────────┘  └─────────────────┘  ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
xopc-idealab/
├── src/
│   ├── index.ts              # 入口，初始化各模块
│   ├── capture/
│   │   └── bot.ts            # Telegram Bot 捕获层
│   ├── catalyst/
│   │   └── engine.ts         # 催化引擎（心跳 + AI）
│   ├── brain/
│   │   └── scanner.ts        # 外部数据扫描 [TODO]
│   └── storage/
│       └── db.ts             # Bun SQLite 持久化
├── docs/
│   ├── PRODUCT.md            # 产品方案
│   └── TECH.md               # 技术方案
├── data/                     # SQLite 数据库（.gitignore）
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 核心模块

### 1. Capture (捕获层)

**职责**：接收用户输入，多模态支持

```typescript
// 输入类型
type InputType = 'text' | 'voice' | 'link' | 'image';

// Bot 命令
/start    - 欢迎 + 使用说明
/idea     - 记录新灵感
/status   - 查看灵感库
/help     - 帮助
```

**TODO**:
- [ ] 语音识别集成（Whisper API）
- [ ] 图片 OCR 提取文字

---

### 2. Catalyst (催化引擎)

**职责**：定时心跳扫描，AI 深化分析

```typescript
interface CatalysisReport {
  ideaId: string;
  generatedAt: number;
  userStory: string;        // 用户故事补充
  mvpFeatures: string[];    // MVP 功能建议
  techStack: object;        // 技术实现路径
  keyQuestions: string[];   // 关键问题清单
  marketSignals: string[];  // 市场信号 [TODO]
  confidence: number;       // AI 评估置信度
}
```

**心跳策略**:
- 默认 24 小时一次
- 可配置间隔
- 有信号才推送，无信号沉默

**TODO**:
- [ ] 大模型 API 集成
- [ ] 跨 idea 关联分析
- [ ] 智能推送时机判断

---

### 3. Brain (超级大脑)

**职责**：外部数据收集 + 洞察生成

**数据源**:
- GitHub Trending
- Product Hunt
- Hacker News
- TechCrunch
- Twitter/X 创始人动态

**TODO**:
- [ ] RSS 聚合
- [ ] API 集成
- [ ] 趋势分析算法

---

### 4. Storage (存储层)

**职责**：持久化 idea + 用户画像

**数据表**:
```sql
-- ideas 表
id, content, input_type, created_at, tags, 
passion_score, status, catalysis_report, 
value_feedback, updated_at

-- user_profile 表
key, value, updated_at
```

---

## 部署方案

### 开发环境
```bash
bun install
cp .env.example .env
bun run dev
```

### 生产环境
```bash
# Docker (TODO)
docker build -t xopc-idealab .
docker run -d xopc-idealab

# 或 systemd 服务 (TODO)
```

### 环境变量
```bash
TELEGRAM_BOT_TOKEN=xxx
ALLOWED_USER_IDS=123456789
CATALYST_INTERVAL_HOURS=24
DATABASE_PATH=./data/idealab.sqlite
```

---

## 里程碑

### Phase 1 (Week 1)
- [x] 项目骨架
- [ ] Telegram Bot 可用
- [ ] 基础存储
- [ ] 手动催化测试

### Phase 2 (Week 2-3)
- [ ] AI 催化报告生成
- [ ] 定时心跳
- [ ] 价值反馈收集

### Phase 3 (Week 4-6)
- [ ] 外部数据源集成
- [ ] 跨 idea 关联
- [ ] 品味模型训练

### Phase 4 (Week 7+)
- [ ] Web 界面
- [ ] 多用户支持
- [ ] 性能优化

---

*最后更新：2026-02-24*
