import React, { useState } from 'react';
import { api } from '../../portal/api';
import { toast } from '../../components/shared/Toast';

export default function MemberChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password Too Short', 'New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mismatch', 'The new password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changeMemberPassword(currentPassword, newPassword);
      if (res.success) {
        toast.success('Password Updated', 'Your password has been successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Update Failed', res.error || 'Failed to change password.');
      }
    } catch (err) {
      toast.error('Update Error', err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="member-page-container">
      <div className="page-header-simple">
        <div>
          <h1 className="page-title">Change Password</h1>
          <p className="page-subtitle">
            Update your credentials for secure access to the Synapz Member Portal.
          </p>
        </div>
      </div>

      <div className="form-card-container">

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-group">
            <label htmlFor="current-pwd" className="form-label">Current Password</label>
            <input
              id="current-pwd"
              type={showPasswords ? 'text' : 'password'}
              required
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-pwd" className="form-label">New Password</label>
            <input
              id="new-pwd"
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Enter new password (min. 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-pwd" className="form-label">Confirm New Password</label>
            <input
              id="confirm-pwd"
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              <span>Show passwords in clear text</span>
            </label>
          </div>

          <div className="form-actions-row">
            <button
              type="submit"
              className="btn btn-terracotta"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? 'Updating Password...' : 'Update Password ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
