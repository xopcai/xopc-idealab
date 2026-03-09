import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { login } from '../../api';

export default function Login() {
  const [telegramUserId, setTelegramUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userId = parseInt(telegramUserId);
      if (isNaN(userId)) {
        throw new Error('请输入有效的 Telegram User ID');
      }

      const data = await login(userId);
      authLogin(data.token, data.telegramUserId);
      navigate('/pwa');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darker flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">⚡ idealab</h1>
          <p className="text-white/50">超级个体灵感催化实验室</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="mb-6">
            <label className="block text-sm text-white/70 mb-2">
              Telegram User ID
            </label>
            <input
              type="text"
              value={telegramUserId}
              onChange={(e) => setTelegramUserId(e.target.value)}
              placeholder="从 @userinfobot 获取"
              className="input"
              disabled={loading}
            />
            <p className="text-xs text-white/30 mt-2">
              在 Telegram 搜索 @userinfobot 获取你的 User ID
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !telegramUserId}
            className="btn btn-primary w-full py-3"
          >
            {loading ? '登录中...' : '开始使用'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/30">
          <p>首次使用会自动创建账户</p>
        </div>
      </div>
    </div>
  );
}
