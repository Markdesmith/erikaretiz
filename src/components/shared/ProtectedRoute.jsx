import { Navigate } from 'react-router-dom';
import { useAuth } from '../../firebase/hooks';
import { isAdmin } from '../../firebase/admins';
import Loading from './Loading';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!isAdmin(user)) return <Navigate to="/admin" replace />;
  return children;
}
