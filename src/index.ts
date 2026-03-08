#!/usr/bin/env bun
/**
 * xopc-idealab - 超级个体灵感催化实验室
 * Idea to MVP Accelerator
 */

import { Bot } from './capture/bot.ts';
import { Catalyst } from './catalyst/engine.ts';
import { Storage } from './storage/db.ts';

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

// 启动催化心跳
catalyst.startHeartbeat();
