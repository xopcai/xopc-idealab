/**
 * Telegram Bot 捕获层
 */

import TelegramBot from 'node-telegram-bot-api';
import type { Storage } from '../storage/db.ts';
import type { Catalyst } from '../catalyst/engine.ts';
import { SpeechRecognizer } from '../brain/speech.ts';

export class Bot {
  private bot: TelegramBot;
  private db: Storage;
  private catalyst: Catalyst;
  private speech: SpeechRecognizer;
  private allowedUserIds: number[] = [];
  private pendingFeedback: Map<number, string> = new Map(); // chatId -> ideaId

  constructor(token: string, db: Storage, catalyst: Catalyst) {
    if (!token) {
      console.warn('⚠️  未设置 TELEGRAM_BOT_TOKEN，Bot 无法启动');
    }
    
    this.bot = new TelegramBot(token, { polling: true });
    this.db = db;
    this.catalyst = catalyst;
    this.speech = new SpeechRecognizer();
    
    // 解析允许的用户 ID
    const ids = process.env.ALLOWED_USER_IDS;
    if (ids) {
      this.allowedUserIds = ids.split(',').map(id => parseInt(id.trim()));
    }

    this.setupHandlers();
  }

  private setupHandlers() {
    // /start 命令
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      if (!this.isAllowed(chatId)) return;

      this.bot.sendMessage(chatId, 
        `⚡ 欢迎来到 xopc-idealab

这里是你的灵感催化实验室。

**如何使用：**
1. 直接发送任何想法给我（文字/语音/链接/图片）
2. 我会默默记录，并在合适时机催化
3. 当有值得深化的洞察时，我会主动推送

**命令：**
/idea - 记录新灵感
/status - 查看我的灵感库
/help - 帮助

开始吧，丢个想法过来 👇`
      );
    });

    // /idea 命令
    this.bot.onText(/\/idea\s*(.*)/, (msg, match) => {
      const chatId = msg.chat.id;
      if (!this.isAllowed(chatId)) return;

      const content = match[1]?.trim();
      if (!content) {
        this.bot.sendMessage(chatId, '💡 请跟上你的想法内容，例如：\n/idea 做一个 AI 驱动的灵感催化器');
        return;
      }

      this.captureIdea(chatId, content, 'text');
    });

    // 处理普通消息（作为 idea 捕获）
    this.bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      if (!this.isAllowed(chatId)) return;

      // 忽略命令
      if (msg.text?.startsWith('/')) return;

      // 处理文字
      if (msg.text) {
        this.captureIdea(chatId, msg.text, 'text');
        return;
      }

      // 处理语音
      if (msg.voice) {
        this.handleVoiceMessage(chatId, msg.voice.file_id);
        return;
      }

      // 处理链接（在 text 中）
      if (msg.entities?.some(e => e.type === 'url')) {
        this.captureIdea(chatId, msg.text || '', 'link');
        return;
      }

      // 处理图片
      if (msg.photo && msg.photo.length > 0) {
        const caption = msg.caption || '';
        this.captureIdea(chatId, caption || '[图片]', 'image');
        return;
      }

      // 其他类型
      this.bot.sendMessage(chatId, '📩 收到，但不确定这是什么类型。直接发文字想法最靠谱。');
    });

    // /status 命令
    this.bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;
      if (!this.isAllowed(chatId)) return;

      const ideas = this.db.getIdeas();
      const captured = ideas.filter(i => i.status === 'captured').length;
      const catalyzed = ideas.filter(i => i.status === 'catalyzed').length;

      this.bot.sendMessage(chatId, 
        `📊 你的灵感状态

已捕获：${captured}
已催化：${catalyzed}
总计：${ideas.length}

最近 3 条：
${ideas.slice(0, 3).map(i => `• ${i.content.slice(0, 30)}${i.content.length > 30 ? '...' : ''}`).join('\n') || '暂无'}
      `);
    });

    // /help 命令
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      if (!this.isAllowed(chatId)) return;

      this.bot.sendMessage(chatId, 
        `🤔 xopc-idealab 是什么？

这不是一个笔记工具，是一个**灵感催化器**。

**你做什么：**
- 随时丢想法过来（文字/语音/链接/图片）
- 偶尔标记"这个有价值"或"这个没用"

**我做什么：**
- 默默记录你的想法
- 定时分析 + 扫描外部信号
- 当发现值得深化的洞察时，主动推送催化报告

**催化报告包含：**
- 用户故事补充
- MVP 功能建议
- 技术实现路径
- 关键问题清单

简单说：你负责灵感，我负责催化。
      `);
    });

    // 处理价值反馈
    this.bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text?.toLowerCase();
      if (!this.isAllowed(chatId) || !text) return;

      // 检测反馈关键词
      if (text.includes('有用') || text.includes('helpful') || text.includes('👍')) {
        this.recordFeedback(chatId, 'positive');
        this.bot.sendMessage(chatId, '👍 收到！我会记住你的偏好，未来催化更精准。');
      } else if (text.includes('没用') || text.includes('not helpful') || text.includes('👎')) {
        this.recordFeedback(chatId, 'negative');
        this.bot.sendMessage(chatId, '👎 收到！告诉我哪里不够好，我会改进。');
      }
    });
  }

  private captureIdea(chatId: number, content: string, type: 'text' | 'voice' | 'link' | 'image') {
    const idea = this.db.saveIdea({
      content,
      inputType: type,
      createdAt: Date.now(),
      tags: [],
      status: 'captured'
    });

    this.bot.sendMessage(chatId, 
      `✅ 已记录

"${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"

我会默默消化，有洞察时找你。`
    );

    console.log(`💡 新灵感捕获: ${idea.id}`);
  }

  private isAllowed(chatId: number): boolean {
    if (this.allowedUserIds.length === 0) return true; // 未设置则允许所有人
    return this.allowedUserIds.includes(chatId);
  }

  private recordFeedback(chatId: number, type: 'positive' | 'negative') {
    // TODO: 记录反馈到数据库，用于训练品味模型
    console.log(`📝 反馈记录：chatId=${chatId}, type=${type}`);
    this.db.saveUserProfile('feedback_history', {
      [chatId]: {
        [Date.now()]: type
      }
    });
  }

  private async handleVoiceMessage(chatId: number, fileId: string) {
    const loadingMsg = await this.bot.sendMessage(chatId, '🎤 收到语音，正在转文字...');

    try {
      const text = await this.speech.transcribe(fileId, this.bot);
      
      // 删除加载消息
      await this.bot.deleteMessage(chatId, loadingMsg.message_id);
      
      // 确认识别结果
      await this.bot.sendMessage(chatId, `🎤 识别结果：\n"${text}"`);
      
      // 自动保存为 idea
      this.captureIdea(chatId, text, 'voice');
    } catch (error: any) {
      await this.bot.editMessageText(
        `❌ 语音识别失败：${error.message}`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
  }

  async start() {
    console.log('🤖 Telegram Bot 启动中...');
    // Bot 已经在构造函数中启动 polling
  }

  async sendPush(message: string) {
    // 向所有允许的用户推送催化报告
    for (const userId of this.allowedUserIds) {
      try {
        await this.bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
      } catch (e) {
        console.warn(`推送失败 ${userId}:`, e);
      }
    }
  }

  getBot(): TelegramBot {
    return this.bot;
  }
}
