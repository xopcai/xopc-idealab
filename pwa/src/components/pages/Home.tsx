import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIdeas, createIdea, type Idea } from '../../api';

export default function Home() {
  const [input, setInput] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ideas'],
    queryFn: getIdeas
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => createIdea(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setInput('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    createMutation.mutate(input);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 快速输入 */}
      <form onSubmit={handleSubmit} className="card">
        <textarea
          id="quick-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="💡 有什么灵感？(Enter 发送，Shift+Enter 换行)"
          className="input min-h-[100px] resize-none"
          disabled={createMutation.isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-white/30">
            {input.length} 字符
          </span>
          <button
            type="submit"
            disabled={!input.trim() || createMutation.isPending}
            className="btn btn-primary"
          >
            {createMutation.isPending ? '保存中...' : '保存灵感'}
          </button>
        </div>
      </form>

      {/* 灵感列表 */}
      <div>
        <h2 className="text-lg font-semibold text-white/70 mb-4">
          灵感列表 ({data?.count || 0})
        </h2>

        {isLoading ? (
          <div className="text-center py-12 text-white/30">加载中...</div>
        ) : data?.ideas.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <p className="text-4xl mb-4">🌱</p>
            <p>还没有灵感，开始记录第一个想法吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.ideas.map((idea: Idea) => (
              <Link
                key={idea.id}
                to={`/pwa/idea/${idea.id}`}
                className="block card animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 text-white/90 line-clamp-2">
                    {idea.content}
                  </p>
                  {idea.status === 'catalyzed' && (
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      已催化
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
                  <span>{formatDate(idea.createdAt)}</span>
                  {idea.tags?.length > 0 && (
                    <div className="flex gap-2">
                      {idea.tags.map((tag: string) => (
                        <span key={tag} className="text-white/30">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
