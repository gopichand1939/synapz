/**
 * API Client for SYNAPZ STUDY ZONE Member & Admin Portals
 */

const BASE_URL = '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach JWT Bearer token if present (ensures mobile & cross-origin reliability)
  try {
    const token = localStorage.getItem('synapz_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // LocalStorage not available or restricted
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || (typeof data === 'string' ? data : 'Request failed.');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  loginMember: async (mobileNumber, password) => {
    const data = await request('/api/auth/member/login', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, password })
    });
    if (data.token) {
      try {
        localStorage.setItem('synapz_token', data.token);
        localStorage.setItem('synapz_role', 'MEMBER');
      } catch {}
    }
    return data;
  },

  changeMemberPassword: (currentPassword, newPassword) => request('/api/auth/member/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),

  loginAdmin: async (username, password) => {
    const data = await request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      try {
        localStorage.setItem('synapz_token', data.token);
        localStorage.setItem('synapz_role', 'ADMIN');
      } catch {}
    }
    return data;
  },

  getSession: () => request('/api/auth/me'),

  logout: async () => {
    try {
      localStorage.removeItem('synapz_token');
      localStorage.removeItem('synapz_role');
    } catch {}
    return request('/api/auth/logout', { method: 'POST' });
  },

  // Member
  getMemberProfile: () => request('/api/member/profile'),

  getTodayAttendance: () => request('/api/member/attendance/today'),

  markAttendance: () => request('/api/member/attendance/check-in', { method: 'POST' }),

  getMemberHistory: () => request('/api/member/attendance'),

  // Admin
  getAdminMetrics: () => request('/api/admin/metrics'),

  listMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/members?${query}`);
  },

  getMemberById: (id) => request(`/api/admin/members/${id}`),

  registerMember: (memberData) => request('/api/admin/members', {
    method: 'POST',
    body: JSON.stringify(memberData)
  }),

  updateMember: (id, data) => request(`/api/admin/members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  updateMemberStatus: (id, status) => request(`/api/admin/members/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  resetMemberPassword: (id, newPassword) => request(`/api/admin/members/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  }),

  getDailyAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/attendance?${query}`);
  },

  getAttendanceHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/attendance/history?${query}`);
  },

  exportAttendanceUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/admin/attendance/export?${query}`;
  },

  listSeats: () => request('/api/admin/seats'),

  assignSeat: (seatNumber, memberId) => request('/api/admin/seats/assign', {
    method: 'POST',
    body: JSON.stringify({ seatNumber, memberId })
  }),

  updateSeat: (id, data) => request(`/api/admin/seats/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  getPublicSeats: () => request('/api/public/seats')
};
