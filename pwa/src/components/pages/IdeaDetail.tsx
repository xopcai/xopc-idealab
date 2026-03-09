import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getIdea, deleteIdea, catalyzeIdea, startExperiment } from '../../api';

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id!)
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteIdea(id!),
    onSuccess: () => {
      navigate('/pwa');
    }
  });

  const catalyzeMutation = useMutation({
    mutationFn: () => catalyzeIdea(id!),
    onSuccess: () => {
      navigate(`/pwa/report/${id}`);
    }
  });

  const experimentMutation = useMutation({
    mutationFn: () => startExperiment(id!),
    onSuccess: () => {
      navigate(`/pwa/experiment/${id}`);
    }
  });

  const idea = data?.idea;

  if (isLoading) {
    return (
      <div className="text-center py-12 text-white/30">加载中...</div>
    );
  }

  if (!idea) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50">灵感不存在</p>
        <Link to="/pwa" className="btn btn-primary mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <Link to="/pwa" className="text-white/50 hover:text-white">
          ← 返回
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => experimentMutation.mutate()}
            disabled={experimentMutation.isPending}
            className="btn btn-primary text-sm"
          >
            {experimentMutation.isPending ? '启动中...' : '🧪 实验'}
          </button>
          {idea.status !== 'catalyzed' && (
            <button
              onClick={() => catalyzeMutation.mutate()}
              disabled={catalyzeMutation.isPending}
              className="btn btn-secondary text-sm"
            >
              {catalyzeMutation.isPending ? '催化中...' : '⚡ 催化'}
            </button>
          )}
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="btn btn-secondary text-sm"
          >
            删除
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="card">
        <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap">
          {idea.content}
        </p>
      </div>

      {/* 元信息 */}
      <div className="card space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-white/50">状态</span>
          <span className={idea.status === 'catalyzed' ? 'text-primary' : 'text-white/50'}>
            {idea.status === 'catalyzed' ? '✅ 已催化' : '⏳ 待催化'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/50">创建时间</span>
          <span className="text-white/70">{formatDate(idea.createdAt)}</span>
        </div>
        {idea.inputType !== 'text' && (
          <div className="flex justify-between text-sm">
            <span className="text-white/50">类型</span>
            <span className="text-white/70">{idea.inputType}</span>
          </div>
        )}
        {idea.passionScore && (
          <div className="flex justify-between text-sm">
            <span className="text-white/50">热情度</span>
            <span className="text-white/70">{idea.passionScore}/10</span>
          </div>
        )}
      </div>

      {/* 实验日志入口 */}
      {(idea.status === 'experimenting' || idea.status === 'validated') && (
        <Link
          to={`/pwa/experiment/${id}`}
          className="block card border-green-500/20 bg-green-500/5 hover:border-green-500/40"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧪</span>
            <div>
              <p className="font-semibold text-green-400">查看实验日志</p>
              <p className="text-xs text-white/40">AI 自主探索过程</p>
            </div>
          </div>
        </Link>
      )}

      {/* 催化报告入口 */}
      {idea.status === 'catalyzed' && (
        <Link
          to={`/pwa/report/${id}`}
          className="block card border-primary/20 bg-primary/5 hover:border-primary/40"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-semibold text-primary">查看催化报告</p>
              <p className="text-xs text-white/40">AI 生成的产品深化方案</p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
