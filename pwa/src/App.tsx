import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import Login from './components/pages/Login';
import Home from './components/pages/Home';
import IdeaDetail from './components/pages/IdeaDetail';
import Report from './components/pages/Report';

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      <Route path="/pwa" element={token ? <Layout /> : <Navigate to="/pwa/login" />}>
        <Route index element={<Home />} />
        <Route path="idea/:id" element={<IdeaDetail />} />
        <Route path="report/:id" element={<Report />} />
      </Route>
      <Route path="/pwa/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/pwa/login" />} />
    </Routes>
  );
}

export default App;
