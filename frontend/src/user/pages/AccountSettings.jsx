import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Check, Eye, EyeOff, Lock, MapPin, Save, User } from 'lucide-react';
import api from '../../api/axios';
import './AccountSettings.css';

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
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

    return 'Unable to reach the backend server at http://localhost:5000. Make sure the API is running, then try again.';
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackText;
};

const AccountSettings = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [flash, setFlash] = useState({ type: '', text: '' });

  const [user, setUser] = useState(null);
  const [address, setAddress] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [addressForm, setAddressForm] = useState({
    houseAddress: '',
    street: '',
    state: '',
    country: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false
  });

  const normalizeAddress = (payload) => {
    if (!payload) return null;
    if (Object.prototype.hasOwnProperty.call(payload, 'address')) {
      return payload.address || null;
    }
    return payload;
  };

  const setMessage = (type, text) => setFlash({ type, text });

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage('', '');

      const meRes = await api.get('/auth/me');
      const me = meRes.data?.user || null;
      setUser(me);
      setProfileForm({
        name: me?.name || '',
        email: me?.email || '',
        phone: me?.phone || ''
      });

      try {
        const addressRes = await api.get('/api/address');
        const nextAddress = normalizeAddress(addressRes.data);
        setAddress(nextAddress);
        setAddressForm({
          houseAddress: nextAddress?.houseAddress || '',
          street: nextAddress?.street || '',
          state: nextAddress?.state || '',
          country: nextAddress?.country || ''
        });
      } catch {
        setAddress(null);
        setAddressForm({
          houseAddress: '',
          street: '',
          state: '',
          country: ''
        });
      }

      try {
        const notifRes = await api.get('/api/user/notification-settings');
        setNotificationSettings(notifRes.data || null);
      } catch {
        setNotificationSettings(null);
      }
    } catch (error) {
      setMessage('error', getRequestErrorMessage(error, 'Failed to load account settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const onSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      setMessage('error', 'Full name is required.');
      return;
    }

    try {
      setSavingProfile(true);
      setMessage('', '');
      await api.put('/auth/update-profile', {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim()
      });
      setEditMode(false);
      setMessage('success', 'Profile updated successfully.');
      await fetchData();
    } catch (error) {
      setMessage('error', getRequestErrorMessage(error, 'Failed to update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.houseAddress.trim() || !addressForm.street.trim() || !addressForm.state.trim() || !addressForm.country.trim()) {
      setMessage('error', 'All address fields are required.');
      return;
    }

    try {
      setSavingAddress(true);
      setMessage('', '');
      const payload = {
        houseAddress: addressForm.houseAddress.trim(),
        street: addressForm.street.trim(),
        state: addressForm.state.trim(),
        country: addressForm.country.trim()
      };

      if (address) {
        await api.put('/api/address', payload);
        setMessage('success', 'Address updated successfully.');
      } else {
        await api.post('/api/address', payload);
        setMessage('success', 'Address added successfully.');
      }

      await fetchData();
    } catch (error) {
      setMessage('error', getRequestErrorMessage(error, 'Failed to save address.'));
    } finally {
      setSavingAddress(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage('error', 'All password fields are required.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('error', 'New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      setMessage('', '');
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setMessage('success', 'Password changed successfully.');
    } catch (error) {
      setMessage('error', getRequestErrorMessage(error, 'Failed to change password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleNotification = async (group, key) => {
    if (!notificationSettings?.settings?.[group]) return;

    const next = {
      ...notificationSettings,
      settings: {
        ...notificationSettings.settings,
        [group]: {
          ...notificationSettings.settings[group],
          [key]: !notificationSettings.settings[group][key]
        }
      }
      };

      try {
      await api.put('/api/user/notification-settings', { settings: next.settings });
      setNotificationSettings(next);
      setMessage('success', 'Notification settings updated.');
    } catch (error) {
      setMessage('error', getRequestErrorMessage(error, 'Failed to update notification settings.'));
    }
  };

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'N/A';
    return new Date(user.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }, [user]);

  if (loading) {
    return (
      <div className="acs-page">
        <div className="acs-loader">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="acs-page">
      <div className="acs-shell">
        <header className="acs-header">
          <button className="acs-back" onClick={() => navigate('/app/profile')} type="button">
            <ArrowLeft size={16} />
            Profile
          </button>
          <div>
            <h1>Account Settings</h1>
            <p>Manage your profile, security, address, and notifications.</p>
          </div>
        </header>

        {flash.text ? (
          <div className={`acs-alert ${flash.type === 'error' ? 'acs-alert-error' : 'acs-alert-success'}`}>{flash.text}</div>
        ) : null}

        <div className="acs-grid">
          <main className="acs-main">
            <motion.section className="acs-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="acs-card-head">
                <h2>
                  <User size={17} />
                  Profile Information
                </h2>
                {!editMode ? (
                  <button className="acs-btn acs-btn-soft" onClick={() => setEditMode(true)} type="button">
                    Edit
                  </button>
                ) : (
                  <div className="acs-inline-actions">
                    <button
                      className="acs-btn acs-btn-primary"
                      onClick={onSaveProfile}
                      disabled={savingProfile}
                      type="button"
                    >
                      <Save size={14} />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="acs-btn acs-btn-soft"
                      onClick={() => {
                        setEditMode(false);
                        setProfileForm({
                          name: user?.name || '',
                          email: user?.email || '',
                          phone: user?.phone || ''
                        });
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="acs-form-grid">
                <label>
                  Full Name
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))}
                    disabled={!editMode}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    readOnly
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((s) => ({ ...s, phone: e.target.value }))}
                    disabled={!editMode}
                  />
                </label>
                <label>
                  Status
                  <div className="acs-status">
                    <Check size={13} />
                    Active
                  </div>
                </label>
              </div>
            </motion.section>

            <motion.section className="acs-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="acs-card-head">
                <h2>
                  <MapPin size={17} />
                  Service Address
                </h2>
              </div>
              <form className="acs-form-grid" onSubmit={onSaveAddress}>
                <label>
                  House Address
                  <input
                    value={addressForm.houseAddress}
                    onChange={(e) => setAddressForm((s) => ({ ...s, houseAddress: e.target.value }))}
                    placeholder="House number / building"
                  />
                </label>
                <label>
                  Street
                  <input
                    value={addressForm.street}
                    onChange={(e) => setAddressForm((s) => ({ ...s, street: e.target.value }))}
                    placeholder="Street name"
                  />
                </label>
                <label>
                  State
                  <input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((s) => ({ ...s, state: e.target.value }))}
                    placeholder="State"
                  />
                </label>
                <label>
                  Country
                  <input
                    value={addressForm.country}
                    onChange={(e) => setAddressForm((s) => ({ ...s, country: e.target.value }))}
                    placeholder="Country"
                  />
                </label>
                <div className="acs-full-row">
                  <button className="acs-btn acs-btn-primary" type="submit" disabled={savingAddress}>
                    <Save size={14} />
                    {savingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.section>

            <motion.section className="acs-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="acs-card-head">
                <h2>
                  <Lock size={17} />
                  Security
                </h2>
              </div>
              <form className="acs-form-grid" onSubmit={onChangePassword}>
                <label>
                  Current Password
                  <div className="acs-pass-wrap">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: e.target.value }))}
                      placeholder="Current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => ({ ...s, current: !s.current }))}
                      className="acs-eye"
                    >
                      {showPassword.current ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                <label>
                  New Password
                  <div className="acs-pass-wrap">
                    <input
                      type={showPassword.next ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
                      placeholder="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => ({ ...s, next: !s.next }))}
                      className="acs-eye"
                    >
                      {showPassword.next ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                <label>
                  Confirm Password
                  <div className="acs-pass-wrap">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => ({ ...s, confirm: !s.confirm }))}
                      className="acs-eye"
                    >
                      {showPassword.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                <div className="acs-full-row">
                  <button className="acs-btn acs-btn-primary" type="submit" disabled={savingPassword}>
                    <Lock size={14} />
                    {savingPassword ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </motion.section>

            <motion.section className="acs-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="acs-card-head">
                <h2>
                  <Bell size={17} />
                  Notifications
                </h2>
              </div>
              {!notificationSettings?.settings ? (
                <p className="acs-muted">No notification settings found.</p>
              ) : (
                <div className="acs-notif-grid">
                  {Object.entries(notificationSettings.settings).map(([group, values]) => (
                    <div className="acs-notif-group" key={group}>
                      <h3>{group.toUpperCase()}</h3>
                      {Object.entries(values || {}).map(([key, value]) => (
                        <button
                          key={key}
                          type="button"
                          className={`acs-toggle ${value ? 'acs-toggle-on' : ''}`}
                          onClick={() => toggleNotification(group, key)}
                        >
                          <span>{key}</span>
                          <span className="acs-toggle-pill">{value ? 'On' : 'Off'}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          </main>

          <aside className="acs-aside">
            <motion.section className="acs-card acs-summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="acs-avatar">{getInitials(user?.name)}</div>
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.email || 'No email'}</p>
              <div className="acs-meta">
                <div>
                  <span>Member Since</span>
                  <strong>{memberSince}</strong>
                </div>
                <div>
                  <span>Account Type</span>
                  <strong>{Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : 'client'}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{user?.status || 'Active'}</strong>
                </div>
                <div>
                  <span>Address Saved</span>
                  <strong>{address ? 'Yes' : 'No'}</strong>
                </div>
              </div>
            </motion.section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
