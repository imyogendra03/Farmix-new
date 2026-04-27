// OTP Service - Email Based (100% FREE)
class OTPService {
  // Generate random 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Verify OTP is valid and not expired
  static verifyOTP(storedOTP, userOTP, expiresAt) {
    // Check if OTP is expired (10 minutes validity)
    if (new Date() > new Date(expiresAt)) {
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Check if OTP matches
    if (storedOTP !== userOTP) {
      throw new Error('Invalid OTP. Please try again.');
    }

    return true;
  }
}

module.exports = OTPService;
