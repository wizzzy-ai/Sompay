import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCw, Search, ShieldAlert, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import './AdminCompanies.css';

const AdminCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/companies');
      setCompanies(Array.isArray(res.data?.companies) ? res.data.companies : []);
    } catch (e) {
      console.error('Companies fetch error:', e);
      if (e?.response?.status === 401) {
        navigate('/admin-login');
        return;
      }
      setError(e?.response?.data?.error || 'Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      const name = String(c?.name || '').toLowerCase();
      const email = String(c?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [companies, query]);

  const summary = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c?.isActive !== false).length;
    const suspended = total - active;
    return { total, active, suspended };
  }, [companies]);

  const setCompanyActive = async (companyId, isActive) => {
    setActingId(companyId);
    setError('');
    try {
      await api.put(`/admin/companies/${companyId}/status`, { isActive: !!isActive });
      setCompanies((prev) =>
        prev.map((c) => (c._id === companyId ? { ...c, isActive: !!isActive } : c))
      );
    } catch (e) {
      console.error('Company status update error:', e);
      setError(e?.response?.data?.error || 'Failed to update company status');
    } finally {
      setActingId(null);
    }
  };

  const deleteCompany = async (companyId) => {
    if (!confirm('Delete this company permanently? This will remove related admins, transactions, dues, and join requests.')) {
      return;
    }
    setActingId(companyId);
    setError('');
    try {
      await api.delete(`/admin/companies/${companyId}`);
      setCompanies((prev) => prev.filter((c) => c._id !== companyId));
    } catch (e) {
      console.error('Company delete error:', e);
      setError(e?.response?.data?.error || 'Failed to delete company');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="adco-page">
        <div className="container py-5 text-center">
          <div className="spinner-border adco-spinner" role="status">
            <span className="visually-hidden">Loading companies...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adco-page">
      <div className="container">
        <section className="adco-hero">
          <div>
            <p className="adco-kicker">Sompay PSP</p>
            <h1>
              <Building2 size={28} />
              Admin Company Management
            </h1>
            <p>Suspend, activate, or delete companies from one console.</p>
          </div>
          <div className="adco-actions">
            <button type="button" className="adco-btn adco-btn-soft" onClick={fetchCompanies}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </section>

        {error ? (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        ) : null}

        <section className="adco-stats">
          <article className="adco-stat-card">
            <span>Total Companies</span>
            <strong>{summary.total.toLocaleString()}</strong>
          </article>
          <article className="adco-stat-card">
            <span>Active</span>
            <strong>{summary.active.toLocaleString()}</strong>
          </article>
          <article className="adco-stat-card">
            <span>Suspended</span>
            <strong>{summary.suspended.toLocaleString()}</strong>
          </article>
        </section>

        <section className="adco-card">
          <div className="adco-filter-row">
            <div className="adco-search">
              <Search size={16} />
              <input
                type="text"
                value={query}
                placeholder="Search companies by name or email..."
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="adco-card">
          <div className="adco-card-head">
            <h3>Companies ({filtered.length})</h3>
          </div>

          <div className="table-responsive adco-table-wrap">
            <table className="table adco-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const suspended = c?.isActive === false;
                    const busy = actingId === c._id;
                    return (
                      <tr key={c._id}>
                        <td>{c?.name || 'Unknown'}</td>
                        <td>{c?.email || '—'}</td>
                        <td>
                          <span className={`adco-pill ${suspended ? 'is-suspended' : 'is-active'}`}>
                            {suspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td>{c?.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <div className="adco-row-actions">
                            {suspended ? (
                              <button
                                type="button"
                                className="adco-btn adco-btn-primary"
                                onClick={() => setCompanyActive(c._id, true)}
                                disabled={busy}
                              >
                                <RefreshCw size={16} />
                                Activate
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="adco-btn adco-btn-warning"
                                onClick={() => setCompanyActive(c._id, false)}
                                disabled={busy}
                              >
                                <ShieldAlert size={16} />
                                Suspend
                              </button>
                            )}
                            <button
                              type="button"
                              className="adco-btn adco-btn-danger"
                              onClick={() => deleteCompany(c._id)}
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
        </section>
      </div>
    </div>
  );
};

export default AdminCompanies;

