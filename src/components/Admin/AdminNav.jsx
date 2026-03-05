import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/hooks';
import './Admin.css';

export default function AdminNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <nav className="admin-nav">
      <span className="admin-nav__brand">Erika Admin</span>
      <div className="admin-nav__links">
        <NavLink to="/admin/links" className={({ isActive }) => isActive ? 'active' : ''}>Links</NavLink>
        <NavLink to="/admin/portfolio" className={({ isActive }) => isActive ? 'active' : ''}>Portfolio</NavLink>
        <a href="/" target="_blank" rel="noopener">View Site</a>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
