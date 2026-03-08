/**
 * 存储层 - Bun 内置 SQLite
 */

import { Database } from 'bun:sqlite';

export interface Idea {
  id: string;
  content: string;
  inputType: 'text' | 'voice' | 'link' | 'image';
  createdAt: number;
  tags: string[];
  passionScore?: number; // 用户热情度 1-10
  status: 'captured' | 'catalyzing' | 'catalyzed' | 'shelved';
  catalysisReport?: string; // JSON string
}

export class Storage {
  private db: Database;

  constructor(dbPath: string = process.env.DATABASE_PATH || './data/idealab.sqlite') {
    // 确保目录存在
    const dir = dbPath.substring(0, dbPath.lastIndexOf('/'));
    if (dir) {
      Bun.write(dir + '/.gitkeep', '');
    }
    this.db = new Database(dbPath);
  }

  async init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        input_type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        tags TEXT,
        passion_score INTEGER,
        status TEXT NOT NULL DEFAULT 'captured',
        catalysis_report TEXT,
        value_feedback TEXT,
        updated_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_profile (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    console.log('📦 数据库初始化完成');
  }

  saveIdea(idea: Omit<Idea, 'id'>): Idea {
    const id = crypto.randomUUID();
    const now = Date.now();

    this.db.run(
      `INSERT INTO ideas (id, content, input_type, created_at, tags, passion_score, status, catalysis_report, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        idea.content,
        idea.inputType,
        idea.createdAt || now,
        JSON.stringify(idea.tags || []),
        idea.passionScore,
        idea.status,
        idea.catalysisReport,
        now
      ]
    );

    return { id, ...idea };
  }

  getIdeas(status?: string): Idea[] {
    const query = status 
      ? 'SELECT * FROM ideas WHERE status = ? ORDER BY created_at DESC'
      : 'SELECT * FROM ideas ORDER BY created_at DESC';
    
    const rows = this.db.query(query).all(status);
    return rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      inputType: row.input_type,
      createdAt: row.created_at,
      tags: JSON.parse(row.tags || '[]'),
      passionScore: row.passion_score,
      status: row.status,
      catalysisReport: row.catalysis_report,
      valueFeedback: row.value_feedback,
      updatedAt: row.updated_at
    }));
  }

  getIdeaById(id: string): Idea | null {
    const row = this.db.query('SELECT * FROM ideas WHERE id = ?').get(id) as any;
    if (!row) return null;
    
    // 字段名映射（下划线 → 驼峰）
    const mapped: any = {
      id: row.id,
      content: row.content,
      inputType: row.input_type,
      createdAt: row.created_at,
      tags: JSON.parse(row.tags || '[]'),
      passionScore: row.passion_score,
      status: row.status,
      catalysisReport: row.catalysis_report,
      valueFeedback: row.value_feedback,
      updatedAt: row.updated_at
    };
    
    return mapped;
  }

  updateIdea(id: string, updates: Partial<Idea>) {
    const now = Date.now();
    
    // 字段名映射（驼峰 → 下划线）
    const fieldMap: Record<string, string> = {
      'catalysisReport': 'catalysis_report',
      'inputType': 'input_type',
      'createdAt': 'created_at',
      'passionScore': 'passion_score',
      'valueFeedback': 'value_feedback',
      'updatedAt': 'updated_at'
    };
    
    const fields = Object.keys(updates).map(k => {
      const dbField = fieldMap[k] || k;
      return `${dbField} = ?`;
    }).join(', ');
    
    const values = Object.values(updates);
    
    this.db.run(
      `UPDATE ideas SET ${fields}, updated_at = ? WHERE id = ?`,
      [...values, now, id]
    );
  }

  saveUserProfile(key: string, value: any) {
    const now = Date.now();
    this.db.run(
      `INSERT OR REPLACE INTO user_profile (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, JSON.stringify(value), now]
    );
  }

  getUserProfile(key: string): any {
    const row = this.db.query('SELECT value FROM user_profile WHERE key = ?').get(key) as any;
    if (!row) return null;
    return JSON.parse(row.value);
  }

  getPendingCatalysis(): Idea[] {
    // 获取待催化的 idea: 已捕获但未催化，或已催化但需要重新评估
    const rows = this.db.query(`
      SELECT * FROM ideas 
      WHERE status IN ('captured', 'catalyzed') 
      ORDER BY created_at DESC
    `).all() as any[];

    return rows.map(row => ({
      id: row.id,
      content: row.content,
      inputType: row.input_type,
      createdAt: row.created_at,
      tags: JSON.parse(row.tags || '[]'),
      passionScore: row.passion_score,
      status: row.status,
      catalysisReport: row.catalysis_report,
      valueFeedback: row.value_feedback,
      updatedAt: row.updated_at
    }));
  }
}
