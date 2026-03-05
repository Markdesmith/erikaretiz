import { Navigate } from 'react-router-dom';
import { useAuth } from '../../firebase/hooks';
import Loading from './Loading';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin" replace />;
  return children;
}
