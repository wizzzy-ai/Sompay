import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCw, Search, Send, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../AuthContext';
import './SelectCompany.css';

const SelectCompany = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [query, setQuery] = useState('');

  const [request, setRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await api.get('/users/companies', { params: { q: query || undefined } });
      setCompanies(Array.isArray(res.data?.companies) ? res.data.companies : []);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadRequest = async () => {
    try {
      setLoadingRequest(true);
      const res = await api.get('/users/company-join-request');
      setRequest(res.data?.request ?? null);
    } finally {
      setLoadingRequest(false);
    }
  };

  useEffect(() => {
    if (user?.companyId) {
      navigate('/app/dashboard', { replace: true });
      return;
    }
    loadCompanies();
    loadRequest();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => loadCompanies(), 250);
    return () => clearTimeout(id);
  }, [query]);

  const filtered = useMemo(() => {
    if (!query.trim()) return companies;
    const q = query.trim().toLowerCase();
    return companies.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [companies, query]);

  const hasPendingRequest = request?.status === 'pending';
  const canReapply = !!request && !hasPendingRequest;

  const submitRequest = async (companyId) => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/users/company-join-requests', { companyId });
      setSuccess('Request sent. Please wait for the company to accept you.');
      await loadRequest();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const refreshStatus = async () => {
    setError('');
    setSuccess('');
    try {
      await refreshUser();
      await loadRequest();
      if (user?.companyId) {
        navigate('/app/dashboard', { replace: true });
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to refresh status');
    }
  };

  return (
    <div className="sc-page">
      <div className="sc-shell">
        <header className="sc-header">
          <div className="sc-kicker">
            <ShieldCheck size={14} />
            <span>Company selection</span>
          </div>
          <h1>Select a company to pay</h1>
          <p>Send a join request to the company you want to pay. You can’t make payments until they accept you.</p>
        </header>

        {(error || success) && (
          <div className={`sc-alert ${error ? 'sc-alert-error' : 'sc-alert-success'}`}>
            {error || success}
          </div>
        )}

        <section className="sc-card">
          <div className="sc-card-head">
            <h2>Request status</h2>
            <button className="sc-btn sc-btn-soft" type="button" onClick={refreshStatus} disabled={loadingRequest}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loadingRequest ? (
            <div className="sc-muted">Loading request...</div>
          ) : request ? (
            <div className="sc-request">
              <div>
                <div className="sc-request-title">{request.company?.name || 'Company'}</div>
                {canReapply ? <div className="sc-muted">You can request again below.</div> : null}
                <div className="sc-muted">
                  Status: <strong className={`sc-status sc-status-${request.status}`}>{request.status}</strong>
                </div>
              </div>
              <div className="sc-muted">
                Sent: {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}
              </div>
            </div>
          ) : (
            <div className="sc-muted">No pending request. Choose a company below.</div>
          )}
        </section>

        <section className="sc-card">
          <div className="sc-directory-head">
            <h2>Companies</h2>
            <div className="sc-search">
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search companies..." />
            </div>
          </div>

          {loadingCompanies ? (
            <div className="sc-muted">Loading companies...</div>
          ) : filtered.length === 0 ? (
            <div className="sc-muted">No companies found.</div>
          ) : (
            <div className="sc-grid">
              {filtered.map((company) => (
                <article key={company.id} className="sc-company">
                  <div className="sc-company-top">
                    <div className="sc-company-icon">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="sc-company-name">{company.name}</div>
                      {company.address ? <div className="sc-muted">{company.address}</div> : null}
                    </div>
                  </div>
                  {company.description ? <p className="sc-company-desc">{company.description}</p> : null}
                  <button
                    type="button"
                    className="sc-btn sc-btn-primary"
                    disabled={submitting || hasPendingRequest}
                    onClick={() => submitRequest(company.id)}
                  >
                    <Send size={16} />
                    {hasPendingRequest ? 'Request pending' : 'Request to join'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SelectCompany;
