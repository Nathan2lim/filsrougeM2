import { useState, useEffect } from 'react';
import { ticketsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const { hasRole } = useAuth();

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    loadTickets();
  }, [filters, meta.page]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: meta.page,
        limit: 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
      };
      const response = await ticketsService.getAll(params);
      setTickets(response.data.data.data);
      setMeta(response.data.data.meta);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ticketsService.create(form);
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'MEDIUM' });
      loadTickets();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await ticketsService.changeStatus(ticketId, newStatus);
      loadTickets();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (ticketId) => {
    if (!confirm('Supprimer ce ticket ?')) return;
    try {
      await ticketsService.delete(ticketId);
      loadTickets();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const viewTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  return (
    <div>
      <div className="section-header">
        <h2>Gestion des Tickets</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nouveau Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Tous les statuts</option>
          <option value="OPEN">Ouvert</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="WAITING_CLIENT">Attente client</option>
          <option value="WAITING_INTERNAL">Attente interne</option>
          <option value="RESOLVED">Résolu</option>
          <option value="CLOSED">Fermé</option>
          <option value="CANCELLED">Annulé</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">Toutes les priorités</option>
          <option value="CRITICAL">Critique</option>
          <option value="HIGH">Haute</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="LOW">Basse</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="card">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">Aucun ticket trouvé</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Titre</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th>Assigné à</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><strong>{ticket.reference}</strong></td>
                      <td>
                        <span
                          style={{ cursor: 'pointer', color: '#667eea' }}
                          onClick={() => viewTicket(ticket)}
                        >
                          {ticket.title}
                        </span>
                      </td>
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
                      <td>
                        {ticket.assignedTo
                          ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                          : '-'}
                      </td>
                      <td>{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => viewTicket(ticket)}
                          >
                            Voir
                          </button>
                          {hasRole('ADMIN') && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(ticket.id)}
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={meta.page <= 1}
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
              >
                Précédent
              </button>
              <span style={{ alignSelf: 'center' }}>
                Page {meta.page} / {meta.totalPages}
              </span>
              <button
                className="btn btn-sm btn-secondary"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
              >
                Suivant
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau Ticket</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={5}
                  maxLength={5000}
                />
              </div>
              <div className="form-group">
                <label>Priorité</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="CRITICAL">Critique</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedTicket.reference}</h2>
            <div className="ticket-detail">
              <h3 style={{ marginBottom: '1rem' }}>{selectedTicket.title}</h3>
              <div className="info-row">
                <div className="info-item">
                  <label>Statut</label>
                  <span className={`badge badge-${selectedTicket.status.toLowerCase()}`}>
                    {formatStatus(selectedTicket.status)}
                  </span>
                </div>
                <div className="info-item">
                  <label>Priorité</label>
                  <span className={`badge badge-${selectedTicket.priority.toLowerCase()}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <label>Créé par</label>
                  <span>
                    {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}
                  </span>
                </div>
                <div className="info-item">
                  <label>Assigné à</label>
                  <span>
                    {selectedTicket.assignedTo
                      ? `${selectedTicket.assignedTo.firstName} ${selectedTicket.assignedTo.lastName}`
                      : 'Non assigné'}
                  </span>
                </div>
              </div>
              <div className="description">
                <label>Description</label>
                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Status Change */}
              {hasRole('ADMIN', 'MANAGER', 'AGENT') &&
                !['CLOSED', 'CANCELLED'].includes(selectedTicket.status) && (
                  <div style={{ marginTop: '1rem' }}>
                    <label>Changer le statut :</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {getNextStatuses(selectedTicket.status).map((status) => (
                        <button
                          key={status}
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            handleStatusChange(selectedTicket.id, status);
                            setSelectedTicket(null);
                          }}
                        >
                          {formatStatus(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
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

function getNextStatuses(currentStatus) {
  const transitions = {
    OPEN: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['WAITING_CLIENT', 'WAITING_INTERNAL', 'RESOLVED', 'CANCELLED'],
    WAITING_CLIENT: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    WAITING_INTERNAL: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  };
  return transitions[currentStatus] || [];
}

export default Tickets;
