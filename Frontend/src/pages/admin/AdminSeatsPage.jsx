import React, { useState, useEffect } from 'react';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from '../../components/shared/Toast';

export default function AdminSeatsPage() {
  const [seats, setSeats] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [assigningMemberId, setAssigningMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [seatRes, memRes] = await Promise.all([
        api.listSeats(),
        api.listMembers({ limit: 100 })
      ]);
      if (seatRes.success) setSeats(seatRes.seats || []);
      if (memRes.success) setMembers(memRes.members || []);
    } catch (err) {
      console.error('Seats page error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setAssigningMemberId(seat.member?.id || '');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSeat || !assigningMemberId) return;

    setSubmitting(true);
    try {
      const res = await api.assignSeat(selectedSeat.seatNumber, assigningMemberId);
      if (res.success) {
        toast.success('Seat Allotted', res.message || `Seat ${selectedSeat.seatNumber} successfully allotted.`);
        await loadData();
        // Update selected seat state
        const updated = seats.find(s => s.seatNumber === selectedSeat.seatNumber);
        if (updated) setSelectedSeat(updated);
      } else {
        toast.error('Assignment Failed', res.error || 'Failed to assign seat.');
      }
    } catch (err) {
      toast.error('Assignment Error', err.message || 'Seat assignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (newStatus) => {
    if (!selectedSeat) return;
    try {
      const res = await api.updateSeat(selectedSeat.id, { status: newStatus });
      if (res.success) {
        toast.success('Status Updated', `Seat ${selectedSeat.seatNumber} set to ${newStatus}.`);
        await loadData();
        setSelectedSeat(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error('Status Error', err.message || 'Failed to update seat status.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Rendering 32-cabin floor plan..." />;
  }

  // Authentic zones defined in reading room
  const northAisle = ['C', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
  const centralTop = ['B', 'E', 'A', 'D'];
  const centralPairs = [
    ['13', '14'],
    ['12', '15'],
    ['11', '16'],
    ['10', '17']
  ];
  const southAisle = ['F', '26', '25', '24', '23', '22', '21', '20', '19', '18'];

  const getSeatObj = (seatNum) => seats.find(s => s.seatNumber === seatNum) || { seatNumber: seatNum, status: 'AVAILABLE' };

  const totalAllotted = seats.filter(s => s.status === 'ALLOTTED').length;
  const totalAvailable = seats.filter(s => s.status === 'AVAILABLE').length;

  return (
    <div className="admin-page-wrap">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">32-Cabin Floor Plan & Seat Management</h1>
          <p className="admin-subheading">
            Authentic architectural layout of the Madhurawada reading room ({totalAllotted} Allotted, {totalAvailable} Available).
          </p>
        </div>
        <div className="seat-legend-bar">
          <div className="legend-item">
            <span className="legend-swatch swatch-available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-allotted" />
            <span>Allotted</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-maintenance" />
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      <div className="seats-page-grid">
        {/* Interactive Floor Plan Map */}
        <div className="floorplan-card">
          <div className="floorplan-container">
            {/* North Aisle */}
            <div className="floorplan-zone">
              <div className="zone-label-tag">North Quiet Aisle (10 Individual Cabins)</div>
              <div className="seats-linear-row">
                {northAisle.map(num => {
                  const s = getSeatObj(num);
                  const isSelected = selectedSeat?.seatNumber === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSeatClick(s)}
                      className={`seat-node ${s.status === 'ALLOTTED' ? 'is-allotted' : s.status === 'MAINTENANCE' ? 'is-maintenance' : 'is-available'} ${isSelected ? 'is-selected' : ''}`}
                      title={`Seat ${num} — ${s.status === 'ALLOTTED' ? `Allotted to ${s.member?.fullName || 'Member'}` : s.status}`}
                    >
                      <span className="seat-num">{num}</span>
                      <span className="seat-dot" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Central Cluster */}
            <div className="floorplan-zone central-zone-wrap">
              <div className="zone-label-tag">Central Focus Pod (12 Pod Cabins)</div>
              
              {/* Corner Cubicles */}
              <div className="central-corners-row">
                {centralTop.map(num => {
                  const s = getSeatObj(num);
                  const isSelected = selectedSeat?.seatNumber === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSeatClick(s)}
                      className={`seat-node ${s.status === 'ALLOTTED' ? 'is-allotted' : s.status === 'MAINTENANCE' ? 'is-maintenance' : 'is-available'} ${isSelected ? 'is-selected' : ''}`}
                      title={`Pod ${num} — ${s.status}`}
                    >
                      <span className="seat-num">{num}</span>
                      <span className="seat-dot" />
                    </button>
                  );
                })}
              </div>

              {/* Facing Study Pairs */}
              <div className="central-pairs-grid">
                {centralPairs.map(([left, right], idx) => {
                  const sL = getSeatObj(left);
                  const sR = getSeatObj(right);
                  return (
                    <div key={idx} className="pod-pair">
                      <button
                        type="button"
                        onClick={() => handleSeatClick(sL)}
                        className={`seat-node ${sL.status === 'ALLOTTED' ? 'is-allotted' : sL.status === 'MAINTENANCE' ? 'is-maintenance' : 'is-available'} ${selectedSeat?.seatNumber === left ? 'is-selected' : ''}`}
                      >
                        <span className="seat-num">{left}</span>
                      </button>
                      <div className="pod-divider" />
                      <button
                        type="button"
                        onClick={() => handleSeatClick(sR)}
                        className={`seat-node ${sR.status === 'ALLOTTED' ? 'is-allotted' : sR.status === 'MAINTENANCE' ? 'is-maintenance' : 'is-available'} ${selectedSeat?.seatNumber === right ? 'is-selected' : ''}`}
                      >
                        <span className="seat-num">{right}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* South Aisle */}
            <div className="floorplan-zone">
              <div className="zone-label-tag">South Quiet Aisle (10 Individual Cabins)</div>
              <div className="seats-linear-row">
                {southAisle.map(num => {
                  const s = getSeatObj(num);
                  const isSelected = selectedSeat?.seatNumber === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSeatClick(s)}
                      className={`seat-node ${s.status === 'ALLOTTED' ? 'is-allotted' : s.status === 'MAINTENANCE' ? 'is-maintenance' : 'is-available'} ${isSelected ? 'is-selected' : ''}`}
                      title={`Seat ${num} — ${s.status}`}
                    >
                      <span className="seat-num">{num}</span>
                      <span className="seat-dot" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Seat Details Drawer / Panel */}
        <div className="seat-inspector-panel">
          {selectedSeat ? (
            <div className="inspector-card">
              <div className="inspector-header">
                <div>
                  <span className="inspector-badge">{selectedSeat.zone}</span>
                  <h3 className="inspector-title">Cabin {selectedSeat.seatNumber}</h3>
                </div>
                <span className={`status-badge ${selectedSeat.status === 'ALLOTTED' ? 'status-present' : selectedSeat.status === 'MAINTENANCE' ? 'status-suspended' : 'status-inactive'}`}>
                  ● {selectedSeat.status}
                </span>
              </div>

              {selectedSeat.member ? (
                <div className="allotted-member-box">
                  <span className="box-title">CURRENTLY ALLOTTED MEMBER</span>
                  <div className="mem-row">
                    <span className="mem-label">Full Name:</span>
                    <span className="mem-val font-bold">{selectedSeat.member.fullName}</span>
                  </div>
                  <div className="mem-row">
                    <span className="mem-label">Member ID:</span>
                    <span className="mem-val font-mono">{selectedSeat.member.memberCode}</span>
                  </div>
                  <div className="mem-row">
                    <span className="mem-label">Registered Mobile:</span>
                    <span className="mem-val font-mono">+91 {selectedSeat.member.mobileNumber}</span>
                  </div>
                  <div className="mem-row">
                    <span className="mem-label">Status:</span>
                    <span className="mem-val">{selectedSeat.member.status}</span>
                  </div>
                </div>
              ) : (
                <div className="unallotted-box">
                  <p>This cabin is currently unassigned and ready for allotment to a registered student.</p>
                </div>
              )}

              {/* Assignment Form */}
              <form onSubmit={handleAssignSubmit} className="seat-reassign-form">
                <label htmlFor="assign-member-select" className="form-label">
                  {selectedSeat.member ? 'Reassign Cabin to Another Member:' : 'Assign Cabin to Member:'}
                </label>
                <select
                  id="assign-member-select"
                  value={assigningMemberId}
                  onChange={(e) => setAssigningMemberId(e.target.value)}
                  className="form-select"
                  disabled={submitting}
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberCode}) — Currently {m.allottedSeatNumber ? `Seat ${m.allottedSeatNumber}` : 'Unallotted'}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={submitting || !assigningMemberId || assigningMemberId === selectedSeat.member?.id}
                  className="btn btn-sm btn-terracotta"
                  style={{ marginTop: '0.6rem', width: '100%' }}
                >
                  {submitting ? 'Updating Allotment...' : 'Confirm Cabin Assignment'}
                </button>
              </form>

              {/* Status Controls */}
              <div className="seat-status-controls">
                <span className="control-label">Cabin State:</span>
                <div className="status-btns-row">
                  {selectedSeat.status !== 'AVAILABLE' && (
                    <button
                      type="button"
                      onClick={() => handleStatusToggle('AVAILABLE')}
                      className="btn btn-xs btn-outline-clean"
                    >
                      Set Available
                    </button>
                  )}
                  {selectedSeat.status !== 'MAINTENANCE' && (
                    <button
                      type="button"
                      onClick={() => handleStatusToggle('MAINTENANCE')}
                      className="btn btn-xs btn-ghost"
                    >
                      Set Maintenance
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-placeholder">
              <span className="placeholder-icon">🪑</span>
              <p>Click any cabin on the 32-seat floor plan to inspect its allotment status or reassign it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
