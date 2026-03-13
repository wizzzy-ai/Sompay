import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Clock,
  Eye,
  Mail,
  Phone,
  Download,
  Plus,
  Save,
  Building,
} from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import { useAuth } from '../../AuthContext';
import './AdminClients.css';

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    verified: 'all',
  });
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPayments, setClientPayments] = useState([]);
  const [clientPaymentsLoading, setClientPaymentsLoading] = useState(false);
  const [clientPaymentsError, setClientPaymentsError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCompany = !!user?.roles?.includes('company');
  const actorLabel = isCompany ? 'Company' : 'Admin';
  const apiBase = isCompany ? '/company' : '/admin';

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiBase}/clients`);
      const normalized = (response.data.clients || []).map((client) => ({
        ...client,
        firstName: client.firstName || client.name?.split(' ')[0] || '',
        lastName: client.lastName || client.name?.split(' ').slice(1).join(' ') || '',
        id: client._id || client.id,
        status: client.status || 'active',
      }));
      setClients(normalized);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const firstName = (client.firstName || '').toLowerCase();
      const lastName = (client.lastName || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = client.phone || '';
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        query === '' ||
        email.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        phone.includes(searchTerm);

      const matchesStatus = filters.status === 'all' || client.status === filters.status;
      const matchesVerified =
        filters.verified === 'all' ||
        (filters.verified === 'verified' && client.isVerified) ||
        (filters.verified === 'unverified' && !client.isVerified);

      return matchesSearch && matchesStatus && matchesVerified;
    });
  }, [clients, searchTerm, filters]);

  const summary = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.status === 'active').length;
    const inactive = clients.filter((c) => c.status === 'inactive').length;
    const verified = clients.filter((c) => c.isVerified).length;
    return { total, active, inactive, verified };
  }, [clients]);

  const updateClientStatus = async (clientId, newStatus) => {
    try {
      await api.put(`${apiBase}/clients/${clientId}/status`, { status: newStatus });
      await fetchClients();
    } catch (err) {
      console.error('Error updating client status:', err);
    }
  };

  const closeClientModal = () => {
    setClientModalOpen(false);
    setSelectedClient(null);
    setClientPayments([]);
    setClientPaymentsError('');
    setClientPaymentsLoading(false);
  };

  const openClientModal = async (client) => {
    if (!client?.email) return;
    setSelectedClient(client);
    setClientModalOpen(true);
    setClientPayments([]);
    setClientPaymentsError('');
    setClientPaymentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('email', client.email);
      const res = await api.get(`/payments/all?${params.toString()}`);
      setClientPayments(res.data?.payments || []);
    } catch (err) {
      console.error('Error fetching client payments:', err);
      setClientPayments([]);
      setClientPaymentsError(err?.response?.data?.error || 'Unable to load payment history for this client.');
    } finally {
      setClientPaymentsLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (isCompany) {
      alert('Company accounts cannot create clients.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/clients', newClient);
      setShowAddModal(false);
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        status: 'active',
      });
      await fetchClients();
    } catch (err) {
      console.error('Error adding client:', err);
    } finally {
      setSaving(false);
    }
  };

  const exportClients = () => {
    const csvContent = [
      ['Client ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Verified', 'Joined'].join(','),
      ...filteredClients.map((c) =>
        [
          c.id || '',
          c.firstName || '',
          c.lastName || '',
          c.email || '',
          c.phone || '',
          c.status || '',
          c.isVerified ? 'Yes' : 'No',
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusPill = (status) => {
    const value = status || 'pending';
    const map = {
      active: { className: 'is-active', icon: <UserCheck size={13} /> },
      inactive: { className: 'is-inactive', icon: <UserX size={13} /> },
      pending: { className: 'is-pending', icon: <Clock size={13} /> },
    };
    const config = map[value] || map.pending;

    return (
      <span className={`admcl-status-pill ${config.className}`}>
        {config.icon}
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    );
  };

  if (loading) {
	    return (
	      <div className={`admcl-page${isCompany ? ' is-company' : ''}`}>
	        <div className="container py-5 text-center">
	          <div className="spinner-border admcl-spinner" role="status">
	            <span className="visually-hidden">Loading clients...</span>
	          </div>
	        </div>
	      </div>
	    );
	  }

	  return (
	    <div className={`admcl-page${isCompany ? ' is-company' : ''}`}>
	      <div className="container">
        <section className="admcl-hero">
          <div>
            <p className="admcl-kicker">Sompay PSP</p>
            <h1>
              <Building size={28} />
              {actorLabel} Client Management
            </h1>
            <p>View and manage client accounts with operational controls.</p>
          </div>
          <div className="admcl-hero-actions">
            <button type="button" className="admcl-btn admcl-btn-soft" onClick={exportClients}>
              <Download size={16} />
              Export
            </button>
            {!isCompany ? (
              <button type="button" className="admcl-btn admcl-btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                Add Client
              </button>
            ) : null}
          </div>
        </section>

        <section className="admcl-stats">
          <article className="admcl-stat-card">
            <span>Total Clients</span>
            <strong>{summary.total.toLocaleString()}</strong>
          </article>
          <article className="admcl-stat-card">
            <span>Active</span>
            <strong>{summary.active.toLocaleString()}</strong>
          </article>
          <article className="admcl-stat-card">
            <span>Inactive</span>
            <strong>{summary.inactive.toLocaleString()}</strong>
          </article>
          <article className="admcl-stat-card">
            <span>Verified</span>
            <strong>{summary.verified.toLocaleString()}</strong>
          </article>
        </section>

        <section className="admcl-card">
          <div className="admcl-filter-row">
            <div className="admcl-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admcl-filter-item">
              <Filter size={15} />
              <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="admcl-filter-item">
              <select value={filters.verified} onChange={(e) => setFilters((p) => ({ ...p, verified: e.target.value }))}>
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </section>

        <section className="admcl-card">
          <div className="admcl-card-head">
            <h3>Client Records ({filteredClients.length})</h3>
          </div>

          {filteredClients.length === 0 ? (
            <div className="admcl-empty">
              <Users size={44} />
              <h5>No clients found</h5>
              <p>Try adjusting your filters or add a new client.</p>
            </div>
          ) : (
            <div className="table-responsive admcl-table-wrap">
              <table className="table admcl-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client, index) => (
                    <tr key={client.id ?? client._id ?? index}>
                      <td>
                        <div className="admcl-client">
                          <span className="admcl-avatar">{((client.firstName || '?')[0] || '?').toUpperCase()}</span>
                          <div>
                            <div className="admcl-client-name">
                              {client.firstName} {client.lastName}
                            </div>
                            <small className="admcl-muted">ID: {client.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admcl-contact-line">
                          <Mail size={14} />
                          <span>{client.email}</span>
                        </div>
                        {client.phone ? (
                          <div className="admcl-contact-line">
                            <Phone size={14} />
                            <span className="admcl-muted">{client.phone}</span>
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {getStatusPill(client.status)}
                        <div className="mt-1">
                          <span className={`admcl-verify-pill ${client.isVerified ? 'is-verified' : 'is-unverified'}`}>
                            {client.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </td>
                      <td className="admcl-muted">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
	                      <td>
	                        <div className="admcl-actions">
	                          <button
	                            type="button"
	                            className="admcl-btn-icon"
	                            onClick={() => openClientModal(client)}
	                            title="View client details"
	                          >
	                            <Eye size={15} />
	                          </button>
	                          <select value={client.status} onChange={(e) => updateClientStatus(client.id, e.target.value)}>
	                            <option value="active">Active</option>
	                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

	      {showAddModal && (
	        <Modal title="Add New Client" subtitle="Create a client profile for onboarding" onClose={() => setShowAddModal(false)} className="admcl-modal">
          <form onSubmit={handleAddClient}>
            <div className="admcl-modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newClient.firstName}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newClient.lastName}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={newClient.email}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={newClient.phone}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={newClient.status}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admcl-modal-footer">
              <button type="button" className="admcl-btn admcl-btn-soft" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button type="submit" className="admcl-btn admcl-btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Add Client
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
	      )}

	      {clientModalOpen && selectedClient ? (
	        <Modal
	          title="Client Details"
	          subtitle={`${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() || selectedClient.email}
	          onClose={closeClientModal}
	          className="admcl-modal admcl-client-modal"
	          wide
	        >
	          <div className="admcl-client-modal-head">
	            <div className="admcl-client-modal-meta">
	              <div className="admcl-client-modal-name">
	                {selectedClient.firstName} {selectedClient.lastName}
	              </div>
	              <div className="admcl-client-modal-sub">
	                <span>
	                  <Mail size={14} /> {selectedClient.email}
	                </span>
	                {selectedClient.phone ? (
	                  <span>
	                    <Phone size={14} /> {selectedClient.phone}
	                  </span>
	                ) : null}
	              </div>
	            </div>
	            <div className="admcl-client-modal-badges">
	              {getStatusPill(selectedClient.status)}
	              <span className={`admcl-verify-pill ${selectedClient.isVerified ? 'is-verified' : 'is-unverified'}`}>
	                {selectedClient.isVerified ? 'Verified' : 'Unverified'}
	              </span>
	            </div>
	          </div>

	          <div className="admcl-client-modal-section">
	            <div className="admcl-client-modal-section-head">
	              <h4>Payment History</h4>
	              <button
	                type="button"
	                className="admcl-btn admcl-btn-soft"
	                onClick={() => navigate(isCompany ? '/company/payments' : '/admin/payments')}
	              >
	                <Building size={16} />
	                Open Payments Center
	              </button>
	            </div>

	            {clientPaymentsLoading ? <div className="admcl-muted">Loading payments…</div> : null}
	            {clientPaymentsError ? <div className="admcl-client-modal-error">{clientPaymentsError}</div> : null}

	            {!clientPaymentsLoading && !clientPaymentsError ? (
	              clientPayments.length === 0 ? (
	                <div className="admcl-muted">No payments found for this client.</div>
	              ) : (
	                <div className="table-responsive admcl-table-wrap">
	                  <table className="table admcl-table">
	                    <thead>
	                      <tr>
	                        <th>UUID</th>
	                        <th>Period</th>
	                        <th>Amount</th>
	                        <th>Status</th>
	                        <th>Date</th>
	                      </tr>
	                    </thead>
	                    <tbody>
	                      {clientPayments.map((p) => (
	                        <tr key={p.uuid}>
	                          <td>
	                            <code className="admcl-uuid" title={p.uuid}>{p.uuid}</code>
	                          </td>
	                          <td>{p.month}/{p.year}</td>
	                          <td><strong>{money.format(Number(p.amount || 0))}</strong></td>
	                          <td>{p.status}</td>
	                          <td className="admcl-muted">{p.date ? new Date(p.date).toLocaleDateString() : 'N/A'}</td>
	                        </tr>
	                      ))}
	                    </tbody>
	                  </table>
	                </div>
	              )
	            ) : null}
	          </div>
	        </Modal>
	      ) : null}
	    </div>
	  );
};

export default AdminClients;
