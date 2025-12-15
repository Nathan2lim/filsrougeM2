import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, ticketsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [ticketStats, setTicketStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, ticketStatsRes, ticketsRes] = await Promise.all([
        dashboardService.getOverview().catch(() => ({ data: { data: null } })),
        ticketsService.getStats().catch(() => ({ data: { data: null } })),
        ticketsService.getAll({ page: 1, limit: 5 }).catch(() => ({ data: { data: { data: [] } } })),
      ]);

      setStats(overviewRes.data?.data);
      setTicketStats(ticketStatsRes.data?.data);
      setRecentTickets(ticketsRes.data?.data?.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>
        Bienvenue, {user?.firstName} !
      </h2>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="number">{ticketStats?.total || 0}</div>
          <div className="label">Total Tickets</div>
        </div>
        <div className="stat-card warning">
          <div className="number">{ticketStats?.byStatus?.open || 0}</div>
          <div className="label">Tickets Ouverts</div>
        </div>
        <div className="stat-card info">
          <div className="number">{ticketStats?.byStatus?.inProgress || 0}</div>
          <div className="label">En Cours</div>
        </div>
        <div className="stat-card success">
          <div className="number">{ticketStats?.byStatus?.resolved || 0}</div>
          <div className="label">Résolus</div>
        </div>
        {ticketStats?.critical > 0 && (
          <div className="stat-card critical">
            <div className="number">{ticketStats?.critical}</div>
            <div className="label">Critiques</div>
          </div>
        )}
      </div>

      {/* Recent Tickets */}
      <div className="card">
        <div className="section-header">
          <h2>Tickets Récents</h2>
          <Link to="/tickets" className="btn btn-primary btn-sm">
            Voir tous
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="empty-state">Aucun ticket</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th>Priorité</th>
                  <th>Créé par</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><strong>{ticket.reference}</strong></td>
                    <td>{ticket.title}</td>
                    <td>
                      <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                        {formatStatus(ticket.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>{ticket.createdBy?.firstName} {ticket.createdBy?.lastName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2>Actions Rapides</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link to="/tickets" className="btn btn-primary">
            Nouveau Ticket
          </Link>
          {hasRole('ADMIN', 'MANAGER') && (
            <>
              <Link to="/users" className="btn btn-secondary">
                Gérer Utilisateurs
              </Link>
              <Link to="/invoices" className="btn btn-secondary">
                Voir Factures
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatStatus(status) {
  const labels = {
    OPEN: 'Ouvert',
    IN_PROGRESS: 'En cours',
    WAITING_CLIENT: 'Attente client',
    WAITING_INTERNAL: 'Attente interne',
    RESOLVED: 'Résolu',
    CLOSED: 'Fermé',
    CANCELLED: 'Annulé',
  };
  return labels[status] || status;
}

export default Dashboard;
