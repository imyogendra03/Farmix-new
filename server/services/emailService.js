const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const emailQueue = require('./emailQueue');
const {
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
} = require('./emailTemplates');

const CATEGORY_TO_SETTING = {
  appointmentReminder: 'appointmentReminder',
  marketUpdates: 'marketUpdates',
  weatherAlerts: 'weatherAlerts',
  newsletter: 'newsletter',
  promotional: 'promotional'
};

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || ''
      }
    });
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@farmix.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Farmix - Smart Agriculture';
    this.enabled = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    this.queueReady = false;
    this.unsubscribeSecret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || 'farmix-unsubscribe-secret';
  }

  getClientUrl() {
    return (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  createUnsubscribeToken(userId) {
    return jwt.sign({ userId }, this.unsubscribeSecret, { expiresIn: process.env.EMAIL_UNSUBSCRIBE_EXPIRES_IN || '30d' });
  }

  verifyUnsubscribeToken(token) {
    return jwt.verify(token, this.unsubscribeSecret);
  }

  async canSendEmail(userId, category) {
    if (!userId || !category || !CATEGORY_TO_SETTING[category]) {
      return true;
    }

    const user = await User.findById(userId).select('settings.emailAlerts');
    if (!user) {
      return false;
    }

    const key = CATEGORY_TO_SETTING[category];
    return !!user.settings?.emailAlerts?.[key];
  }

  withUnsubscribeFooter(html, userId, category) {
    if (!userId || !category || !CATEGORY_TO_SETTING[category]) {
      return html;
    }

    const token = this.createUnsubscribeToken(String(userId));
    const serverBase = process.env.SERVER_URL || process.env.API_URL || 'http://localhost:5000';
    const unsubscribeUrl = `${serverBase}/api/auth/unsubscribe?token=${token}&category=${category}`;

    return `${html}
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">
          To stop receiving these emails,
          <a href="${unsubscribeUrl}" style="color:#6b7280;">unsubscribe here</a>.
        </p>
      </div>`;
  }

  async initQueue() {
    if (this.queueReady) {
      return;
    }

    await emailQueue.init(this.sendEmailNow.bind(this));
    this.queueReady = true;
  }

  async sendEmailNow({ recipient, subject, html, text }) {
    if (!this.enabled) {
      console.log(`[EMAIL MOCK] To: ${recipient} | Subject: ${subject}`);
      return { status: 'mocked', recipient, subject };
    }

    const info = await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: recipient,
      subject,
      html,
      text: text || subject
    });

    console.log(`[EMAIL SENT] To: ${recipient} | Subject: ${subject} | ID: ${info.messageId}`);
    return { status: 'sent', messageId: info.messageId };
  }

  async sendEmail({ recipient, subject, html, text, userId, category }) {
    if (!this.queueReady) {
      await this.initQueue();
    }

    try {
      if (!(await this.canSendEmail(userId, category))) {
        return { status: 'skipped', reason: 'email-preference-disabled', recipient, category };
      }

      const emailHtml = this.withUnsubscribeFooter(html, userId, category);
      return await emailQueue.enqueue({ recipient, subject, html: emailHtml, text });
    } catch (error) {
      console.error(`[EMAIL ERROR] Queue dispatch failed for ${recipient}: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }

  async shutdownQueue() {
    await emailQueue.close();
  }

  getQueueStatus() {
    return emailQueue.getStatus();
  }

  // ── Template Methods ────────────────────────────────────────

  async sendVerificationEmail(user, verificationToken) {
    const verifyLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const template = verificationEmailTemplate({ user, verifyLink });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendLoginNotification(user, loginInfo = {}) {
    const loginTime = new Date().toLocaleString();
    const loginIp = loginInfo.ipAddress || 'Unavailable';
    const loginDevice = loginInfo.userAgent || 'Unavailable';
    const loginRole = loginInfo.loginAs || user.role || 'user';
    const template = loginNotificationTemplate({ user, loginTime, loginIp, loginDevice, loginRole });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const template = passwordResetEmailTemplate({ user, resetLink });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendPasswordChangedEmail(user) {
    const template = passwordChangedEmailTemplate({ user, changedAt: new Date().toLocaleString() });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendExpertRegistrationPending(user) {
    const template = expertRegistrationPendingTemplate({ user });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendExpertRegistrationSuccess(user) {
    console.log('📧 [EMAIL SERVICE] sendExpertRegistrationSuccess called for:', user.email);
    const template = expertRegistrationSuccessTemplate({ user });
    console.log('📧 [EMAIL SERVICE] Template subject:', template.subject);

    const result = await this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
    
    console.log('📧 [EMAIL SERVICE] sendEmail returned:', result);
    return result;
  }

  async sendFarmerRegistrationSuccess(user) {
    const template = farmerRegistrationSuccessTemplate({ user });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendExpertRegistrationAdminAlert(expertUser, expertProfile) {
    const admins = await User.find({ role: 'admin', isBlocked: false }).select('_id name email');
    if (!admins.length) {
      return { status: 'skipped', reason: 'no-admin-users' };
    }

    const template = expertRegistrationAdminAlertTemplate({ expertUser, expertProfile });

    await Promise.allSettled(
      admins.map((adminUser) => this.sendEmail({
        recipient: adminUser.email,
        subject: template.subject,
        html: template.html,
        userId: adminUser._id,
        category: 'login'
      }))
    );

    return { status: 'queued', recipients: admins.length };
  }

  async sendExpertApproved(user) {
    const template = expertApprovedTemplate({
      user,
      loginUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`
    });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendExpertRejected(user, reason) {
    const template = expertRejectedTemplate({ user, reason });

    return this.sendEmail({
      recipient: user.email,
      subject: template.subject,
      html: template.html,
      userId: user._id,
      category: 'login'
    });
  }

  async sendAppointmentBooked(farmer, expert, appointment) {
    const template = appointmentBookedTemplate({ farmer, expert, appointment });

    return this.sendEmail({
      recipient: farmer.email,
      subject: template.subject,
      html: template.html,
      userId: farmer._id,
      category: 'appointmentReminder'
    });
  }

  async sendAppointmentRequestToExpert(expert, farmer, appointment) {
    const template = appointmentRequestExpertTemplate({ expert, farmer, appointment });

    return this.sendEmail({
      recipient: expert.email,
      subject: template.subject,
      html: template.html,
      userId: expert._id,
      category: 'appointmentReminder'
    });
  }

  async sendAppointmentConfirmed(farmer, expert, appointment) {
    const template = appointmentConfirmedTemplate({ farmer, expert, appointment });

    await Promise.allSettled([
      this.sendEmail({
        recipient: farmer.email,
        subject: template.farmerSubject,
        html: template.farmerHtml,
        userId: farmer._id,
        category: 'appointmentReminder'
      }),
      this.sendEmail({
        recipient: expert.email,
        subject: template.expertSubject,
        html: template.expertHtml,
        userId: expert._id,
        category: 'appointmentReminder'
      })
    ]);

    return { status: 'queued' };
  }

  // Send OTP via Email (registration verification)
  async sendOTPEmail(email, otp, phone) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="${this.getClientUrl()}/FarmixName.png" alt="Farmix" width="168" style="display: block; margin: 0 auto; height: auto; max-width: 100%;" />
          <p style="color: #d1fae5; margin: 12px 0 0 0;">Registration OTP Verification</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Verify Your Registration</h2>
          
          <p style="color: #4b5563; margin: 0 0 25px 0;">
            Use this OTP to complete registration for: <strong>${email}</strong>
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
            <div style="background: white; padding: 15px; border-radius: 6px; border: 2px solid #16a34a;">
              <p style="color: #16a34a; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px;">${otp}</p>
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⏱️ Code expires in 10 minutes</strong>
            </p>
            <p style="color: #92400e; margin: 5px 0 0 0; font-size: 13px;">
              Do not share this code with anyone.
            </p>
          </div>
          
          <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 13px;">
            If you didn't request this code, please ignore this email or contact support.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px;">
            <img src="${this.getClientUrl()}/FarmixName.png" alt="Farmix" width="112" style="display: block; margin: 0 auto 10px; height: auto; max-width: 100%;" />
            <p style="margin: 0;">&copy; 2026 All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">
              <a href="${this.getClientUrl()}" style="color: #16a34a; text-decoration: none;">Visit Dashboard</a>
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      recipient: email,
      subject: `Farmix Registration OTP: ${otp}`,
      html,
      text: `Farmix Registration OTP: ${otp}. This code expires in 10 minutes.`,
      userId: null,
      category: 'login'
    });
  }
}

module.exports = new EmailService();
