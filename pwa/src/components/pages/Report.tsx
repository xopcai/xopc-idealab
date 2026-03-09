import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { catalyzeIdea, submitFeedback, getIdea } from '../../api';

export default function Report() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id!)
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ type }: { type: 'positive' | 'negative' }) =>
      submitFeedback(id!, type),
    onSuccess: () => {
      alert('感谢反馈！');
    }
  });

  const idea = data?.idea;
  const report = idea?.catalysisReport ? JSON.parse(idea.catalysisReport) : null;

  if (isLoading) {
    return (
      <div className="text-center py-12 text-white/30">加载中...</div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 mb-4">暂无催化报告</p>
        <button
          onClick={() => catalyzeIdea(id!).then(() => window.location.reload())}
          className="btn btn-primary"
        >
          ⚡ 立即催化
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <Link to={`/pwa/idea/${id}`} className="text-white/50 hover:text-white">
          ← 返回
        </Link>
        <span className="text-sm text-primary">催化报告</span>
      </div>

      {/* 原始想法 */}
      <div className="card border-white/20">
        <p className="text-xs text-white/40 mb-2">原始想法</p>
        <p className="text-white/90">{report.originalIdea}</p>
      </div>

      {/* 置信度 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/50">AI 置信度</span>
          <span className="text-2xl font-bold text-primary">
            {Math.round(report.confidence * 100)}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${report.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* 用户故事 */}
      {report.userStory && (
        <div className="card">
          <h3 className="font-semibold text-white/70 mb-3">👤 用户故事</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-white/40">目标用户:</span> <span className="text-white/80">{report.userStory.targetUser}</span></p>
            <p><span className="text-white/40">痛点:</span> <span className="text-white/80">{report.userStory.painPoint}</span></p>
            <p><span className="text-white/40">场景:</span> <span className="text-white/80">{report.userStory.scenario}</span></p>
            <p><span className="text-white/40">价值:</span> <span className="text-white/80">{report.userStory.value}</span></p>
          </div>
        </div>
      )}

      {/* MVP 功能 */}
      {report.mvpFeatures?.mustHave && (
        <div className="card">
          <h3 className="font-semibold text-white/70 mb-3">🔴 必须有</h3>
          <ul className="space-y-2">
            {report.mvpFeatures.mustHave.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span className="text-white/80">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 技术栈 */}
      {report.techStack && (
        <div className="card">
          <h3 className="font-semibold text-white/70 mb-3">💻 技术建议</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(report.techStack).map(([key, value]: [string, any]) => (
              <p key={key}>
                <span className="text-white/40">{key}:</span>{' '}
                <span className="text-white/80">{value}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 关键问题 */}
      {report.keyQuestions?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white/70 mb-3">❓ 关键问题</h3>
          <ul className="space-y-3">
            {report.keyQuestions.map((q: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-white/30 mt-0.5">{i + 1}.</span>
                <span className="text-white/80">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 下一步 */}
      {report.nextSteps?.length > 0 && (
        <div className="card border-primary/20 bg-primary/5">
          <h3 className="font-semibold text-primary mb-3">→ 下一步行动</h3>
          <ul className="space-y-2">
            {report.nextSteps.map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">→</span>
                <span className="text-white/80">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 反馈 */}
      <div className="card">
        <p className="text-sm text-white/50 text-center mb-3">
          这个催化对你有帮助吗？
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => feedbackMutation.mutate({ type: 'positive' })}
            disabled={feedbackMutation.isPending}
            className="flex-1 btn btn-primary"
          >
            👍 有用
          </button>
          <button
            onClick={() => feedbackMutation.mutate({ type: 'negative' })}
            disabled={feedbackMutation.isPending}
            className="flex-1 btn btn-secondary"
          >
            👎 没用
          </button>
        </div>
      </div>
    </div>
  );
}
