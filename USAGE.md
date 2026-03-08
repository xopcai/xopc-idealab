# xopc-idealab 使用文档

**版本**: v0.1.0  
**发布日期**: 2026-03-09  
**访问地址**: https://idea.xopc.ai

---

## 🚀 快速开始

### 1. 访问 PWA 应用

打开浏览器访问：**https://idea.xopc.ai/pwa**

推荐添加到主屏幕：
- **iOS Safari**: 分享 → 添加到主屏幕
- **Android Chrome**: 菜单 → 安装应用

### 2. 登录

1. 获取你的 Telegram User ID
   - 在 Telegram 搜索 `@userinfobot`
   - 发送 `/start` 获取你的 ID（例如：916534770）

2. 在登录页输入 User ID
3. 点击"开始使用"

**说明**: 首次登录自动创建账户，Token 永久有效（存储在本地）

---

## 💡 核心功能

### 记录灵感

**方式 1 - PWA 快速输入**
1. 打开 https://idea.xopc.ai/pwa
2. 在首页输入框输入想法
3. 按 Enter 或点击"保存灵感"

**方式 2 - Telegram Bot**
1. 在 Telegram 搜索你的 Bot（@xopcidealabdev_bot）
2. 发送 `/idea 你的想法`
3. 或直接发送文字消息

**方式 3 - 语音输入**
1. 在 Telegram Bot 发送语音消息
2. 自动转文字并保存（需配置 OpenAI API key）

---

### 查看灵感

**PWA**:
- 首页显示所有灵感列表
- 点击任意灵感查看详情
- 支持按时间线浏览

**Telegram**:
- 发送 `/status` 查看概览
- 未来支持查看列表

---

### AI 催化

**手动触发**（推荐）:
1. 在 PWA 打开灵感详情
2. 点击"⚡ 催化"按钮
3. 等待 AI 生成报告（约 10-20 秒）
4. 自动跳转到报告页面

**自动催化**:
- 系统每 24 小时自动扫描待催化灵感
- 催化完成后推送到 Telegram

**催化报告包含**:
- 👤 用户故事（目标用户/痛点/场景/价值）
- 🔴 MVP 功能（必须有/锦上添花）
- 💻 技术栈建议
- ❓ 5-7 个关键问题
- → 5 个下一步行动
- 📊 AI 置信度评分

---

### 反馈

在催化报告底部：
- 👍 **有用**: AI 学习你的偏好
- 👎 **没用**: 帮助改进催化质量

---

## 📱 使用场景

### 场景 1: 通勤路上有灵感
1. 打开 Telegram
2. 语音输入想法
3. 自动保存，回家后再查看催化报告

### 场景 2: 深度思考产品方向
1. 打开 PWA
2. 记录详细想法
3. 手动触发催化
4. 阅读 AI 生成的用户故事和关键问题
5. 根据下一步行动执行

### 场景 3: 回顾历史灵感
1. 打开 PWA 首页
2. 浏览灵感列表
3. 查看已催化的报告
4. 找到值得继续深化的想法

---

## 🔧 API 使用

### 获取 Token

```bash
curl -X POST https://idea.xopc.ai/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"telegramUserId": 916534770}'
```

### 创建灵感

```bash
curl -X POST https://idea.xopc.ai/api/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "我的新想法"}'
```

### 获取灵感列表

```bash
curl https://idea.xopc.ai/api/ideas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 手动催化

```bash
curl -X POST https://idea.xopc.ai/api/catalyst/IDEA_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

完整 API 文档：`API.md`

---

## ⚙️ 配置

### 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `8780454763:AAEF...` |
| `ALLOWED_USER_IDS` | 允许的用户 ID（逗号分隔） | `916534770` |
| `CATALYST_INTERVAL_HOURS` | 催化心跳间隔（小时） | `24` |
| `AI_API_KEY` | MiniMax API Key | `sk-cp-...` |
| `AI_API_URL` | AI API 地址 | `https://api.minimaxi.com/v1/chat/completions` |
| `AI_MODEL` | AI 模型 | `MiniMax-M2.5` |
| `OPENAI_API_KEY` | OpenAI API Key（语音识别） | `sk-...` |

---

## 📊 技术架构

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   PWA       │────▶│   REST API   │────▶│   SQLite    │
│  (React)    │     │   (Bun)      │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  MiniMax AI  │
                    │  (Catalyst)  │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Telegram   │
                    │     Bot      │
                    └──────────────┘
```

**技术栈**:
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Bun + TypeScript
- **数据库**: Bun SQLite
- **AI**: MiniMax-M2.5
- **部署**: nginx + Let's Encrypt HTTPS

---

## 🐛 常见问题

### Q: Token 在哪里？
A: 首次登录 PWA 时自动生成，存储在浏览器本地存储。

### Q: 催化需要多久？
A: 约 10-20 秒，取决于 AI 响应速度。

### Q: 语音识别不工作？
A: 需要配置 OpenAI API key 到 `.env` 文件。

### Q: 如何删除灵感？
A: PWA 打开灵感详情 → 点击"删除"。

### Q: 催化报告能导出吗？
A: 暂时不支持，未来版本会添加导出功能。

---

## 📝 更新日志

### v0.1.0 (2026-03-09)
- ✅ 初始版本发布
- ✅ Telegram Bot 记录灵感
- ✅ PWA 应用（登录/列表/详情/报告）
- ✅ REST API 完整端点
- ✅ AI 催化报告（MiniMax-M2.5）
- ✅ 手动/自动催化
- ✅ 反馈收集
- ✅ HTTPS 部署

---

## 📞 支持

- **GitHub**: https://github.com/xopcai/xopc-idealab
- **Telegram Bot**: @xopcidealabdev_bot
- **PWA**: https://idea.xopc.ai/pwa

---

*Built with ⚡ by Razor & Micjoyce*
