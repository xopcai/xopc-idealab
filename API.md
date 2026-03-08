# xopc-idealab API 文档

**Base URL**: `https://idea.xopc.ai/api`

---

## 认证

使用 Bearer Token 认证：

```http
Authorization: Bearer xopc_xxxxxxxxxxxxxxxx
```

### 获取 Token

```bash
curl -X POST https://idea.xopc.ai/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"telegramUserId": 916534770}'
```

**响应**:
```json
{
  "token": "xopc_673ce52003eb443c",
  "telegramUserId": 916534770,
  "expiresAt": null
}
```

**说明**:
- Token 永不过期
- 一个用户可以有多个 Token
- Token 与 Telegram User ID 绑定

---

## 端点

### 1. 获取灵感列表

```http
GET /api/ideas
```

**请求**:
```http
Authorization: Bearer <token>
```

**响应**:
```json
{
  "ideas": [
    {
      "id": "xxx",
      "content": "想法内容",
      "inputType": "text",
      "createdAt": 1234567890,
      "tags": ["测试"],
      "passionScore": 8,
      "status": "captured",
      "catalysisReport": null,
      "valueFeedback": null,
      "updatedAt": 1234567890
    }
  ],
  "count": 3
}
```

---

### 2. 创建灵感

```http
POST /api/ideas
```

**请求**:
```json
{
  "content": "我的新想法",
  "inputType": "text",
  "tags": ["重要", "产品"]
}
```

**字段**:
- `content` (必填): 想法内容
- `inputType` (可选): `text` | `voice` | `link` | `image`，默认 `text`
- `tags` (可选): 标签数组

**响应**:
```json
{
  "idea": {
    "id": "xxx",
    "content": "我的新想法",
    ...
  }
}
```

---

### 3. 获取单个灵感

```http
GET /api/ideas/:id
```

**响应**:
```json
{
  "idea": {
    "id": "xxx",
    "content": "...",
    ...
  }
}
```

---

### 4. 更新灵感

```http
PUT /api/ideas/:id
```

**请求**:
```json
{
  "content": "更新后的内容",
  "tags": ["新标签"],
  "passionScore": 9,
  "status": "catalyzed"
}
```

**可选字段**: `content`, `tags`, `passionScore`, `status`

---

### 5. 删除灵感

```http
DELETE /api/ideas/:id
```

**说明**: 软删除，将状态设置为 `shelved`

**响应**:
```json
{
  "success": true
}
```

---

### 6. 手动触发催化

```http
POST /api/catalyst/:id
```

**说明**: 立即触发 AI 催化，无需等待心跳

**响应**:
```json
{
  "report": {
    "ideaId": "xxx",
    "originalIdea": "...",
    "generatedAt": 1234567890,
    "userStory": { ... },
    "mvpFeatures": { ... },
    "techStack": { ... },
    "keyQuestions": [...],
    "marketSignals": [...],
    "risks": [...],
    "confidence": 0.75,
    "nextSteps": [...]
  }
}
```

---

### 7. 提交反馈

```http
POST /api/feedback
```

**请求**:
```json
{
  "ideaId": "xxx",
  "type": "positive"
}
```

**字段**:
- `ideaId` (必填): 灵感 ID
- `type` (必填): `positive` | `negative`

**响应**:
```json
{
  "success": true
}
```

---

## 错误响应

### 400 Bad Request
```json
{
  "error": "content 必填"
}
```

### 401 Unauthorized
```json
{
  "error": "未授权"
}
```

### 404 Not Found
```json
{
  "error": "灵感不存在"
}
```

### 500 Internal Server Error
```json
{
  "error": "催化失败"
}
```

---

## CORS

所有端点支持 CORS，允许跨域请求：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 使用示例

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://idea.xopc.ai/api';
const TOKEN = 'xopc_xxxxxxxxxxxxxxxx';

// 获取灵感列表
async function getIdeas() {
  const res = await fetch(`${API_BASE}/ideas`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  const data = await res.json();
  return data.ideas;
}

// 创建灵感
async function createIdea(content: string) {
  const res = await fetch(`${API_BASE}/ideas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({ content })
  });
  const data = await res.json();
  return data.idea;
}

// 触发催化
async function catalyzeIdea(ideaId: string) {
  const res = await fetch(`${API_BASE}/catalyst/${ideaId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  const data = await res.json();
  return data.report;
}
```

---

*最后更新：2026-03-09*
