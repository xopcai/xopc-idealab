# xopc-idealab 代码优化建议

**Review 日期**: 2026-03-09  
**Reviewer**: Razor ⚡

---

## 🔴 高优先级（安全/稳定性）

### 1. Token 存储安全问题

**问题**: Token 存储在内存 Map 中，重启后丢失

```typescript
// src/api/server.ts
interface Env {
  tokens: Map<string, { userId: number; createdAt: number }>;
}
```

**建议**:
- 将 Token 持久化到数据库
- 添加 Token 过期/撤销机制
- 考虑使用 JWT

**修复**:
```typescript
// 新增 tokens 表
CREATE TABLE tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  revoked INTEGER DEFAULT 0
)
```

---

### 2. 缺少输入验证

**问题**: API 未验证输入，可能导致注入攻击

```typescript
// src/api/server.ts
const { content, inputType = 'text', tags = [] } = body;
// 未验证 content 长度、inputType 枚举值
```

**建议**:
```typescript
// 添加验证中间件
function validateIdeaInput(body: any) {
  if (!body.content || typeof body.content !== 'string') {
    throw new Error('content 必填且为字符串');
  }
  if (body.content.length > 10000) {
    throw new Error('内容不能超过 10000 字符');
  }
  const validTypes = ['text', 'voice', 'link', 'image'];
  if (!validTypes.includes(body.inputType)) {
    throw new Error('无效的输入类型');
  }
}
```

---

### 3. 错误日志泄露敏感信息

**问题**: 前端错误日志打印 stack trace

```typescript
// pwa/src/api/index.ts
console.error('API 请求失败:', {
  endpoint,
  error: error.message,
  stack: error.stack  // ❌ 泄露堆栈
});
```

**建议**:
```typescript
// 生产环境不打印 stack
if (import.meta.env.DEV) {
  console.error('API 请求失败:', { endpoint, error: error.message });
}
```

---

## 🟡 中优先级（性能/体验）

### 4. AI 催化超时未处理

**问题**: AI 调用无超时，可能长时间等待

```typescript
// src/brain/ai.ts
const response = await fetch(this.apiUrl, { ... });
// 无 timeout
```

**建议**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 秒超时

const response = await fetch(this.apiUrl, {
  ...options,
  signal: controller.signal
});
clearTimeout(timeoutId);
```

---

### 5. 市场信号扫描失败无重试

**问题**: Product Hunt/GitHub 扫描失败直接返回空

```typescript
// src/brain/scanner.ts
if (!response.ok) {
  console.warn('Product Hunt RSS 获取失败:', response.status);
  return this.fallbackProductHunt();
}
```

**建议**:
- 添加重试机制（最多 3 次）
- 添加缓存过期时间配置
- 失败时返回上次成功结果

---

### 6. 前端无 Loading 状态

**问题**: 催化请求时间长，用户不知道进度

```typescript
// pwa/src/components/pages/IdeaDetail.tsx
<button
  onClick={() => catalyzeMutation.mutate()}
  disabled={catalyzeMutation.isPending}
>
  {catalyzeMutation.isPending ? '催化中...' : '⚡ 催化'}
</button>
```

**建议**:
- 添加进度条/动画
- 显示预计剩余时间
- 支持后台催化 + 推送通知

---

## 🟢 低优先级（代码质量）

### 7. 全局状态污染

**问题**: API 服务器使用全局 `let env`

```typescript
// src/api/server.ts
let env: Env;  // ❌ 全局变量
```

**建议**:
```typescript
// 使用类封装
export class ApiServer {
  private db: Storage;
  private tokens: Map<string, TokenInfo>;
  
  constructor(db: Storage) {
    this.db = db;
    this.tokens = new Map();
  }
  
  async start(port: number) {
    // ...
  }
}
```

---

### 8. 数据库字段映射混乱

**问题**: 驼峰/下划线转换分散在多处

```typescript
// src/storage/db.ts
const fieldMap: Record<string, string> = {
  'catalysisReport': 'catalysis_report',
  'inputType': 'input_type',
  // ...
};
```

**建议**:
- 统一使用下划线（数据库规范）
- 或在应用层统一使用驼峰，ORM 自动转换

---

### 9. 缺少健康检查端点

**问题**: 无法监控服务状态

**建议**:
```typescript
// 新增 /api/health
GET /api/health
{
  "status": "ok",
  "uptime": 123456,
  "database": "connected",
  "ai_api": "connected",
  "timestamp": 1234567890
}
```

---

### 10. 配置分散

**问题**: 配置散落在代码中

```typescript
// 多处硬编码
const intervalHours = 24;
const maxTokens = 2000;
const timeout = 30000;
```

**建议**:
```typescript
// config.ts
export const config = {
  catalyst: {
    intervalHours: parseInt(process.env.CATALYST_INTERVAL_HOURS) || 24
  },
  ai: {
    maxTokens: 2000,
    timeout: 30000
  }
};
```

---

## 📊 代码统计

| 指标 | 后端 | 前端 | 总计 |
|------|------|------|------|
| 代码行数 | ~2500 | ~2000 | ~4500 |
| 测试文件 | 3 | 0 | 3 |
| 测试用例 | 28 | 0 | 28 |
| 测试覆盖率 | ~60% | 0% | ~30% |

---

## 🎯 优化路线图

### Phase 1 - 安全加固（1 周）
- [ ] Token 持久化 + JWT
- [ ] 输入验证中间件
- [ ] 敏感信息脱敏

### Phase 2 - 稳定性（1 周）
- [ ] AI 调用超时 + 重试
- [ ] 市场信号扫描重试
- [ ] 健康检查端点

### Phase 3 - 体验优化（1 周）
- [ ] 催化进度显示
- [ ] 后台催化 + 推送
- [ ] 错误提示优化

### Phase 4 - 代码质量（持续）
- [ ] 前端单元测试
- [ ] E2E 测试
- [ ] ESLint + Prettier
- [ ] CI/CD 流水线

---

*最后更新：2026-03-09*
