import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  User,
  Edit,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  Shield,
  Filter,
  Building,
  Mail,
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
} from 'lucide-react';
import Modal from '../../components/Modal';
import RoleBadge from '../../components/RoleBadge';
import api from '../../api/axios';
import { useAuth } from '../../AuthContext';
import './AdminUsers.css';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
};

const getRequestErrorMessage = (error, fallbackText) => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.code === 'ERR_NETWORK') {
    const browserOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (!browserOnline) {
      return 'Your browser is offline. Reconnect to the internet or disable Offline mode in DevTools, then try again.';
    }

    return 'Unable to reach the backend server. Check that the API is running on http://localhost:5000 and refresh the page.';
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackText;
};

const monthOptions = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
	const [selectedUser, setSelectedUser] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [newRole, setNewRole] = useState('');
	const [dueMonth, setDueMonth] = useState(String(new Date().getMonth() + 1));
	const [dueYear, setDueYear] = useState(String(new Date().getFullYear()));
  const [dueAmount, setDueAmount] = useState('');
  const [dueNote, setDueNote] = useState('');
  const [dueSummary, setDueSummary] = useState(null);
  const [dueAdjustments, setDueAdjustments] = useState([]);
	const [extraChargeAmount, setExtraChargeAmount] = useState('');
	const [extraChargeNote, setExtraChargeNote] = useState('');
	const [loadingDue, setLoadingDue] = useState(false);
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const { user } = useAuth();
  const location = useLocation();
	const isCompanyAccount = !!user?.roles?.includes('company');
	const actorLabel = isCompanyAccount ? 'Company' : 'Admin';
	const apiBase = isCompanyAccount ? '/company' : '/admin';
	const canSuspendUsers = !!user?.roles?.includes('admin') && !isCompanyAccount;
  const showRoleColumn = !isCompanyAccount;

  useEffect(() => {
    if (!isCompanyAccount) return;
    const params = new URLSearchParams(location.search);
    const preset = params.get('search');
    if (preset) setSearchTerm(preset);
  }, [isCompanyAccount, location.search]);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const response = await api.get(`${apiBase}/users`);
			setUsers(
				(response.data.users || []).map((item) => ({
					...item,
					id: item._id,
					role: item.roles?.[0] || 'user',
					status: item.status || 'active',
					company: item.company || null,
					lastLogin: item.updatedAt,
				}))
			);
		} catch (error) {
			console.error('Error fetching users:', error);
		} finally {
			setLoading(false);
		}
	};



  const handleCompanyRemoveUser = async (userId) => {
    if (!isCompanyAccount) {
      alert('Only company accounts can remove users from a company.');
      return;
    }
    if (!userId) return;
    if (!confirm('Remove this user from your company? They will no longer be assigned to you.')) return;

    setUpdating(true);
    try {
      await api.delete(`/company/users/${userId}`);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
      if (selectedUser?.id === userId) {
        setShowModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error removing user from company:', error, error.response?.data);
      alert(`Failed to remove user: ${getRequestErrorMessage(error, 'Request failed.')}`);
    } finally {
      setUpdating(false);
    }
  };

	const handleManageUser = (item) => {
		if (!item) return;
		setSelectedUser(item);
		setNewRole(item.role || 'user');
		setDueMonth(String(new Date().getMonth() + 1));
		setDueYear(String(new Date().getFullYear()));
		setDueAmount('');
		setDueNote('');
    setDueSummary(null);
    setDueAdjustments([]);
    setExtraChargeAmount('');
    setExtraChargeNote('');
    setShowModal(true);
  };

	  const fetchUserDue = async (userId, month, year) => {
	    if (!userId || !month || !year) return;
	    setLoadingDue(true);
	    try {
	      const response = await api.get(`${apiBase}/users/${userId}/monthly-due`, {
	        params: { month, year }
	      });
      const due = response.data?.due;
      const adjustments = Array.isArray(response.data?.adjustments) ? response.data.adjustments : [];
      const summary = response.data?.summary || null;
      setDueAmount(due?.amount != null ? String(due.amount) : '');
      setDueNote(due?.notes || '');
      setDueAdjustments(adjustments);
      setDueSummary(summary);
    } catch (error) {
      console.error('Error fetching monthly due:', error, error.response?.data);
      setDueAmount('');
      setDueNote('');
      setDueAdjustments([]);
      setDueSummary(null);
    } finally {
      setLoadingDue(false);
    }
  };

  useEffect(() => {
    if (!showModal || !selectedUser?.id || !dueMonth || !dueYear) return;
    fetchUserDue(selectedUser.id, dueMonth, dueYear);
  }, [showModal, selectedUser?.id, dueMonth, dueYear]);

	  const handleUpdateRole = async () => {
	    if (isCompanyAccount) {
	      alert('Companies are not allowed to update user roles.');
	      return;
	    }
	    if (!selectedUser || newRole === selectedUser.role) return;
	    setUpdating(true);
	    try {
	      await api.put(`/admin/users/${selectedUser.id}/role`, { role: newRole });
      setUsers((prev) => prev.map((item) => (item.id === selectedUser.id ? { ...item, role: newRole } : item)));
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error, error.response?.data);
      alert(`Failed to update user role: ${getRequestErrorMessage(error, 'Request failed.')}`);
    } finally {
      setUpdating(false);
    }
  };

	  const handleDeleteUser = async () => {
	    if (isCompanyAccount) {
	      alert('Companies are not allowed to delete users.');
	      return;
	    }
	    if (!selectedUser || !confirm('Are you sure you want to permanently delete this user? This action cannot be undone!')) {
	      return;
	    }
    setUpdating(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setUsers((prev) => prev.filter((item) => item.id !== selectedUser.id));
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error, error.response?.data);
      alert(`Failed to delete user: ${getRequestErrorMessage(error, 'Request failed.')}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateUserStatus = async (status) => {
    if (!canSuspendUsers) {
      alert('You are not allowed to update user status.');
      return;
    }
    if (!selectedUser) return;

    const normalized = String(status || '').toLowerCase();
    if (normalized === selectedUser.status) return;

    setUpdating(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/status`, { status: normalized });
      setUsers((prev) => prev.map((item) => (item.id === selectedUser.id ? { ...item, status: normalized } : item)));
      setSelectedUser((prev) => (prev ? { ...prev, status: normalized } : prev));
    } catch (error) {
      console.error('Error updating user status:', error, error.response?.data);
      alert(`Failed to update user status: ${getRequestErrorMessage(error, 'Request failed.')}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleSetMonthlyDue = async () => {
    if (!selectedUser) return;
    if (!dueAmount || Number(dueAmount) <= 0) {
      alert('Please enter a valid due amount greater than 0');
      return;
    }

	    setUpdating(true);
	    try {
	      await api.post(`${apiBase}/users/${selectedUser.id}/monthly-due`, {
	        month: parseInt(dueMonth, 10),
	        year: parseInt(dueYear, 10),
	        amount: Number(dueAmount),
	        notes: dueNote || null
	      });
      alert('Monthly due set successfully');
    } catch (error) {
      console.error('Error setting monthly due:', error, error.response?.data);
      alert(`Failed to set monthly due: ${getRequestErrorMessage(error, 'Request failed.')}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddExtraCharge = async () => {
    if (!selectedUser) return;
    if (!extraChargeAmount || Number(extraChargeAmount) <= 0) {
      alert('Please enter a valid extra charge amount greater than 0');
      return;
    }

	    setUpdating(true);
	    try {
	      await api.post(`${apiBase}/users/${selectedUser.id}/monthly-due/adjustments`, {
	        month: parseInt(dueMonth, 10),
	        year: parseInt(dueYear, 10),
	        amount: Number(extraChargeAmount),
	        notes: extraChargeNote || null
	      });
      setExtraChargeAmount('');
      setExtraChargeNote('');
      await fetchUserDue(selectedUser.id, dueMonth, dueYear);
      alert('Extra charge added successfully');
    } catch (error) {
      console.error('Error adding extra charge:', error, error.response?.data);
      alert(`Failed to add extra charge: ${getRequestErrorMessage(error, 'Request failed.')}`);
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return users.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const matchesSearch = name.includes(query) || email.includes(query);
      const matchesRole = filterRole === '' || item.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const summary = useMemo(() => {
    const total = users.length;
    const admins = users.filter((item) => (item.role || '').toLowerCase() === 'admin').length;
    const standardUsers = users.filter((item) => (item.role || '').toLowerCase() === 'user').length;
    const assigned = users.filter((item) => !!item.company?._id).length;
    return { total, admins, standardUsers, assigned };
  }, [users]);

		return (
			<div className={`admu-page${isCompanyAccount ? ' admu-page-light' : ''}`}>
				<div className="container">
        <section className="admu-hero">
          <div>
            <p className="admu-kicker">Sompay PSP</p>
            <h1>
              <Shield size={28} />
              {actorLabel} User Management
            </h1>
            <p>
              {isCompanyAccount
                ? 'Manage customers assigned to your company and keep monthly dues up to date.'
                : 'Manage access, roles, and company assignments from one operational console.'}
            </p>
          </div>
	          <div className="admu-hero-actions">
	            <button type="button" className="admu-btn admu-btn-soft" onClick={fetchUsers}>
	              <RefreshCw size={16} />
	              Refresh
	            </button>
	          </div>
	        </section>

        <section className="admu-stats">
          <article className="admu-stat-card">
            <span>{isCompanyAccount ? 'Total Customers' : 'Total Users'}</span>
            <strong>{summary.total.toLocaleString()}</strong>
          </article>
          {!isCompanyAccount ? (
            <>
              <article className="admu-stat-card">
                <span>Admins</span>
                <strong>{summary.admins.toLocaleString()}</strong>
              </article>
              <article className="admu-stat-card">
                <span>Standard Users</span>
                <strong>{summary.standardUsers.toLocaleString()}</strong>
              </article>
              <article className="admu-stat-card">
                <span>Assigned to Company</span>
                <strong>{summary.assigned.toLocaleString()}</strong>
              </article>
            </>
          ) : null}
        </section>

        <section className="admu-card">
          <div className="admu-filter-row">
	            <div className="admu-search">
	              <Search size={16} />
	              <input
	                type="text"
	                placeholder={isCompanyAccount ? 'Search customers by name or email...' : 'Search users by name or email...'}
	                value={searchTerm}
	                onChange={(e) => setSearchTerm(e.target.value)}
	              />
	            </div>
            {!isCompanyAccount ? (
              <div className="admu-filter">
                <Filter size={15} />
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ) : null}
          </div>
        </section>

	        <section className="admu-card">
	          <div className="admu-card-head">
	            <h3>{isCompanyAccount ? 'Customers' : 'Users'} ({filteredUsers.length})</h3>
	          </div>

          {loading ? (
            <div className="admu-loading">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading users...</p>
            </div>
          ) : (
					<div className="table-responsive admu-table-wrap">
						<table className="table admu-table">
							<thead>
								<tr>
									<th>ID</th>
									<th>User</th>
									<th>Email</th>
									{showRoleColumn ? <th>Role</th> : null}
									<th>Status</th>
									<th>Created</th>
									<th>Last Login</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredUsers.length === 0 ? (
									<tr>
										<td colSpan={showRoleColumn ? 8 : 7} className="text-center py-4 text-muted">
											No users found
										</td>
									</tr>
								) : (
									filteredUsers.map((item) => (
										<tr key={item.id}>
											<td>
												<code className="admu-user-id">#{String(item.id).slice(-6)}</code>
											</td>
											<td>
												<div className="admu-user-cell">
													<span className="admu-user-avatar">{(item.name || '?').charAt(0).toUpperCase()}</span>
													<span>{item.name || 'Unknown user'}</span>
												</div>
											</td>
											<td>{item.email || 'No email'}</td>
											{showRoleColumn ? (
												<td>
													<RoleBadge role={item.role} />
												</td>
											) : null}
											<td>
												<span className={`admu-pill admu-pill-${String(item.status || 'active').toLowerCase()}`}>
													{String(item.status || 'active').toUpperCase()}
												</span>
											</td>
											<td>{formatDate(item.createdAt)}</td>
											<td>{formatDate(item.lastLogin)}</td>
											<td>
													<div className="admu-actions">
														<button type="button" className="admu-btn admu-btn-soft admu-btn-sm" onClick={() => handleManageUser(item)}>
															<Edit size={14} />
															Manage
														</button>
														{isCompanyAccount ? (
															<button
																type="button"
																className="admu-btn admu-btn-danger admu-btn-sm"
																onClick={() => handleCompanyRemoveUser(item.id)}
																disabled={updating}
															>
																Remove
															</button>
														) : null}
													</div>
												</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
			</section>

      </div>

      {showModal && selectedUser && (
        <Modal
          title={`Manage User: ${selectedUser.name || 'User'}`}
          onClose={() => setShowModal(false)}
          className={`admu-modal${isCompanyAccount ? ' admu-modal-light' : ''}`}
        >
	          <div className="admu-modal-body">
	            <div className="admu-modal-grid">
	              <section className="admu-panel">
	                <h5>
	                  <User size={16} />
	                  User Information
	                </h5>
	                <div className="admu-info-line">
	                  <Mail size={14} />
	                  <span>{selectedUser.email || 'No email'}</span>
	                </div>
	                <div className="admu-info-line">
	                  <Users size={14} />
	                  <span>{selectedUser.name || 'Unknown user'}</span>
	                </div>
	                <div className="admu-info-line">
	                  <UserCheck size={14} />
	                  <span>
	                    Status:{' '}
	                    <span className={`admu-pill admu-pill-${String(selectedUser.status || 'active').toLowerCase()}`}>
	                      {String(selectedUser.status || 'active').toUpperCase()}
	                    </span>
	                  </span>
	                </div>
	              </section>

              {!isCompanyAccount ? (
                <>
                  <section className="admu-panel">
                    <h5>
                      <Shield size={16} />
                      Role Management
                    </h5>
                    <div className="admu-row">
                      <label>Current</label>
                      <RoleBadge role={selectedUser.role} />
                    </div>
                    <div className="admu-row">
                      <label>New Role</label>
                      <select className="admu-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </section>

                  <section className="admu-panel">
                    <h5>
                      <Building size={16} />
                      Company Assignment
                    </h5>
                    <div className="admu-row">
                      <label>Current</label>
                      <span>{selectedUser.company?.name || 'No company assigned'}</span>
                    </div>
                  </section>
                </>
              ) : null}

              <section className="admu-panel">
                <h5>
                  <CreditCard size={16} />
                  Monthly Due Assignment
                </h5>
                <div className="admu-due-grid">
                  <div className="admu-row admu-row-col">
                    <label>Month</label>
                    <select className="admu-select" value={dueMonth} onChange={(e) => setDueMonth(e.target.value)}>
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admu-row admu-row-col">
                    <label>Year</label>
                    <input
                      className="admu-input"
                      type="number"
                      value={dueYear}
                      onChange={(e) => setDueYear(e.target.value)}
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div className="admu-row admu-row-col">
                    <label>Due Amount (NGN)</label>
                    <input
                      className="admu-input"
                      type="number"
                      min="1"
                      step="0.01"
                      value={dueAmount}
                      onChange={(e) => setDueAmount(e.target.value)}
                      placeholder={loadingDue ? 'Loading...' : 'Enter amount'}
                    />
                  </div>
                  <div className="admu-row admu-row-col">
                    <label>Note (optional)</label>
                    <input
                      className="admu-input"
                      type="text"
                      value={dueNote}
                      onChange={(e) => setDueNote(e.target.value)}
                      placeholder="e.g. March subscription"
                    />
                  </div>
                </div>

                <div className="admu-row" style={{ marginTop: '0.85rem' }}>
                  <label>Summary</label>
                  <span>
                    Base: {dueSummary?.baseAmount != null ? `₦${Number(dueSummary.baseAmount).toLocaleString()}` : '—'} · Extra:{' '}
                    {dueSummary?.extraTotal != null ? `₦${Number(dueSummary.extraTotal).toLocaleString()}` : '—'} · Total:{' '}
                    {dueSummary?.totalDue != null ? `₦${Number(dueSummary.totalDue).toLocaleString()}` : '—'}
                  </span>
                </div>

                <div className="admu-due-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="admu-row admu-row-col">
                    <label>Extra Charge (NGN)</label>
                    <input
                      className="admu-input"
                      type="number"
                      min="1"
                      step="0.01"
                      value={extraChargeAmount}
                      onChange={(e) => setExtraChargeAmount(e.target.value)}
                      placeholder="Enter extra amount"
                    />
                  </div>
                  <div className="admu-row admu-row-col">
                    <label>Extra Note (optional)</label>
                    <input
                      className="admu-input"
                      type="text"
                      value={extraChargeNote}
                      onChange={(e) => setExtraChargeNote(e.target.value)}
                      placeholder="e.g. Additional service fee"
                    />
                  </div>
                </div>

                <div className="admu-row" style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="admu-btn admu-btn-soft" onClick={handleAddExtraCharge} disabled={updating || loadingDue}>
                    <Plus size={14} />
                    {updating ? 'Saving...' : 'Add Extra Charge'}
                  </button>
                </div>

                {dueAdjustments.length > 0 ? (
                  <div className="admu-row" style={{ marginTop: '0.75rem' }}>
                    <label>Extra Charges</label>
                    <span>
                      {dueAdjustments
                        .slice(0, 6)
                        .map((item) => `₦${Number(item.amount || 0).toLocaleString()}${item.notes ? ` (${item.notes})` : ''}`)
                        .join(' · ')}
                      {dueAdjustments.length > 6 ? ` · +${dueAdjustments.length - 6} more` : ''}
                    </span>
                  </div>
                ) : null}
              </section>
            </div>

                {!isCompanyAccount ? (
                  <section className="admu-danger">
                    <h6>Danger Zone</h6>
                    <p>Suspend to disable access. Delete removes the account permanently.</p>
                    <div className="d-flex gap-2 flex-wrap">
                      {selectedUser.status !== 'inactive' ? (
                        <button
                          type="button"
                          className="admu-btn admu-btn-soft"
                          onClick={() => handleUpdateUserStatus('inactive')}
                          disabled={updating || !canSuspendUsers}
                        >
                          <Shield size={14} />
                          {updating ? 'Updating...' : 'Suspend User'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admu-btn admu-btn-soft"
                          onClick={() => handleUpdateUserStatus('active')}
                          disabled={updating || !canSuspendUsers}
                        >
                          <UserCheck size={14} />
                          {updating ? 'Updating...' : 'Activate User'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="admu-btn admu-btn-danger"
                        onClick={handleDeleteUser}
                        disabled={updating}
                      >
                        <Trash2 size={14} />
                        Delete User
                      </button>
                    </div>
                  </section>
                ) : null}
          </div>

          <div className="admu-modal-footer">
            <button type="button" className="admu-btn admu-btn-soft" onClick={() => setShowModal(false)} disabled={updating}>
              Cancel
	            </button>
	            <div className="d-flex gap-2">
	              {!isCompanyAccount ? (
	                <button
	                  type="button"
	                  className="admu-btn admu-btn-soft"
	                  onClick={handleUpdateRole}
	                  disabled={newRole === selectedUser.role || updating}
	                >
	                  {updating ? 'Updating...' : 'Update Role'}
	                </button>
	              ) : null}
	              <button type="button" className="admu-btn admu-btn-primary" onClick={handleSetMonthlyDue} disabled={updating || loadingDue}>
	                <CalendarDays size={14} />
	                {updating ? 'Saving...' : 'Set Monthly Due'}
	              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default AdminUsers;
