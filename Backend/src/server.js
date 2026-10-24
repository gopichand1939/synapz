import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import {
  loginMember,
  changeMemberPassword,
  requestMemberOtp,
  verifyMemberOtp,
  loginAdmin,
  getSession,
  logout
} from './controllers/authController.js';

import {
  getMemberProfile,
  getTodayAttendanceStatus,
  markTodayAttendance,
  getMemberAttendanceHistory
} from './controllers/memberController.js';

import {
  getAdminMetrics,
  listMembers,
  getMemberById,
  registerMember,
  updateMember,
  updateMemberStatus,
  resetMemberPassword,
  getDailyAttendance,
  getAttendanceHistory,
  exportAttendanceCsv,
  listSeats,
  assignSeat,
  updateSeat,
  getPublicSeatAvailability
} from './controllers/adminController.js';

import { requireMemberAuth, requireAdminAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS setup: unrestricted origin reflection to allow any frontend, mobile IP, or network client
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.options('*', cors());

// Rate limiting for auth requests (relaxed to prevent false blocks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  message: { error: 'Too many OTP requests from this connection. Please wait 10 minutes.' }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Synapz Study Zone Backend API',
    timezone: process.env.READING_ROOM_TZ || 'Asia/Kolkata',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
app.get('/api/public/seats', getPublicSeatAvailability);

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
app.post('/api/auth/member/login', authLimiter, loginMember);
app.post('/api/auth/member/change-password', requireMemberAuth, changeMemberPassword);
app.post('/api/auth/member/request-otp', authLimiter, otpRequestLimiter, requestMemberOtp);
app.post('/api/auth/member/verify-otp', authLimiter, verifyMemberOtp);
app.post('/api/auth/admin/login', authLimiter, loginAdmin);
app.get('/api/auth/me', getSession);
app.post('/api/auth/logout', logout);

// ============================================================================
// MEMBER ROUTES (Protected)
// ============================================================================
app.get('/api/member/profile', requireMemberAuth, getMemberProfile);
app.get('/api/member/attendance/today', requireMemberAuth, getTodayAttendanceStatus);
app.post('/api/member/attendance/check-in', requireMemberAuth, markTodayAttendance);
app.get('/api/member/attendance', requireMemberAuth, getMemberAttendanceHistory);

// ============================================================================
// ADMIN ROUTES (Protected)
// ============================================================================
app.get('/api/admin/metrics', requireAdminAuth, getAdminMetrics);
app.get('/api/admin/members', requireAdminAuth, listMembers);
app.post('/api/admin/members', requireAdminAuth, registerMember);
app.get('/api/admin/members/:id', requireAdminAuth, getMemberById);
app.patch('/api/admin/members/:id', requireAdminAuth, updateMember);
app.patch('/api/admin/members/:id/status', requireAdminAuth, updateMemberStatus);
app.post('/api/admin/members/:id/reset-password', requireAdminAuth, resetMemberPassword);
app.get('/api/admin/attendance', requireAdminAuth, getDailyAttendance);
app.get('/api/admin/attendance/history', requireAdminAuth, getAttendanceHistory);
app.get('/api/admin/attendance/export', requireAdminAuth, exportAttendanceCsv);
app.get('/api/admin/seats', requireAdminAuth, listSeats);
app.post('/api/admin/seats/assign', requireAdminAuth, assignSeat);
app.patch('/api/admin/seats/:id', requireAdminAuth, updateSeat);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  SYNAPZ STUDY ZONE — Backend API Server               `);
  console.log(`  Listening on: http://localhost:${PORT}               `);
  console.log(`  Reading Room Timezone: ${process.env.READING_ROOM_TZ || 'Asia/Kolkata'}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});
