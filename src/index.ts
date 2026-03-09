#!/usr/bin/env bun
/**
 * xopc-idealab - 超级个体灵感催化实验室
 * Idea to MVP Accelerator
 */

import { Bot } from './capture/bot.ts';
import { Catalyst } from './catalyst/engine.ts';
import { Storage } from './storage/db.ts';
import { startApiServer } from './api/server.ts';

console.log('⚡ xopc-idealab 启动中...');

// 初始化存储
const db = new Storage();
await db.init();

// 初始化催化引擎
const catalyst = new Catalyst(db);

// 初始化 Telegram Bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '', db, catalyst);

// 启动
await bot.start();
console.log('✅ 就绪 - 等待灵感输入');

// 启动催化心跳（传入 bot 引用用于推送）
catalyst.startHeartbeat(bot);

// 启动 REST API 服务器（端口可配置）
const apiPort = parseInt(process.env.API_PORT || '3001', 10);
await startApiServer(db, catalyst, bot, apiPort);
