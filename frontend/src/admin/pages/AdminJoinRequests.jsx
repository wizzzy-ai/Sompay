import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RefreshCw, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../AuthContext';
import './AdminJoinRequests.css';

const AdminJoinRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCompany = !!user?.roles?.includes('company');
  const apiBase = isCompany ? '/company' : '/admin';

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`${apiBase}/join-requests`, { params: { status: 'pending' } });
      setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load join requests');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user, fetchRequests]);

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);

  const approve = async (request) => {
    const requestId = request?.id || request?._id;
    if (!requestId) return;
    setActingId(requestId);
    setError('');
    try {
      await api.post(`${apiBase}/join-requests/${requestId}/approve`);
      if (isCompany) {
        const preset = request?.user?.email || request?.user?.name || '';
        navigate(`/company/users${preset ? `?search=${encodeURIComponent(preset)}` : ''}`);
        return;
      }
      await fetchRequests();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to approve request');
    } finally {
      setActingId(null);
    }
  };

  const reject = async (request) => {
    const requestId = request?.id || request?._id;
    if (!requestId) return;
    setActingId(requestId);
    setError('');
    try {
      await api.post(`${apiBase}/join-requests/${requestId}/reject`);
      await fetchRequests();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to reject request');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className={`ajr-page${isCompany ? ' ajr-page-light' : ''}`}>
      <div className="container">
        <div className="ajr-head">
          <div>
            <h1>Join Requests</h1>
            <p>{isCompany ? 'Approve users who want to pay your company.' : 'Approve users who want to join a company.'}</p>
          </div>
          <button type="button" className="ajr-btn ajr-btn-soft" onClick={fetchRequests} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error ? <div className="ajr-alert">{error}</div> : null}

        <div className="ajr-card">
          <div className="ajr-card-head">
            <strong>{pending.length}</strong>
            <span>pending request(s)</span>
          </div>

          {loading ? (
            <div className="ajr-muted">Loading...</div>
          ) : pending.length === 0 ? (
            <div className="ajr-muted">No pending requests.</div>
          ) : (
            <div className="ajr-list">
              {pending.map((r) => (
                <div key={r.id} className="ajr-item">
                  <div>
                    <div className="ajr-name">{r.user?.name || 'Unknown user'}</div>
                    <div className="ajr-meta">{r.user?.email || ''}</div>
                    {r.message ? <div className="ajr-msg">{r.message}</div> : null}
                  </div>
                  <div className="ajr-actions">
                    <button
                      type="button"
                      className="ajr-btn ajr-btn-primary"
                      onClick={() => approve(r)}
                      disabled={actingId === r.id}
                    >
                      <Check size={16} />
                      Accept
                    </button>
                    <button
                      type="button"
                      className="ajr-btn ajr-btn-danger"
                      onClick={() => reject(r)}
                      disabled={actingId === r.id}
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminJoinRequests;
