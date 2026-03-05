import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Actress from './pages/Actress';
import AdminLogin from './pages/AdminLogin';
import AdminLinks from './pages/AdminLinks';
import AdminPortfolio from './pages/AdminPortfolio';
import ProtectedRoute from './components/shared/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/actress" element={<Actress />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/links"
        element={
          <ProtectedRoute>
            <AdminLinks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/portfolio"
        element={
          <ProtectedRoute>
            <AdminPortfolio />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
