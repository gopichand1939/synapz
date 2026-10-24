import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import MemberLoginPage from './pages/public/MemberLoginPage';
import AdminLoginPage from './pages/public/AdminLoginPage';

// Member Portal Pages
import MemberDashboardPage from './pages/member/MemberDashboardPage';
import MemberAttendancePage from './pages/member/MemberAttendancePage';
import MemberProfilePage from './pages/member/MemberProfilePage';
import MemberChangePasswordPage from './pages/member/MemberChangePasswordPage';

// Admin Panel Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminRegisterMemberPage from './pages/admin/AdminRegisterMemberPage';
import AdminMemberDetailPage from './pages/admin/AdminMemberDetailPage';
import AdminMemberEditPage from './pages/admin/AdminMemberEditPage';
import AdminDailyAttendancePage from './pages/admin/AdminDailyAttendancePage';
import AdminAttendanceHistoryPage from './pages/admin/AdminAttendanceHistoryPage';
import AdminSeatsPage from './pages/admin/AdminSeatsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

import ToastContainer from './components/shared/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public & Authentication Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/member/login" element={<MemberLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Member Portal Routes (Independent Layout) */}
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<Navigate to="/member/dashboard" replace />} />
          <Route path="dashboard" element={<MemberDashboardPage />} />
          <Route path="attendance" element={<MemberAttendancePage />} />
          <Route path="profile" element={<MemberProfilePage />} />
          <Route path="change-password" element={<MemberChangePasswordPage />} />
        </Route>

        {/* Admin Panel Routes (Persistent Desktop Sidebar Layout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="members/register" element={<AdminRegisterMemberPage />} />
          <Route path="members/:id" element={<AdminMemberDetailPage />} />
          <Route path="members/:id/edit" element={<AdminMemberEditPage />} />
          <Route path="attendance" element={<AdminDailyAttendancePage />} />
          <Route path="attendance/history" element={<AdminAttendanceHistoryPage />} />
          <Route path="seats" element={<AdminSeatsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
