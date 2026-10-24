import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'synapz_super_secret_jwt_key_2026_reading_room_focus';

export function extractToken(req) {
  if (req.cookies && req.cookies.synapz_token) {
    return req.cookies.synapz_token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function requireMemberAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in with your mobile number.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'MEMBER' || !decoded.memberId) {
      return res.status(403).json({ error: 'Invalid member session.' });
    }

    const member = await prisma.synapzMember.findUnique({
      where: { id: decoded.memberId },
      include: { seat: true }
    });

    if (!member) {
      return res.status(401).json({ error: 'Member record not found.' });
    }

    if (member.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your membership is currently suspended. Please contact the administrator.' });
    }

    if (member.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Your membership is inactive.' });
    }

    req.member = member;
    req.userRole = 'MEMBER';
    next();
  } catch (err) {
    console.error('Member Auth Error:', err.message);
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

export async function requireAdminAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Administrator access required. Please log in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') || !decoded.adminId) {
      return res.status(403).json({ error: 'Insufficient administrative privileges.' });
    }

    const admin = await prisma.synapzAdminUser.findUnique({
      where: { id: decoded.adminId }
    });

    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: 'Administrator account is deactivated or invalid.' });
    }

    req.admin = admin;
    req.userRole = admin.role;
    next();
  } catch (err) {
    console.error('Admin Auth Error:', err.message);
    return res.status(401).json({ error: 'Administrative session expired. Please log in again.' });
  }
}
