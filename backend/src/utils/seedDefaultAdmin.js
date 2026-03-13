import crypto from 'node:crypto';
import Admin from '../models/Admin.js';
import Company from '../models/Company.js';
import User from '../models/User.js';

const normalizeEmail = (value) => String(value || '').toLowerCase().trim();

const shouldSeed = () => {
  const explicit = String(process.env.SEED_DEFAULT_ADMIN || '').toLowerCase();
  if (explicit === 'true' || explicit === '1' || explicit === 'yes') return true;
  if (explicit === 'false' || explicit === '0' || explicit === 'no') return false;
  return process.env.NODE_ENV !== 'production';
};

export const seedDefaultAdmin = async (logger = console) => {
  if (!shouldSeed()) return;

  const adminEmail = normalizeEmail(process.env.DEFAULT_ADMIN_EMAIL || 'admin@psp.local');
  const adminPassword = String(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345!');

  const companyName = String(process.env.DEFAULT_ADMIN_COMPANY_NAME || 'PSP Platform').trim();
  const companyEmail = normalizeEmail(process.env.DEFAULT_ADMIN_COMPANY_EMAIL || 'platform@psp.local');
  const companyPassword = crypto.randomBytes(24).toString('base64url');

  const existingAdmin = await Admin.findOne({ email: adminEmail }).select('_id email');
  if (existingAdmin) return;

  const [companyEmailTaken, userEmailTaken] = await Promise.all([
    Company.findOne({ email: adminEmail }).select('_id email'),
    User.findOne({ email: adminEmail }).select('_id email'),
  ]);

  if (companyEmailTaken || userEmailTaken) {
    logger.error?.(`[seedDefaultAdmin] Cannot seed admin: ${adminEmail} is already used by a non-admin account.`);
    return;
  }

  let company = await Company.findOne({ email: companyEmail }).select('_id name email');
  if (!company) {
    company = await Company.create({
      name: companyName,
      email: companyEmail,
      password: companyPassword,
      isVerified: true,
      roles: ['company'],
    });
  }

  await Admin.create({
    name: 'Default Admin',
    email: adminEmail,
    password: adminPassword,
    company: company._id,
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
  });

  logger.info?.(`[seedDefaultAdmin] Created default admin: ${adminEmail}`);
  logger.info?.(`[seedDefaultAdmin] Password: ${adminPassword}`);
};

