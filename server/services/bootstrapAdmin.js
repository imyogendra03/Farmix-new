const User = require('../models/User');

const isStrongPassword = (value = '') => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

const ensureDefaultAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminName = (process.env.ADMIN_NAME || 'Farmix Admin').trim();

  if (!adminEmail || !adminPassword) {
    return;
  }

  if (!isStrongPassword(adminPassword)) {
    console.warn('[ADMIN BOOTSTRAP] Skipped: ADMIN_PASSWORD does not meet password policy');
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      emailVerified: true
    });
    console.log(`[ADMIN BOOTSTRAP] Default admin created: ${adminEmail}`);
    return;
  }

  if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    existingAdmin.isVerified = true;
    existingAdmin.emailVerified = true;
    await existingAdmin.save({ validateBeforeSave: false });
    console.log(`[ADMIN BOOTSTRAP] Existing user upgraded to admin: ${adminEmail}`);
  }
};

module.exports = { ensureDefaultAdmin };
