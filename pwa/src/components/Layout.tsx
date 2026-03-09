import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function Layout() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-darker flex flex-col">
      {/* 顶部导航 */}
      <header className="border-b border-white/10 bg-dark/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/pwa" className="text-xl font-bold text-primary">
            ⚡ idealab
          </Link>
          <button
            onClick={logout}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            退出
          </button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="border-t border-white/10 bg-dark/50 backdrop-blur safe-area-pb">
        <div className="max-w-3xl mx-auto px-4 py-2 flex justify-around">
          <Link
            to="/pwa"
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/pwa') ? 'text-primary' : 'text-white/50'
            }`}
          >
            <span className="text-xl">💡</span>
            <span className="text-xs mt-1">灵感</span>
          </Link>
          <Link
            to="/pwa"
            className="flex flex-col items-center py-2 px-4"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('quick-input')?.focus();
            }}
          >
            <span className="text-2xl text-primary">+</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
