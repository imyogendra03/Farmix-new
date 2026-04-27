const getYear = () => new Date().getFullYear();
const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const renderBrandWordmark = (width = 168) =>
  `<img src="${getClientUrl()}/FarmixName.png" alt="Farmix" width="${width}" style="display:block;margin:0 auto;height:auto;max-width:100%;" />`;

const createCard = ({
  title,
  subtitle = '',
  gradient = 'linear-gradient(135deg,#2D7C2D,#438663)',
  body,
  footer = `${renderBrandWordmark(112)}<p style="color:#9ca3af;font-size:12px;margin:10px 0 0;">Copyright ${getYear()}</p>`
}) => {
  const subtitleHtml = subtitle
    ? `<p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">${subtitle}</p>`
    : '';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:${gradient};padding:32px;text-align:center;">
        ${renderBrandWordmark()}
        <h1 style="color:#ffffff;margin:18px 0 0;font-size:24px;">${title}</h1>
        ${subtitleHtml}
      </div>
      <div style="padding:32px;">${body}</div>
      <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
        ${footer}
      </div>
    </div>`;
};

const verificationEmailTemplate = ({ user, verifyLink }) => ({
  subject: 'Verify Your Farmix Account',
  html: createCard({
    title: 'Welcome',
    subtitle: 'Smart Agriculture Platform',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;line-height:1.6;">Welcome aboard. Click below to verify your email address and activate your account.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyLink}" style="background:linear-gradient(135deg,#2D7C2D,#438663);color:#fff;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">Verify Email Address</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;">This link expires in 24 hours.</p>
      <ul style="color:#4b5563;line-height:1.8;padding-left:20px;">
        <li>AI advisory and disease support</li>
        <li>Expert consultations</li>
        <li>Market and weather updates</li>
      </ul>`
  })
});

const loginNotificationTemplate = ({ user, loginTime, loginIp, loginDevice, loginRole }) => ({
  subject: 'Farmix Login Confirmation',
  html: createCard({
    title: 'Login Alert',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;">A successful login was detected for your account.</p>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;color:#6b7280;font-size:14px;">Time: ${loginTime}</p>
        <p style="margin:4px 0;color:#6b7280;font-size:14px;">Role: ${loginRole}</p>
        <p style="margin:4px 0;color:#6b7280;font-size:14px;">IP: ${loginIp}</p>
        <p style="margin:4px 0;color:#6b7280;font-size:14px;word-break:break-word;">Device: ${loginDevice}</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;">If this was not you, please change your password immediately.</p>`
  })
});

const passwordResetEmailTemplate = ({ user, resetLink }) => ({
  subject: 'Reset Your Farmix Password',
  html: createCard({
    title: 'Password Reset',
    gradient: 'linear-gradient(135deg,#dc2626,#ef4444)',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;">You requested a password reset. Click below to set a new password.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}" style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">Reset Password</a>
      </div>
      <p style="color:#ef4444;font-size:13px;font-weight:600;">This link expires in 30 minutes.</p>
      <p style="color:#9ca3af;font-size:13px;">If you did not request this, you can safely ignore this email.</p>`
  })
});

const passwordChangedEmailTemplate = ({ user, changedAt }) => ({
  subject: 'Your Farmix Password Was Changed',
  html: createCard({
    title: 'Password Changed',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;">Your password was changed successfully on ${changedAt}.</p>
      <p style="color:#ef4444;font-size:14px;margin-top:20px;">If you did not do this, contact support immediately.</p>`
  })
});

const expertRegistrationPendingTemplate = ({ user }) => ({
  subject: 'Expert Registration Submitted',
  html: createCard({
    title: 'Expert Registration',
    gradient: 'linear-gradient(135deg,#1f4d8f,#3b82f6)',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;">Your expert registration was submitted successfully and is now pending admin review.</p>
      <ul style="color:#4b5563;line-height:1.8;padding-left:20px;">
        <li>Credential verification: in progress</li>
        <li>Expected review time: up to 48 hours</li>
        <li>You will receive an approval email once verified</li>
      </ul>`
  })
});

const expertRegistrationAdminAlertTemplate = ({ expertUser, expertProfile }) => ({
  subject: `New Expert Registration: ${expertUser.name}`,
  html: createCard({
    title: 'Admin Action Required',
    gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">New expert registration received</h2>
      <p style="color:#4b5563;">Please review the following expert application:</p>
      <div style="background:#fff7ed;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:6px 0;color:#374151;">Name: <strong>${expertUser.name}</strong></p>
        <p style="margin:6px 0;color:#374151;">Email: <strong>${expertUser.email}</strong></p>
        <p style="margin:6px 0;color:#374151;">Phone: <strong>${expertUser.phone || 'N/A'}</strong></p>
        <p style="margin:6px 0;color:#374151;">License: <strong>${expertProfile.professionalInfo.licenseNumber || 'N/A'}</strong></p>
        <p style="margin:6px 0;color:#374151;">Experience: <strong>${expertProfile.professionalInfo.experienceYears || 0} years</strong></p>
      </div>`
  })
});

const expertApprovedTemplate = ({ user, loginUrl }) => ({
  subject: 'Your Expert Account Is Activated',
  html: createCard({
    title: 'Account Approved',
    subtitle: 'You can now access your expert dashboard',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;">Your expert profile has been approved. You can now start accepting consultations.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="background:linear-gradient(135deg,#2D7C2D,#438663);color:#fff;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block;">Go to Dashboard</a>
      </div>`
  })
});

const expertRejectedTemplate = ({ user, reason }) => ({
  subject: 'Update on Your Expert Application',
  html: createCard({
    title: 'Application Update',
    gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;">Your expert application needs corrections before approval.</p>
      ${reason ? `<p style="color:#92400e;font-size:14px;">Reason: ${reason}</p>` : ''}
      <p style="color:#4b5563;">Please update your information and resubmit.</p>`
  })
});

const appointmentBookedTemplate = ({ farmer, expert, appointment }) => ({
  subject: `Appointment Booked with ${expert.name}`,
  html: createCard({
    title: 'Appointment Booked',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${farmer.name},</h2>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:16px 0;">
        <p style="margin:8px 0;color:#374151;">Expert: <strong>${expert.name}</strong></p>
        <p style="margin:8px 0;color:#374151;">Date: <strong>${new Date(appointment.appointmentDetails.date).toLocaleDateString()}</strong></p>
        <p style="margin:8px 0;color:#374151;">Time: <strong>${appointment.appointmentDetails.startTime}</strong></p>
        <p style="margin:8px 0;color:#374151;">Type: <strong>${appointment.appointmentDetails.consultationType}</strong></p>
      </div>
      <p style="color:#4b5563;">The expert is expected to confirm this request within 2 hours.</p>`
  })
});

const appointmentRequestExpertTemplate = ({ expert, farmer, appointment }) => ({
  subject: `New Appointment Request from ${farmer?.name || 'Farmer'}`,
  html: createCard({
    title: 'New Appointment Request',
    gradient: 'linear-gradient(135deg,#14532d,#16a34a)',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${expert.name},</h2>
      <p style="color:#4b5563;">A new consultation request is waiting for your response.</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:16px 0;">
        <p style="margin:8px 0;color:#374151;">Farmer: <strong>${farmer?.name || 'N/A'}</strong></p>
        <p style="margin:8px 0;color:#374151;">Date: <strong>${new Date(appointment.appointmentDetails.date).toLocaleDateString()}</strong></p>
        <p style="margin:8px 0;color:#374151;">Time: <strong>${appointment.appointmentDetails.startTime}</strong></p>
        <p style="margin:8px 0;color:#374151;">Issue: <strong>${appointment.appointmentDetails.queryDescription || 'General consultation'}</strong></p>
      </div>`
  })
});

const appointmentConfirmedTemplate = ({ farmer, expert, appointment }) => ({
  farmerSubject: `Appointment Confirmed with ${expert.name}`,
  expertSubject: `Appointment Confirmed with ${farmer.name}`,
  farmerHtml: createCard({
    title: 'Appointment Confirmed',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${farmer.name},</h2>
      <p style="color:#4b5563;">Your expert has confirmed the consultation.</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:16px 0;">
        <p style="margin:8px 0;color:#374151;">Expert: <strong>${expert.name}</strong></p>
        <p style="margin:8px 0;color:#374151;">Date: <strong>${new Date(appointment.appointmentDetails.date).toLocaleDateString()}</strong></p>
        <p style="margin:8px 0;color:#374151;">Time: <strong>${appointment.appointmentDetails.startTime}</strong></p>
      </div>`
  }),
  expertHtml: createCard({
    title: 'Appointment Confirmed',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${expert.name},</h2>
      <p style="color:#4b5563;">You have successfully confirmed this appointment.</p>
      <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:16px 0;">
        <p style="margin:8px 0;color:#374151;">Farmer: <strong>${farmer.name}</strong></p>
        <p style="margin:8px 0;color:#374151;">Date: <strong>${new Date(appointment.appointmentDetails.date).toLocaleDateString()}</strong></p>
        <p style="margin:8px 0;color:#374151;">Time: <strong>${appointment.appointmentDetails.startTime}</strong></p>
      </div>`
  })
});

const expertRegistrationSuccessTemplate = ({ user }) => ({
  subject: '✅ Expert Account Created Successfully - Farmix',
  html: createCard({
    title: 'Welcome Expert! 🎉',
    gradient: 'linear-gradient(135deg,#059669,#10b981)',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;line-height:1.6;">Congratulations! Your expert account has been created successfully.</p>
      
      <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:8px;padding:16px;margin:20px 0;">
        <h3 style="color:#059669;margin:0 0 12px;font-size:16px;">📋 Account Details</h3>
        <p style="margin:6px 0;color:#374151;"><strong>Email:</strong> ${user.email}</p>
        <p style="margin:6px 0;color:#374151;"><strong>Account Status:</strong> <span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:4px;font-weight:600;">Pending Admin Review</span></p>
      </div>

      <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:20px 0;">
        <h3 style="color:#1f4d8f;margin:0 0 12px;font-size:16px;">⏳ What Happens Next?</h3>
        <ul style="color:#4b5563;line-height:1.8;padding-left:20px;margin:0;">
          <li><strong>Review Period:</strong> Your credentials will be verified within 24-48 hours</li>
          <li><strong>Approval Email:</strong> You'll receive a confirmation once verified</li>
          <li><strong>Dashboard Access:</strong> Login to access your expert dashboard</li>
        </ul>
      </div>

      <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#92400e;margin:0;font-size:14px;"><strong>💡 Tip:</strong> Keep your dashboard tab open and we will update you as soon as your account is approved.</p>
      </div>

      <div style="text-align:center;margin:24px 0;">
        <p style="color:#9ca3af;font-size:13px;margin:0;">Questions? Contact our support team at support@farmix.com</p>
      </div>`
  })
});

const farmerRegistrationSuccessTemplate = ({ user }) => ({
  subject: '✅ Welcome to Farmix - Farmer Account Created',
  html: createCard({
    title: 'Welcome Farmer! 🌾',
    gradient: 'linear-gradient(135deg,#16a34a,#22c55e)',
    body: `
      <h2 style="color:#1f2937;margin:0 0 16px;">Hi ${user.name},</h2>
      <p style="color:#4b5563;line-height:1.6;">Welcome! Your farmer account has been successfully created. You can now log in and start using the platform.</p>
      
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px;margin:20px 0;">
        <h3 style="color:#16a34a;margin:0 0 12px;font-size:16px;">🚀 Get Started</h3>
        <p style="margin:6px 0;color:#374151;"><strong>Email:</strong> ${user.email}</p>
        <p style="margin:6px 0;color:#374151;"><strong>Account Status:</strong> <span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:4px;font-weight:600;">Active</span></p>
      </div>

      <div style="background:#f0f9ff;border-radius:12px;padding:16px;margin:20px 0;">
        <h3 style="color:#0369a1;margin:0 0 12px;font-size:16px;">✨ What You Can Do</h3>
        <ul style="color:#4b5563;line-height:1.8;padding-left:20px;margin:0;">
          <li>📍 Add and manage your farm locations</li>
          <li>🌾 Track crop information and yield predictions</li>
          <li>🏥 Get disease diagnosis and expert advice</li>
          <li>📊 View market prices and weather updates</li>
          <li>👨‍💼 Connect with agricultural experts</li>
        </ul>
      </div>

      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" style="background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Go to Dashboard</a>
      </div>

      <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#92400e;margin:0;font-size:14px;"><strong>💡 Pro Tip:</strong> Check out our knowledge base for tutorials on getting the most out of the platform.</p>
      </div>`
  })
});

module.exports = {
  verificationEmailTemplate,
  loginNotificationTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  expertRegistrationPendingTemplate,
  expertRegistrationSuccessTemplate,
  farmerRegistrationSuccessTemplate,
  expertRegistrationAdminAlertTemplate,
  expertApprovedTemplate,
  expertRejectedTemplate,
  appointmentBookedTemplate,
  appointmentRequestExpertTemplate,
  appointmentConfirmedTemplate
};
