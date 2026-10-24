import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';

export default function MemberProfilePage() {
  const { member } = useOutletContext();

  const formattedStartDate = member?.membershipStartDate
    ? new Date(member.membershipStartDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Active';

  return (
    <div className="member-page-container">
      <div className="page-header-simple">
        <div>
          <h1 className="page-title">My Member Profile</h1>
          <p className="page-subtitle">
            Registered details and study cabin allotment for Synapz Study Zone.
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Profile Card */}
        <div className="info-card profile-details-card">
          <div className="profile-hero-header">
            <div className="profile-avatar-large">
              {member?.fullName ? member.fullName.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="profile-header-info">
              <h2 className="profile-full-name">{member?.fullName}</h2>
              <span className="profile-code">{member?.memberCode}</span>
            </div>
          </div>

          <div className="profile-attributes-list">
            <div className="attribute-item">
              <span className="attr-label">Registered Mobile</span>
              <span className="attr-val font-mono">+91 {member?.mobileNumber}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Allotted Study Cabin</span>
              <span className="attr-val font-mono">Cabin {member?.allottedSeatNumber || 'Unassigned'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Study Focus / Target Exam</span>
              <span className="attr-val">{member?.studyPurpose || 'Academic / Competitive Focus'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Membership Status</span>
              <span className="attr-val">
                <span className="status-badge status-present">● {member?.status || 'ACTIVE'}</span>
              </span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Member Since</span>
              <span className="attr-val">{formattedStartDate}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Shift Hours</span>
              <span className="attr-val">Full Day (06:00 AM – 10:00 PM)</span>
            </div>
          </div>

          <div className="profile-card-footer">
            <Link to="/member/change-password" className="btn btn-outline-clean">
              Change Account Password ➔
            </Link>
          </div>
        </div>

        {/* Reading Room Guidelines & Support Card */}
        <div className="info-card rules-card">
          <h3 className="card-title">Reading Room Guidelines</h3>
          <ul className="guidelines-list">
            <li>
              <strong>Silence Protocol:</strong> Please maintain strict silence within the study hall. Mobile phones must be set to silent mode at all times.
            </li>
            <li>
              <strong>Cabin Belongings:</strong> You may leave your reference books and stationery in your allotted cabin overnight.
            </li>
            <li>
              <strong>High-Speed Wi-Fi:</strong> High-bandwidth 5G Wi-Fi is calibrated for online lectures and academic research.
            </li>
            <li>
              <strong>Assistance:</strong> For any cabin adjustments or administrative queries, visit the front desk or contact <strong>+91 9492722891</strong>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
