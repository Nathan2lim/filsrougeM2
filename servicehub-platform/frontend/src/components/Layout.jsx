import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="navbar">
        <h1>ServiceHub</h1>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/tickets">Tickets</Link>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <>
              <Link to="/users">Utilisateurs</Link>
              <Link to="/invoices">Factures</Link>
            </>
          )}
          <span className="user-info">
            {user?.firstName} {user?.lastName} ({user?.role})
          </span>
          <button onClick={handleLogout}>Déconnexion</button>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
