/**
 * 外部数据扫描器 - 超级大脑
 * 收集市场信号，为 AI 催化提供上下文
 */

export interface MarketSignal {
  source: 'producthunt' | 'github' | 'hackernews';
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  upvotes?: number;
  comments?: number;
  collectedAt: number;
}

export class MarketScanner {
  private cache: Map<string, { data: MarketSignal[]; timestamp: number }> = new Map();
  private cacheTtlMs: number = 6 * 60 * 60 * 1000; // 6 小时缓存

  /**
   * 扫描所有数据源
   */
  async scanAll(): Promise<MarketSignal[]> {
    const [productHunt, github] = await Promise.all([
      this.scanProductHunt(),
      this.scanGitHub()
      // this.scanHackerNews()
    ]);

    const all = [...productHunt, ...github];
    
    // 缓存结果
    this.cache.set('all', {
      data: all,
      timestamp: Date.now()
    });

    return all;
  }

  /**
   * 扫描 Product Hunt - 每日热门产品
   */
  async scanProductHunt(): Promise<MarketSignal[]> {
    try {
      // 检查缓存
      const cached = this.getCached('producthunt');
      if (cached) return cached;

      // Product Hunt 没有公开 API，用 RSS 或简单爬虫
      // 这里用 RSS 方式（更稳定）
      const rssUrl = 'https://www.producthunt.com/rss';
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'xopc-idealab/1.0'
        }
      });

      if (!response.ok) {
        console.warn('Product Hunt RSS 获取失败:', response.status);
        return this.fallbackProductHunt();
      }

      const xml = await response.text();
      const items = this.parseRSS(xml);

      console.log(`📦 Product Hunt 扫描完成：${items.length} 个产品`);
      return items;
    } catch (error) {
      console.error('Product Hunt 扫描失败:', error);
      return this.fallbackProductHunt();
    }
  }

  /**
   * 解析 RSS XML
   */
  private parseRSS(xml: string): MarketSignal[] {
    const items: MarketSignal[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      
      const title = this.extractTag(itemXml, 'title');
      const link = this.extractTag(itemXml, 'link');
      const description = this.extractTag(itemXml, 'description');
      const pubDate = this.extractTag(itemXml, 'pubDate');

      if (title && link) {
        // 从 description 中提取 upvotes
        const upvotesMatch = description?.match(/(\d+)\s*upvotes?/i);
        const upvotes = upvotesMatch ? parseInt(upvotesMatch[1]) : undefined;

        items.push({
          source: 'producthunt',
          title: this.cleanText(title),
          url: this.cleanText(link),
          description: this.cleanText(description?.split('...')[0] || ''),
          upvotes,
          collectedAt: Date.now()
        });
      }
    }

    return items.slice(0, 10); // 只取前 10 个
  }

  /**
   * 从 XML 中提取标签内容
   */
  private extractTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  /**
   * 清理文本（去除 HTML 和多余空白）
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 扫描 GitHub Trending - 每日热门项目
   */
  async scanGitHub(): Promise<MarketSignal[]> {
    try {
      // 检查缓存
      const cached = this.getCached('github');
      if (cached) return cached;

      // GitHub Trending 没有官方 API，用 HTML 解析
      const url = 'https://github.com/trending?spoken_language_code=';
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'xopc-idealab/1.0',
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        console.warn('GitHub Trending 获取失败:', response.status);
        return this.fallbackGitHub();
      }

      const html = await response.text();
      const items = this.parseGitHubTrending(html);

      console.log(`📦 GitHub Trending 扫描完成：${items.length} 个项目`);
      return items;
    } catch (error) {
      console.error('GitHub Trending 扫描失败:', error);
      return this.fallbackGitHub();
    }
  }

  /**
   * 解析 GitHub Trending HTML
   */
  private parseGitHubTrending(html: string): MarketSignal[] {
    const items: MarketSignal[] = [];
    
    // 提取 trending 项目（简化解析，实际可以用 cheerio）
    const articleRegex = /<article[^>]*>[\s\S]*?<\/article>/g;
    let match;
    
    while ((match = articleRegex.exec(html)) !== null) {
      const article = match[0];
      
      // 提取项目名
      const nameMatch = article.match(/<span[^>]*class="[^"]*text-normal[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      const name = nameMatch ? this.cleanText(nameMatch[1]) : null;
      
      // 提取描述
      const descMatch = article.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      const description = descMatch ? this.cleanText(descMatch[1]) : null;
      
      // 提取 stars
      const starMatch = article.match(/svg[^>]*star[^>]*<\/svg>[\s\S]*?(\d+[,.\d]*)/);
      const stars = starMatch ? parseInt(starMatch[1].replace(/[,\.]/g, '')) : undefined;
      
      // 提取链接
      const linkMatch = article.match(/href="([^"]+)"[^>]*class="[^"]*text-indigo-dark/);
      const link = linkMatch ? `https://github.com${linkMatch[1]}` : null;

      if (name && link) {
        items.push({
          source: 'github',
          title: name,
          url: link,
          description: description || undefined,
          upvotes: stars,
          collectedAt: Date.now()
        });
      }
    }

    return items.slice(0, 10); // 只取前 10 个
  }

  /**
   * 降级数据（API 失败时用）- Product Hunt
   */
  private fallbackProductHunt(): MarketSignal[] {
    return [
      {
        source: 'producthunt',
        title: 'AI 灵感催化器 - 从想法到 MVP',
        url: 'https://www.producthunt.com/',
        description: '帮助超级个体快速落地想法',
        collectedAt: Date.now()
      }
    ];
  }

  /**
   * 降级数据（API 失败时用）- GitHub
   */
  private fallbackGitHub(): MarketSignal[] {
    return [
      {
        source: 'github',
        title: 'trending/awesome-project',
        url: 'https://github.com/trending',
        description: 'GitHub Trending 热门项目',
        upvotes: 1000,
        collectedAt: Date.now()
      }
    ];
  }

  /**
   * 获取缓存
   */
  private getCached(source: string): MarketSignal[] | null {
    const cached = this.cache.get(source);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTtlMs) {
      this.cache.delete(source);
      return null;
    }

    return cached.data;
  }

  /**
   * 获取相关市场信号（用于 AI 催化上下文）
   */
  getRelatedSignals(idea: string): MarketSignal[] {
    const cached = this.cache.get('all');
    if (!cached) return [];

    // 简单关键词匹配（未来可以用向量相似度）
    const ideaKeywords = idea.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    return cached.data.filter(signal => {
      const text = `${signal.title} ${signal.description}`.toLowerCase();
      return ideaKeywords.some(keyword => text.includes(keyword));
    }).slice(0, 5);
  }

  /**
   * 格式化市场信号为文本（用于 AI 提示词）
   */
  static formatSignals(signals: MarketSignal[]): string {
    if (signals.length === 0) return '暂无市场信号';

    return signals.map(s => {
      const upvotes = s.upvotes ? `(${s.upvotes} upvotes)` : '';
      return `• ${s.title} ${upvotes} - ${s.url}`;
    }).join('\n');
  }
}
