import { useState, useEffect } from 'react';
import { invoicesService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const { hasRole } = useAuth();

  useEffect(() => {
    loadData();
  }, [meta.page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, statsRes] = await Promise.all([
        invoicesService.getAll({ page: meta.page, limit: 10 }),
        invoicesService.getStats().catch(() => ({ data: { data: null } })),
      ]);
      setInvoices(invoicesRes.data.data.data);
      setMeta(invoicesRes.data.data.meta);
      setStats(statsRes.data?.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (invoiceId) => {
    try {
      await invoicesService.send(invoiceId);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const handleCancel = async (invoiceId) => {
    if (!confirm('Annuler cette facture ?')) return;
    try {
      await invoicesService.cancel(invoiceId);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  if (!hasRole('ADMIN', 'MANAGER')) {
    return <div className="card">Accès non autorisé</div>;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div>
      <div className="section-header">
        <h2>Gestion des Factures</h2>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="number">{stats.totalCount || 0}</div>
            <div className="label">Total Factures</div>
          </div>
          <div className="stat-card info">
            <div className="number">{formatCurrency(stats.totals?.total || 0)}</div>
            <div className="label">Montant Total</div>
          </div>
          <div className="stat-card success">
            <div className="number">{formatCurrency(stats.totals?.paid || 0)}</div>
            <div className="label">Montant Payé</div>
          </div>
          <div className="stat-card warning">
            <div className="number">
              {formatCurrency((stats.totals?.total || 0) - (stats.totals?.paid || 0))}
            </div>
            <div className="label">En Attente</div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">Aucune facture trouvée</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Statut</th>
                    <th>Montant HT</th>
                    <th>TVA</th>
                    <th>Total TTC</th>
                    <th>Échéance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><strong>{invoice.reference}</strong></td>
                      <td>
                        <span className={`badge badge-${invoice.status.toLowerCase()}`}
                          style={{
                            background: getStatusColor(invoice.status).bg,
                            color: getStatusColor(invoice.status).text
                          }}>
                          {formatInvoiceStatus(invoice.status)}
                        </span>
                      </td>
                      <td>{formatCurrency(invoice.subtotal)}</td>
                      <td>{formatCurrency(invoice.taxAmount)}</td>
                      <td><strong>{formatCurrency(invoice.total)}</strong></td>
                      <td>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            Voir
                          </button>
                          {invoice.status === 'DRAFT' && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSend(invoice.id)}
                            >
                              Envoyer
                            </button>
                          )}
                          {['DRAFT', 'SENT'].includes(invoice.status) && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleCancel(invoice.id)}
                            >
                              Annuler
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Facture {selectedInvoice.reference}</h2>

            <div style={{ marginBottom: '1rem' }}>
              <span className={`badge`}
                style={{
                  background: getStatusColor(selectedInvoice.status).bg,
                  color: getStatusColor(selectedInvoice.status).text
                }}>
                {formatInvoiceStatus(selectedInvoice.status)}
              </span>
            </div>

            {/* Lines */}
            <h3 style={{ marginBottom: '0.5rem' }}>Lignes de facturation</h3>
            <table style={{ marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qté</th>
                  <th>Prix Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.lines?.map((line, idx) => (
                  <tr key={idx}>
                    <td>{line.description}</td>
                    <td>{line.quantity}</td>
                    <td>{formatCurrency(line.unitPrice)}</td>
                    <td>{formatCurrency(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <p>Sous-total HT: <strong>{formatCurrency(selectedInvoice.subtotal)}</strong></p>
              <p>TVA ({selectedInvoice.taxRate}%): <strong>{formatCurrency(selectedInvoice.taxAmount)}</strong></p>
              <p style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>
                Total TTC: <strong>{formatCurrency(selectedInvoice.total)}</strong>
              </p>
            </div>

            {/* Payments */}
            {selectedInvoice.payments?.length > 0 && (
              <>
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Paiements</h3>
                {selectedInvoice.payments.map((payment, idx) => (
                  <div key={idx} style={{ padding: '0.5rem', background: '#e8f5e9', borderRadius: '5px', marginBottom: '0.5rem' }}>
                    <strong>{formatCurrency(payment.amount)}</strong> - {payment.method}
                    {payment.reference && ` (Réf: ${payment.reference})`}
                    <br />
                    <small>{new Date(payment.paidAt).toLocaleDateString('fr-FR')}</small>
                  </div>
                ))}
              </>
            )}

            {selectedInvoice.notes && (
              <>
                <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Notes</h3>
                <p style={{ color: '#666' }}>{selectedInvoice.notes}</p>
              </>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatInvoiceStatus(status) {
  const labels = {
    DRAFT: 'Brouillon',
    SENT: 'Envoyée',
    PAID: 'Payée',
    PARTIALLY_PAID: 'Part. Payée',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulée',
  };
  return labels[status] || status;
}

function getStatusColor(status) {
  const colors = {
    DRAFT: { bg: '#f5f5f5', text: '#616161' },
    SENT: { bg: '#e3f2fd', text: '#1976d2' },
    PAID: { bg: '#e8f5e9', text: '#388e3c' },
    PARTIALLY_PAID: { bg: '#fff3e0', text: '#f57c00' },
    OVERDUE: { bg: '#ffebee', text: '#c62828' },
    CANCELLED: { bg: '#fce4ec', text: '#c2185b' },
  };
  return colors[status] || { bg: '#f5f5f5', text: '#616161' };
}

export default Invoices;
