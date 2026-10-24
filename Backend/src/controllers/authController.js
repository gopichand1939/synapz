import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../db/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'synapz_super_secret_jwt_key_2026_reading_room_focus';
const OTP_DEV_MODE = process.env.OTP_DEV_MODE === 'true';

// Helper to sanitize Indian 10-digit mobile number
export function sanitizeMobile(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/**
 * Member Login with Mobile Number and Password
 * POST /api/auth/member/login
 */
export async function loginMember(req, res) {
  try {
    const rawMobile = req.body.mobileNumber;
    const password = String(req.body.password || '').trim();
    const mobileNumber = sanitizeMobile(rawMobile);

    if (!mobileNumber || mobileNumber.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit registered mobile number.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    // 1. Fetch member with allotted seat
    const member = await prisma.synapzMember.findUnique({
      where: { mobileNumber },
      include: { seat: true }
    });

    if (!member) {
      return res.status(401).json({
        error: 'No registered member found with this mobile number. Please contact Synapz Administration.'
      });
    }

    if (member.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Your membership is suspended. Please contact the front desk administration.'
      });
    }

    if (member.status === 'INACTIVE') {
      return res.status(403).json({
        error: 'Your membership is inactive or concluded. Please renew at the front desk.'
      });
    }

    if (!member.passwordHash) {
      return res.status(401).json({
        error: 'Password not provisioned for this account. Please ask the administrator to reset your password.'
      });
    }

    // 2. Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, member.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid password. Please check your credentials or contact administration for password reset.'
      });
    }

    // 3. Issue JWT Token
    const token = jwt.sign(
      {
        memberId: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        seatNumber: member.allottedSeatNumber,
        role: 'MEMBER'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 4. Set HttpOnly Cookie
    res.cookie('synapz_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      member: {
        id: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        mobileNumber: member.mobileNumber,
        allottedSeatNumber: member.allottedSeatNumber,
        status: member.status,
        studyPurpose: member.studyPurpose,
        membershipStartDate: member.membershipStartDate
      }
    });
  } catch (err) {
    console.error('Member Login Error:', err);
    return res.status(500).json({ error: 'Authentication failed due to a server error.' });
  }
}

/**
 * Change Member Password
 * POST /api/auth/member/change-password
 */
export async function changeMemberPassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const member = await prisma.synapzMember.findUnique({
      where: { id: memberId }
    });

    if (!member || !member.passwordHash) {
      return res.status(404).json({ error: 'Member record not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, member.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.synapzMember.update({
      where: { id: memberId },
      data: { passwordHash: newHash }
    });

    return res.json({
      success: true,
      message: 'Your password has been changed successfully.'
    });
  } catch (err) {
    console.error('Change Password Error:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
}

/**
 * Member OTP Request
 * POST /api/auth/member/request-otp
 */
export async function requestMemberOtp(req, res) {
  try {
    const rawMobile = req.body.mobileNumber;
    const mobileNumber = sanitizeMobile(rawMobile);

    if (!mobileNumber || mobileNumber.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // 1. Verify that the member exists in our database
    const member = await prisma.synapzMember.findUnique({
      where: { mobileNumber },
      include: { seat: true }
    });

    if (!member) {
      return res.status(404).json({
        error: 'Mobile number not registered. Please contact Synapz administration for seat allotment and registration.'
      });
    }

    if (member.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Your membership is currently suspended. Please visit the front desk.'
      });
    }

    if (member.status === 'INACTIVE') {
      return res.status(403).json({
        error: 'Your membership has concluded. Please contact the front desk to renew.'
      });
    }

    // 2. Cooldown check: prevent requesting OTP more frequently than once every 45 seconds
    const recentOtp = await prisma.synapzOtpSession.findFirst({
      where: {
        mobileNumber,
        createdAt: { gte: new Date(Date.now() - 45 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentOtp) {
      return res.status(429).json({
        error: 'Please wait 45 seconds before requesting another verification code.'
      });
    }

    // 3. Generate a 6-digit numeric OTP
    // In dev mode or test numbers, we can use a secure random 6-digit code or standard dev code
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 4. Save session
    await prisma.synapzOtpSession.create({
      data: {
        id: `otp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        mobileNumber,
        otpHash,
        expiresAt,
        attempts: 0,
        isVerified: false
      }
    });

    // 5. Send via SMS Provider in Production (e.g. Twilio, MSG91, Fast2SMS)
    if (process.env.NODE_ENV === 'production' && !OTP_DEV_MODE) {
      // Integration hook: sendSmsOtp(mobileNumber, otp)
      console.log(`[PROD SMS] Dispatched OTP to +91 ${mobileNumber}`);
    } else {
      console.log(`[DEV OTP] For +91 ${mobileNumber}: Code is ${otp}`);
    }

    return res.json({
      success: true,
      message: `Verification code sent to +91 ******${mobileNumber.slice(-4)}.`,
      // For development ease, we provide the test OTP in dev mode response
      devOtp: OTP_DEV_MODE ? otp : undefined
    });
  } catch (err) {
    console.error('Request OTP Error:', err);
    return res.status(500).json({ error: 'Failed to dispatch verification code. Please try again.' });
  }
}

/**
 * Member OTP Verification
 * POST /api/auth/member/verify-otp
 */
export async function verifyMemberOtp(req, res) {
  try {
    const rawMobile = req.body.mobileNumber;
    const otp = String(req.body.otp || '').trim();
    const mobileNumber = sanitizeMobile(rawMobile);

    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and verification code are required.' });
    }

    // 1. Fetch the latest active OTP session
    const otpSession = await prisma.synapzOtpSession.findFirst({
      where: {
        mobileNumber,
        isVerified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpSession) {
      return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
    }

    // 2. Check attempt limits (max 5)
    if (otpSession.attempts >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
    }

    // 3. Verify OTP
    const isMatch = await bcrypt.compare(otp, otpSession.otpHash);
    if (!isMatch) {
      await prisma.synapzOtpSession.update({
        where: { id: otpSession.id },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // 4. Mark OTP session as verified
    await prisma.synapzOtpSession.update({
      where: { id: otpSession.id },
      data: { isVerified: true }
    });

    // 5. Fetch member details
    const member = await prisma.synapzMember.findUnique({
      where: { mobileNumber },
      include: { seat: true }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member profile not found.' });
    }

    // 6. Generate signed JWT token
    const token = jwt.sign(
      {
        memberId: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        seatNumber: member.allottedSeatNumber,
        role: 'MEMBER'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 7. Set secure HttpOnly cookie
    res.cookie('synapz_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      member: {
        id: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        mobileNumber: member.mobileNumber,
        allottedSeatNumber: member.allottedSeatNumber,
        status: member.status,
        studyPurpose: member.studyPurpose,
        membershipStartDate: member.membershipStartDate
      }
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}

/**
 * Administrator Login
 * POST /api/auth/admin/login
 */
export async function loginAdmin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const admin = await prisma.synapzAdminUser.findUnique({
      where: { username: String(username).trim().toLowerCase() }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid administrative credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid administrative credentials.' });
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('synapz_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Log admin login audit
    await prisma.synapzAuditLog.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        actorId: admin.id,
        actorRole: admin.role,
        action: 'ADMIN_LOGIN',
        entityType: 'AdminUser',
        entityId: admin.id,
        metadata: JSON.stringify({ ip: req.ip, userAgent: req.headers['user-agent'] })
      }
    });

    return res.json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({ error: 'Administrative authentication failed.' });
  }
}

/**
 * Get Current Authenticated Session
 * GET /api/auth/me
 */
export async function getSession(req, res) {
  try {
    const token = req.cookies?.synapz_token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === 'MEMBER') {
      const member = await prisma.synapzMember.findUnique({
        where: { id: decoded.memberId },
        include: { seat: true }
      });

      if (!member || member.status === 'INACTIVE' || member.status === 'SUSPENDED') {
        return res.status(401).json({ authenticated: false });
      }

      return res.json({
        authenticated: true,
        role: 'MEMBER',
        user: {
          id: member.id,
          memberCode: member.memberCode,
          fullName: member.fullName,
          mobileNumber: member.mobileNumber,
          allottedSeatNumber: member.allottedSeatNumber,
          status: member.status,
          studyPurpose: member.studyPurpose,
          membershipStartDate: member.membershipStartDate
        }
      });
    }

    if (decoded.role === 'ADMIN' || decoded.role === 'STAFF') {
      const admin = await prisma.synapzAdminUser.findUnique({
        where: { id: decoded.adminId }
      });

      if (!admin || !admin.isActive) {
        return res.status(401).json({ authenticated: false });
      }

      return res.json({
        authenticated: true,
        role: admin.role,
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role
        }
      });
    }

    return res.status(401).json({ authenticated: false });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}

/**
 * Logout
 * POST /api/auth/logout
 */
export function logout(req, res) {
  res.clearCookie('synapz_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
}
