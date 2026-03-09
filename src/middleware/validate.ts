/**
 * 请求验证中间件
 */

const VALID_INPUT_TYPES = ['text', 'voice', 'link', 'image'] as const;
const MAX_CONTENT_LENGTH = 10000;
const MAX_TAGS_COUNT = 10;

export interface IdeaInput {
  content: string;
  inputType?: string;
  tags?: string[];
}

export function validateIdeaInput(body: any): IdeaInput {
  // 验证 content
  if (!body.content) {
    throw new Error('content 必填');
  }
  if (typeof body.content !== 'string') {
    throw new Error('content 必须是字符串');
  }
  if (body.content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`content 不能超过 ${MAX_CONTENT_LENGTH} 字符`);
  }
  if (body.content.trim().length === 0) {
    throw new Error('content 不能为空');
  }

  // 验证 inputType
  const inputType = body.inputType || 'text';
  if (!VALID_INPUT_TYPES.includes(inputType as any)) {
    throw new Error(`无效的输入类型，必须是：${VALID_INPUT_TYPES.join(', ')}`);
  }

  // 验证 tags
  const tags = Array.isArray(body.tags) ? body.tags : [];
  if (tags.length > MAX_TAGS_COUNT) {
    throw new Error(`tags 不能超过 ${MAX_TAGS_COUNT} 个`);
  }
  const validTags = tags.filter((t: any) => typeof t === 'string' && t.trim().length > 0);

  return {
    content: body.content.trim(),
    inputType,
    tags: validTags
  };
}

export function validateTelegramUserId(userId: any): number {
  const parsed = parseInt(userId);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('无效的 Telegram User ID');
  }
  return parsed;
}

export function validateFeedbackInput(body: any): { ideaId: string; type: 'positive' | 'negative' } {
  if (!body.ideaId || typeof body.ideaId !== 'string') {
    throw new Error('ideaId 必填且为字符串');
  }

  const validTypes = ['positive', 'negative'];
  if (!validTypes.includes(body.type)) {
    throw new Error(`type 必须是：${validTypes.join(', ')}`);
  }

  return {
    ideaId: body.ideaId,
    type: body.type
  };
}
