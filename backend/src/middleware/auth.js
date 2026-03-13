import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Company from '../models/Company.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const now = Date.now();
    const shouldTouch = (lastSeenAt) => !lastSeenAt || now - new Date(lastSeenAt).getTime() > 60_000;

    // Check if it's an admin token
    if (payload.userType === 'admin') {
      const admin = await Admin.findById(payload.id).populate('company');
      if (!admin) return res.status(401).json({ error: 'Invalid token' });
      if (admin.isActive === false) return res.status(403).json({ error: 'Account suspended' });
      if (shouldTouch(admin.lastSeenAt)) {
        admin.updateOne({ $set: { lastSeenAt: new Date(now) } }).catch(() => {});
      }

      req.user = {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        companyId: admin.company?._id || null,
        companyName: admin.company?.name || null,
        roles: ['admin'],
        userType: 'admin'
      };
    } else if (payload.userType === 'company') {
      const company = await Company.findById(payload.id);
      if (!company) return res.status(401).json({ error: 'Invalid token' });
      if (company.isActive === false) return res.status(403).json({ error: 'Account suspended' });
      if (shouldTouch(company.lastSeenAt)) {
        company.updateOne({ $set: { lastSeenAt: new Date(now) } }).catch(() => {});
      }
      req.user = {
        id: company._id,
        name: company.name,
        email: company.email,
        companyId: company._id,
        companyName: company.name,
        roles: company.roles || ['company'],
        userType: 'company'
      };
    } else {
      // Regular user
      const user = await User.findById(payload.id).populate('company');
      if (!user) return res.status(401).json({ error: 'Invalid token' });
      if (user.status === 'inactive') return res.status(403).json({ error: 'Account suspended' });
      if (shouldTouch(user.lastSeenAt)) {
        user.updateOne({ $set: { lastSeenAt: new Date(now) } }).catch(() => {});
      }
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        companyId: user.company?._id || null,
        companyName: user.company?.name || null,
        roles: user.roles,
        userType: 'user'
      };
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const isAdmin = roles.includes('admin');
  const isCompany = roles.includes('company');

  if (!isAdmin || isCompany) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  next();
};

// Some admin endpoints should be accessible only to platform admins (not company accounts).
export const requireAdminOnly = (req, res, next) => {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const isAdmin = roles.includes('admin');
  const isCompany = roles.includes('company');

  if (!isAdmin || isCompany) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  next();
};

export const requireCompany = (req, res, next) => {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const isCompany = roles.includes('company') || req.user?.userType === 'company';
  const isAdmin = roles.includes('admin') && req.user?.userType === 'admin';

  if (!isCompany || isAdmin) {
    return res.status(403).json({ error: 'Access denied. Company role required.' });
  }

  next();
};
