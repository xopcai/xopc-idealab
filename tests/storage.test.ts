/**
 * Storage 层单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Storage } from '../src/storage/db.ts';
import { unlinkSync } from 'fs';

const TEST_DB_PATH = '/tmp/test-idealab.sqlite';

describe('Storage', () => {
  let storage: Storage;

  beforeEach(async () => {
    // 清理旧数据库
    try {
      unlinkSync(TEST_DB_PATH);
    } catch {}
    
    storage = new Storage(TEST_DB_PATH);
    await storage.init();
  });

  afterEach(() => {
    // 清理测试数据库
    try {
      unlinkSync(TEST_DB_PATH);
    } catch {}
  });

  it('应该成功初始化数据库', () => {
    expect(storage).toBeDefined();
  });

  it('应该成功保存 idea', () => {
    const idea = storage.saveIdea({
      content: '测试想法',
      inputType: 'text',
      createdAt: Date.now(),
      tags: ['测试'],
      status: 'captured'
    });

    expect(idea.id).toBeDefined();
    expect(idea.content).toBe('测试想法');
    expect(idea.inputType).toBe('text');
    expect(idea.status).toBe('captured');
  });

  it('应该成功获取所有 ideas', () => {
    storage.saveIdea({
      content: '想法 1',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'captured'
    });

    storage.saveIdea({
      content: '想法 2',
      inputType: 'voice',
      createdAt: Date.now(),
      tags: ['重要'],
      status: 'captured'
    });

    const ideas = storage.getIdeas();
    expect(ideas.length).toBe(2);
    expect(ideas[0].content).toBe('想法 2'); // 按时间倒序
  });

  it('应该成功按状态筛选 ideas', () => {
    storage.saveIdea({
      content: '已捕获',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'captured'
    });

    storage.saveIdea({
      content: '已催化',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'catalyzed'
    });

    const captured = storage.getIdeas('captured');
    expect(captured.length).toBe(1);
    expect(captured[0].content).toBe('已捕获');
  });

  it('应该成功获取单个 idea', () => {
    const saved = storage.saveIdea({
      content: '单个测试',
      inputType: 'text',
      createdAt: Date.now(),
      tags: ['测试'],
      status: 'captured'
    });

    const fetched = storage.getIdeaById(saved.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.content).toBe('单个测试');
  });

  it('应该成功更新 idea', () => {
    const saved = storage.saveIdea({
      content: '原始内容',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'captured'
    });

    storage.updateIdea(saved.id, {
      status: 'catalyzed',
      catalysisReport: JSON.stringify({ test: 'report' })
    });

    const updated = storage.getIdeaById(saved.id);
    expect(updated?.status).toBe('catalyzed');
    expect(updated?.catalysisReport).toBeDefined();
  });

  it('应该成功保存和获取用户配置', () => {
    storage.saveUserProfile('preference', { theme: 'dark', lang: 'zh' });
    
    const pref = storage.getUserProfile('preference');
    expect(pref.theme).toBe('dark');
    expect(pref.lang).toBe('zh');
  });

  it('应该成功获取待催化 ideas', () => {
    storage.saveIdea({
      content: '待催化 1',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'captured'
    });

    storage.saveIdea({
      content: '已催化',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'catalyzed'
    });

    storage.saveIdea({
      content: '待催化 2',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'captured'
    });

    const pending = storage.getPendingCatalysis();
    expect(pending.length).toBe(3); // captured + catalyzed 都可以重新催化
  });

  it('应该正确处理空 tags', () => {
    const idea = storage.saveIdea({
      content: '无标签测试',
      inputType: 'text',
      createdAt: Date.now(),
      tags: [],
      status: 'captured'
    });

    const fetched = storage.getIdeaById(idea.id);
    expect(fetched?.tags).toEqual([]);
  });
});
