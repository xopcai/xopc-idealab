import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExperimentLog, startExperiment, getIdea } from '../../api';

export default function ExperimentLogPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: ideaData } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id!)
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['experiment', id],
    queryFn: () => getExperimentLog(id!),
    refetchInterval: (query) => {
      // 如果实验未完成，每 5 秒刷新一次
      const log = query.state.data?.log;
      if (!log?.completedAt) return 5000;
      return false;
    }
  });

  const startMutation = useMutation({
    mutationFn: () => startExperiment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiment', id] });
      refetch();
    }
  });

  const idea = ideaData?.idea;
  const log = data?.log;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'keep': return '✅';
      case 'discard': return '❌';
      case 'crash': return '⚠️';
      default: return '⏳';
    }
  };

  if (isLoading && !log) {
    return (
      <div className="text-center py-12 text-white/30">加载中...</div>
    );
  }

  if (!log && !idea) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 mb-4">实验不存在</p>
        <Link to="/pwa" className="btn btn-primary">返回首页</Link>
      </div>
    );
  }

  // 没有实验日志，显示启动按钮
  if (!log) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to={`/pwa/idea/${id}`} className="text-white/50 hover:text-white">
            ← 返回
          </Link>
          <span className="text-sm text-primary">实验模式</span>
        </div>

        <div className="card text-center py-12">
          <p className="text-4xl mb-4">🧪</p>
          <h2 className="text-xl font-semibold text-white/90 mb-2">
            AI 自主实验
          </h2>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            AI 将在约束下自主探索，最多运行 10 轮实验，每轮 2 小时预算。
            完成后你会收到实验日志和学习总结。
          </p>

          <div className="bg-white/5 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-white/70 mb-2">实验流程：</h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li>1️⃣ 生成实验框架（Landing Page / 访谈 / 定价）</li>
              <li>2️⃣ 自主迭代最多 10 轮</li>
              <li>3️⃣ 每轮修改一个变量，测试假设</li>
              <li>4️⃣ 评估结果：keep（保留）或 discard（丢弃）</li>
              <li>5️⃣ 完成后推送学习总结</li>
            </ul>
          </div>

          <button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="btn btn-primary"
          >
            {startMutation.isPending ? '启动中...' : '🧪 启动实验'}
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = !!log.completedAt;
  const bestExperiment = log.experiments.find(e => e.id === log.bestVariant);

  return (
    <div className="space-y-6 pb-20">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <Link to={`/pwa/idea/${id}`} className="text-white/50 hover:text-white">
          ← 返回
        </Link>
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded animate-pulse">
              🔄 实验中
            </span>
          )}
          <span className="text-sm text-primary">实验日志</span>
        </div>
      </div>

      {/* 实验框架 */}
      <div className="card border-primary/20 bg-primary/5">
        <h3 className="font-semibold text-primary mb-3">📐 实验框架</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-white/40">类型</span>
            <p className="text-white/80 capitalize">{log.framework.type}</p>
          </div>
          <div>
            <span className="text-white/40">时间预算</span>
            <p className="text-white/80">{formatDuration(log.framework.timeBudgetMs)}</p>
          </div>
          <div>
            <span className="text-white/40">成功标准</span>
            <p className="text-white/80">{Math.round(log.framework.successThreshold * 100)}% {log.framework.successMetric}</p>
          </div>
          <div>
            <span className="text-white/40">状态</span>
            <p className={isCompleted ? 'text-green-400' : 'text-yellow-400'}>
              {isCompleted ? '✅ 已完成' : '🔄 进行中'}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <span className="text-white/40 text-xs">可变因素</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {log.framework.mutableVariables.map((v: string) => (
              <span key={v} className="text-xs px-2 py-1 bg-white/10 rounded text-white/70">
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 实验时间线 */}
      <div className="card">
        <h3 className="font-semibold text-white/70 mb-4">
          ⏱️ 实验时间线 ({log.experiments.length}轮)
        </h3>
        <div className="space-y-4">
          {log.experiments.map((exp) => (
            <div
              key={exp.id}
              className={`border-l-2 pl-4 pb-4 ${
                exp.status === 'keep' ? 'border-green-500' :
                exp.status === 'discard' ? 'border-red-500' : 'border-yellow-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white/70">
                  第 {exp.round} 轮
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  exp.status === 'keep' ? 'bg-green-500/20 text-green-400' :
                  exp.status === 'discard' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {getStatusIcon(exp.status)} {exp.status.toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-white/80 mb-2">
                <span className="text-white/40">假设：</span>
                {exp.hypothesis}
              </p>

              <div className="text-sm text-white/60 mb-2">
                <span className="text-white/40">改动：</span>
                {exp.variant.changes.join(', ')}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-white/40">转化率</span>
                  <p className={`font-semibold ${
                    exp.metrics.conversionRate >= log.framework.successThreshold
                      ? 'text-green-400' : 'text-white/70'
                  }`}>
                    {Math.round(exp.metrics.conversionRate * 100)}%
                  </p>
                </div>
                <div>
                  <span className="text-white/40">反馈</span>
                  <p className="font-semibold text-white/70">
                    {exp.metrics.positiveFeedback}/{exp.metrics.totalContacts}
                  </p>
                </div>
              </div>

              {exp.aiReflection && (
                <p className="mt-2 text-xs text-white/40 italic">
                  💭 {exp.aiReflection}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 最佳方案 */}
      {bestExperiment && (
        <div className="card border-green-500/30 bg-green-500/5">
          <h3 className="font-semibold text-green-400 mb-3">
            🏆 最佳方案（第 {bestExperiment.round} 轮）
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-white/40">假设：</span>
              <span className="text-white/80">{bestExperiment.hypothesis}</span>
            </p>
            <p>
              <span className="text-white/40">改动：</span>
              <span className="text-white/80">{bestExperiment.variant.changes.join(', ')}</span>
            </p>
            <p>
              <span className="text-white/40">转化率：</span>
              <span className="text-green-400 font-semibold">
                {Math.round(bestExperiment.metrics.conversionRate * 100)}%
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 学习总结 */}
      {log.learningSummary && (
        <div className="card border-primary/20 bg-primary/5">
          <h3 className="font-semibold text-primary mb-3">📚 学习总结</h3>
          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {log.learningSummary}
          </p>
        </div>
      )}

      {/* 完成状态 */}
      {isCompleted && (
        <div className="card text-center py-6">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-white/70 mb-4">
            实验于 {formatDate(log.completedAt!)} 完成
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to={`/pwa/idea/${id}`}
              className="btn btn-secondary"
            >
              返回想法
            </Link>
          </div>
        </div>
      )}

      {/* 实验信息 */}
      <div className="text-center text-xs text-white/30">
        开始时间：{formatDate(log.startedAt)}
        {log.completedAt && (
          <span className="ml-2">
            | 耗时：{formatDuration(log.completedAt - log.startedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
