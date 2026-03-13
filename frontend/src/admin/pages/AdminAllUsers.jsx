import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Shield, Trash2, UserCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './AdminAllUsers.css';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const AdminAllUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (e) {
      console.error('Admin users fetch error:', e);
      if (e?.response?.status === 401) {
        navigate('/admin-login');
        return;
      }
      setError(e?.response?.data?.error || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchUsers();
  }, [fetchUsers, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = String(u?.name || '').toLowerCase();
      const email = String(u?.email || '').toLowerCase();
      const company = String(u?.company?.name || '').toLowerCase();
      return name.includes(q) || email.includes(q) || company.includes(q);
    });
  }, [users, query]);

  const setUserStatus = async (userId, status) => {
    const normalized = String(status || '').toLowerCase();
    if (!confirm(`Set this user to "${normalized}"?`)) return;
    setActingId(userId);
    setError('');
    try {
      await api.put(`/admin/users/${userId}/status`, { status: normalized });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, status: normalized } : u)));
    } catch (e) {
      console.error('Status update error:', e);
      setError(e?.response?.data?.error || 'Failed to update user status');
    } finally {
      setActingId(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    setActingId(userId);
    setError('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (e) {
      console.error('Delete user error:', e);
      setError(e?.response?.data?.error || 'Failed to delete user');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="aau-page">
      <div className="container">
        <section className="aau-hero">
          <div>
            <p className="aau-kicker">Sompay PSP</p>
            <h1>
              <Users size={28} />
              Admin Users
            </h1>
            <p>View all users and suspend or delete accounts.</p>
          </div>
          <button type="button" className="aau-btn aau-btn-soft" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </section>

        {error ? (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        ) : null}

        <section className="aau-card">
          <div className="aau-filter">
            <Search size={16} />
            <input
              type="text"
              value={query}
              placeholder="Search by name, email, or company..."
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="aau-card">
          <div className="aau-card-head">
            <h3>Users ({filtered.length})</h3>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table aau-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => {
                      const id = u._id;
                      const status = String(u.status || 'active').toLowerCase();
                      const busy = actingId === id;
                      return (
                        <tr key={id}>
                          <td>{u.name || 'Unknown'}</td>
                          <td>{u.email || '—'}</td>
                          <td>{u.company?.name || '—'}</td>
                          <td>
                            <span className={`aau-pill aau-pill-${status}`}>{status.toUpperCase()}</span>
                          </td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td>
                            <div className="aau-actions">
                              {status !== 'inactive' ? (
                                <button
                                  type="button"
                                  className="aau-btn aau-btn-warning"
                                  onClick={() => setUserStatus(id, 'inactive')}
                                  disabled={busy}
                                >
                                  <Shield size={16} />
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="aau-btn aau-btn-primary"
                                  onClick={() => setUserStatus(id, 'active')}
                                  disabled={busy}
                                >
                                  <UserCheck size={16} />
                                  Activate
                                </button>
                              )}
                              <button
                                type="button"
                                className="aau-btn aau-btn-danger"
                                onClick={() => deleteUser(id)}
                                disabled={busy}
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminAllUsers;

