import { useState, useEffect } from 'react';
import { usersService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
  });

  useEffect(() => {
    loadData();
  }, [meta.page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        usersService.getAll({ page: meta.page, limit: 10 }),
        usersService.getRoles(),
      ]);
      setUsers(usersRes.data.data.data);
      setMeta(usersRes.data.data.meta);
      setRoles(rolesRes.data.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await usersService.create(form);
      setShowModal(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', roleId: '' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await usersService.delete(userId);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (!hasRole('ADMIN', 'MANAGER')) {
    return <div className="card">Accès non autorisé</div>;
  }

  return (
    <div>
      <div className="section-header">
        <h2>Gestion des Utilisateurs</h2>
        {hasRole('ADMIN') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nouvel Utilisateur
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">Aucun utilisateur trouvé</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    {hasRole('ADMIN') && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.firstName} {user.lastName}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role?.name?.toLowerCase() || 'client'}`}>
                          {user.role?.name || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-cancelled'}`}
                          style={{
                            background: user.isActive ? '#e8f5e9' : '#ffebee',
                            color: user.isActive ? '#388e3c' : '#c62828'
                          }}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                      {hasRole('ADMIN') && (
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(user.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      )}
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

      {/* Roles List */}
      <div className="card">
        <h2>Rôles disponibles</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {roles.map((role) => (
            <div
              key={role.id}
              style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                flex: '1',
                minWidth: '200px',
              }}
            >
              <strong>{role.name}</strong>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvel Utilisateur</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mot de passe *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                >
                  <option value="">Client (par défaut)</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
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
    </div>
  );
}

export default Users;
