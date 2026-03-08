/**
 * 语音识别 - OpenAI Whisper API
 */

export class SpeechRecognizer {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/audio/transcriptions';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * 识别语音消息
   * @param fileId - Telegram voice/file ID
   * @param bot - Telegram Bot 实例
   */
  async transcribe(fileId: string, bot: any): Promise<string> {
    try {
      // 1. 从 Telegram 下载语音文件
      const file = await bot.getFile(fileId);
      const filePath = file.file_path;
      
      if (!filePath) {
        throw new Error('无法获取文件路径');
      }

      // 2. 下载文件到临时目录
      const tempPath = `/tmp/voice_${Date.now()}.ogg`;
      await this.downloadFile(filePath, tempPath);

      // 3. 调用 Whisper API 转文字
      const text = await this.callWhisper(tempPath);

      // 4. 清理临时文件
      await Bun.write(tempPath, '');

      return text;
    } catch (error) {
      console.error('语音识别失败:', error);
      throw error;
    }
  }

  /**
   * 从 Telegram 下载文件
   */
  private async downloadFile(filePath: string, destPath: string) {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/file/bot${telegramToken}/${filePath}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败：${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await Bun.write(destPath, Buffer.from(arrayBuffer));
  }

  /**
   * 调用 Whisper API
   */
  private async callWhisper(filePath: string): Promise<string> {
    if (!this.apiKey) {
      // 降级：返回占位文本
      console.warn('未配置 OPENAI_API_KEY，返回占位文本');
      return '[语音内容 - 需配置 OpenAI API key]';
    }

    const formData = new FormData();
    const file = Bun.file(filePath);
    formData.append('file', file, file.name);
    formData.append('model', 'whisper-1');
    formData.append('language', 'zh'); // 中文
    formData.append('response_format', 'text');

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API 错误：${response.status} - ${error}`);
    }

    return await response.text();
  }

  /**
   * 快速识别（用于测试）
   */
  async quickTranscribe(audioBuffer: ArrayBuffer): Promise<string> {
    if (!this.apiKey) {
      return '[语音内容 - 需配置 OpenAI API key]';
    }

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    formData.append('file', blob, 'voice.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'zh');
    formData.append('response_format', 'text');

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Whisper API 错误：${response.status}`);
    }

    return await response.text();
  }
}
