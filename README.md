# xopc-idealab ⚡

**超级个体灵感催化实验室** — Idea to MVP Accelerator

这不是一个笔记工具，是一个**灵感催化器**。

---

## 愿景

帮助一人公司/超级个体快速落地想法和 MVP 产品。

- **你做什么**：随时丢想法过来
- **我做什么**：默默记录 + 定时催化 + 主动推送

---

## 快速开始

```bash
# 安装依赖
bun install

# 配置环境
cp .env.example .env
# 编辑 .env 填入 TELEGRAM_BOT_TOKEN

# 开发模式
bun run dev

# 生产模式
bun run start
```

---

## 架构

```
xopc-idealab/
├── src/
│   ├── capture/      # Telegram Bot 输入层
│   ├── catalyst/     # AI 催化引擎（心跳 + 报告）
│   ├── brain/        # 超级大脑（外部数据 + 洞察）[TODO]
│   ├── storage/      # Bun SQLite 持久化
│   └── index.ts      # 入口
└── data/             # SQLite 数据库
```

---

## 核心循环

```
捕获 → 沉淀 → 催化 → 反馈
```

1. **捕获**：Telegram Bot 接收文字/语音/链接/图片
2. **沉淀**：存入 SQLite，等待时机
3. **催化**：定时心跳扫描 + AI 深化分析
4. **反馈**：用户标记有价值/无价值，训练品味模型

---

## TODO

- [ ] 语音识别集成
- [ ] 外部数据源（GitHub/ Product Hunt/ TechCrunch）
- [ ] AI 催化报告生成（调用大模型）
- [ ] 用户品味模型（基于反馈学习）
- [ ] Web 界面（V2）

---

## 技术栈

- **Runtime**: Bun
- **Language**: TypeScript
- **Database**: Bun SQLite
- **Bot**: Telegram Bot API
- **AI**: 大模型 API (TBD)

---

Built with ⚡ by Razor & Micjoyce
