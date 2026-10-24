import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../portal/api';

export default function LandingPage() {
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatMap, setSeatMap] = useState({
    'C': 'ALLOTTED',
    '13': 'ALLOTTED',
    '24': 'ALLOTTED'
  });
  const [seatSummary, setSeatSummary] = useState({
    totalSeats: 32,
    availableSeats: 29,
    allottedSeats: 3
  });

  useEffect(() => {
    let isMounted = true;
    api.getPublicSeats()
      .then(res => {
        if (!isMounted || !res.success) return;
        const map = {};
        (res.seats || []).forEach(s => {
          map[s.seatNumber] = s.status;
        });
        setSeatMap(map);
        if (res.summary) {
          setSeatSummary(res.summary);
        }
      })
      .catch(err => console.error('Failed to load public seats:', err));

    return () => { isMounted = false; };
  }, []);

  const getSeatStatus = (code) => seatMap[code] || 'AVAILABLE';

  // 32 Authentic Seats
  const northAisle = ['C', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
  const centralTop = ['B', 'E', 'A', 'D'];
  const centralPairs = [
    ['13', '14'],
    ['12', '15'],
    ['11', '16'],
    ['10', '17']
  ];
  const southAisle = ['F', '26', '25', '24', '23', '22', '21', '20', '19', '18'];

  return (
    <div className="landing-shell">
      {/* Editorial Header (Natural Scroll) */}
      <header className="arch-header" id="top-header">
        <div className="arch-container arch-container--fluid">
          <nav className="arch-nav-wrapper" aria-label="Main Navigation">
            {/* Logo */}
            <Link to="/" className="brand-mark" aria-label="Synapz Study Zone — Return to top">
              <div className="brand-logo-frame">
                <img src="/synapz-logo.png" alt="Synapz Study Zone Logo" className="brand-logo-img" />
              </div>
            </Link>

            {/* Nav Links */}
            <ul className="arch-nav-links" role="list">
              <li>
                <a href="#role-gateway" className="arch-nav-link">
                  <span className="num">01</span> Portals
                </a>
              </li>
              <li>
                <a href="#essence" className="arch-nav-link">
                  <span className="num">02</span> The Quiet Hour
                </a>
              </li>
              <li>
                <a href="#experience" className="arch-nav-link">
                  <span className="num">03</span> Sanctuary
                </a>
              </li>
              <li>
                <a href="#seats" className="arch-nav-link">
                  <span className="num">04</span> 32 Cabins
                </a>
              </li>
              <li>
                <a href="#location" className="arch-nav-link">
                  <span className="num">05</span> Location
                </a>
              </li>
            </ul>

            {/* Direct Login Actions */}
            <div className="arch-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Link to="/member/login" className="btn btn-ghost-dark btn-sm">
                Member Sign In
              </Link>
              <Link to="/admin/login" className="btn btn-terracotta btn-sm">
                Admin Console ➔
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section with proper padding-top */}
      <section className="hero-section" id="top">
        <div className="arch-container">
          <div className="hero-editorial-strip">
            <div className="hero-meta-badge">
              <span className="datum-tag">MADHURAWADA, VISAKHAPATNAM</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>32 DEDICATED CABINS</span>
            </div>
            <div className="hero-rating-pill">
              <span className="hero-rating-stars">★★★★★</span>
              <span className="hero-rating-meta">5.0 GOOGLE RATING (11 REVIEWS)</span>
            </div>
          </div>

          <div className="hero-grid">
            <div className="hero-content">
              <span className="hero-pretitle">AN INTENTIONAL READING ROOM</span>
              <h1 className="hero-title">
                The Architecture
                <span className="serif-line">of Focus.</span>
              </h1>
              <p className="hero-lede">
                Thirty-two dedicated study cabins calibrated for deep academic focus, competitive examination preparation, and uninterrupted hours. Designed with acoustic privacy partitions, ergonomic lumbar support, and dual power backup lines.
              </p>
              <div className="hero-actions-row">
                <Link to="/member/login" className="btn btn-terracotta">
                  Member Portal Login ➔
                </Link>
                <Link to="/admin/login" className="btn btn-ghost-dark">
                  Admin Console ➔
                </Link>
              </div>
              <div className="hero-meta-stats">
                <div className="meta-stat-item">
                  <span className="meta-stat-val">32</span>
                  <span className="meta-stat-label">Focus Cabins</span>
                </div>
                <div className="meta-stat-item">
                  <span className="meta-stat-val">16h</span>
                  <span className="meta-stat-label">Daily Shifts (6AM–10PM)</span>
                </div>
                <div className="meta-stat-item">
                  <span className="meta-stat-val">100%</span>
                  <span className="meta-stat-label">Power & Wi-Fi Uptime</span>
                </div>
              </div>
            </div>

            <div className="hero-photo-composition">
              <div className="hero-photo-frame">
                <img
                  src="https://www.synapzstudyzone.com/synapz-interior-google.jpg"
                  alt="Synapz Study Zone interior study cabins"
                  className="hero-photo-img"
                />
                <span className="photo-annotation-top">NORTH STUDY AISLE</span>
                <div className="photo-annotation-bottom">
                  <span className="pulse-dot" />
                  <span>FACILITY ACTIVE · MADHURAWADA</span>
                </div>
              </div>
              <div className="hero-floating-card">
                <span className="card-lead">DEDICATED ALLOTMENT</span>
                <span className="card-text">One member per cabin. Zero desk switching during your tenure.</span>
              </div>
            </div>
          </div>

          {/* Prominent Dual Role Gateway Cards */}
          <div id="role-gateway" className="role-gateway-grid">
            {/* Member Portal Card */}
            <div className="gateway-card">
              <div className="gateway-tag">STUDENT SELF-SERVICE</div>
              <h2 className="gateway-title">Member Portal</h2>
              <p className="gateway-description">
                Sign in with your registered mobile number and password to mark your daily cabin attendance with one tap, view your attendance history, and manage your focus profile.
              </p>
              <div className="gateway-features">
                <span className="feature-pill">✓ One-Tap Attendance</span>
                <span className="feature-pill">✓ Asia/Kolkata Clock</span>
                <span className="feature-pill">✓ Attendance History</span>
              </div>
              <Link to="/member/login" className="btn btn-terracotta btn-gateway">
                Sign In to Member Portal ➔
              </Link>
            </div>

            {/* Admin Console Card */}
            <div className="gateway-card">
              <div className="gateway-tag">MANAGEMENT CONSOLE</div>
              <h2 className="gateway-title">Admin Panel</h2>
              <p className="gateway-description">
                Authorized reading room workspace for member registration, initial password provisioning, 32-cabin layout management, date-wise attendance registers, and CSV compliance reports.
              </p>
              <div className="gateway-features">
                <span className="feature-pill">✓ 32-Cabin Floor Plan</span>
                <span className="feature-pill">✓ Member Registration</span>
                <span className="feature-pill">✓ Date Register & CSV</span>
              </div>
              <Link to="/admin/login" className="btn btn-gateway" style={{ backgroundColor: 'var(--ink)', color: 'var(--chalk)' }}>
                Sign In to Admin Workspace ➔
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 01: The Quiet Hour */}
      <section className="quiet-hour-section" id="essence">
        <div className="arch-container">
          <div className="quiet-hour-header">
            <span className="datum-tag datum-tag--dark">01 / PHILOSOPHY</span>
            <h2 className="quiet-statement">
              Where serious effort finds its natural cadence.
              <span className="serif-highlight">Quietness is an architectural baseline.</span>
            </h2>
            <p className="quiet-support-text">
              Most study spaces treat quietness as a rule to be enforced. At Synapz, quietness is an architectural baseline. From the layout of our thirty-two partitioned cabins to the acoustic separation of common zones, every detail is oriented toward unbroken focus blocks.
            </p>
          </div>

          <div className="quiet-vignettes-grid">
            <div className="quiet-vignette">
              <span className="quiet-vignette-num">01.01</span>
              <h3 className="quiet-vignette-title">Acoustic Partitioning</h3>
              <p className="quiet-vignette-desc">
                High three-sided matte partitions shield each cabin from peripheral movement, hallway footfalls, and laptop glare from neighboring desks.
              </p>
              <div className="quiet-vignette-accent">ZERO VISUAL DISTRACTION</div>
            </div>

            <div className="quiet-vignette">
              <span className="quiet-vignette-num">01.02</span>
              <h3 className="quiet-vignette-title">Ergonomic Lumbar Chairs</h3>
              <p className="quiet-vignette-desc">
                High-resilience foam and breathable mesh seating built specifically for 8 to 14 hour unbroken study marathons without fatigue or posture strain.
              </p>
              <div className="quiet-vignette-accent">CALIBRATED POSTURE SUPPORT</div>
            </div>

            <div className="quiet-vignette">
              <span className="quiet-vignette-num">01.03</span>
              <h3 className="quiet-vignette-title">Unbroken Electrical Line</h3>
              <p className="quiet-vignette-desc">
                Dedicated pure sine-wave inverter backup ensures uninterrupted power for your laptop, tablet, and desk lamp throughout coastal power disruptions.
              </p>
              <div className="quiet-vignette-accent">100% UPTIME GUARANTEE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Designed Around the Student */}
      <section className="designed-section" id="experience">
        <div className="arch-container">
          <div className="section-editorial-header">
            <div className="section-header-left">
              <span className="datum-tag">02 / ENVIRONMENT</span>
              <h2 className="section-editorial-title">
                A physical sanctuary for serious aspirants.
                <span className="serif-accent"> Engineered for retention.</span>
              </h2>
            </div>
            <p className="section-header-desc">
              When preparing for UPSC, NEET-PG, GATE, or APPSC Group examinations, the quality of your daily study environment dictates the depth of your retention.
            </p>
          </div>

          <div className="benefits-editorial-grid">
            <div className="benefit-card-hero">
              <div className="benefit-hero-meta">
                <span className="datum-tag">FACILITY SPECIFICATIONS</span>
                <span className="font-mono text-terracotta">32 FOCUS UNITS</span>
              </div>
              <h3 className="benefit-hero-title">Individual Partitioned Cabins</h3>
              <p className="benefit-hero-copy">
                Each cabin features a 2.5 ft × 2.0 ft deep laminate desktop, dual individual 3-pin power sockets, warm-white non-flicker LED task lighting, and book storage ledges.
              </p>
              <div className="benefit-spec-list">
                <div className="spec-item">
                  <span className="spec-bullet">◆</span>
                  <div className="spec-text">
                    <strong>High-Density Wi-Fi</strong>
                    <span>5G Dual-Band Fiber</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-bullet">◆</span>
                  <div className="spec-text">
                    <strong>RO + UV Purified Water</strong>
                    <span>Cold & Room Temp Dispensers</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-bullet">◆</span>
                  <div className="spec-text">
                    <strong>Silent Climate Control</strong>
                    <span>Regulated 23°C – 24°C Comfort</span>
                  </div>
                </div>
                <div className="spec-item">
                  <span className="spec-bullet">◆</span>
                  <div className="spec-text">
                    <strong>24/7 CCTV Recording</strong>
                    <span>Safe & Monitored Study Hall</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="benefit-card-side">
              <div>
                <span className="datum-tag datum-tag--dark">SILENCE STANDARD</span>
                <h3 className="benefit-side-title" style={{ marginTop: '1rem' }}>Zero Interruption Protocol</h3>
                <p className="benefit-side-copy">
                  All phone calls must be attended on the external terrace. Within the reading room, strict whisper-free silence is preserved at all times.
                </p>
              </div>
              <div className="acoustic-badge">
                <span>🛡️ SOUND-DAMPENED ACOUSTICS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: 32 Cabin Blueprint */}
      <section className="seating-section" id="seats">
        <div className="arch-container">
          <div className="seating-editorial-header">
            <span className="datum-tag datum-tag--dark">03 / FLOOR PLAN</span>
            <h2 className="seating-title">
              The Thirty-Two Focus Cabins
              <span className="serif-accent"> (Authentic Blueprint)</span>
            </h2>
            <p className="seating-lede">
              Explore the exact cabin layout of the Madhurawada reading room: North Aisle, Central Pod, and South Aisle.
            </p>
          </div>

          <div className="blueprint-wrapper">
            <div className="blueprint-meta-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <span className="font-mono text-terracotta">READING ROOM BLUEPRINT · MADHURAWADA</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(242, 238, 229, 0.75)', fontFamily: 'var(--font-mono)' }}>
                  ({seatSummary.availableSeats} of {seatSummary.totalSeats} Cabins Currently Available)
                </span>
              </div>
              <div className="blueprint-legend">
                <span className="legend-item">
                  <span className="legend-swatch legend-swatch--active" /> AVAILABLE ({seatSummary.availableSeats})
                </span>
                <span className="legend-item">
                  <span className="legend-swatch legend-swatch--allotted" /> OCCUPIED ({seatSummary.allottedSeats})
                </span>
                <span className="legend-item">
                  <span className="legend-swatch legend-swatch--selected" /> SELECTED
                </span>
                <span className="legend-item">
                  <span className="legend-swatch legend-swatch--walkway" /> WALKWAY
                </span>
              </div>
            </div>

            <div className="floor-layout-grid">
              {/* North Aisle */}
              <div className="floor-aisle">
                <span className="aisle-title">North Aisle</span>
                {northAisle.map(num => {
                  const status = getSeatStatus(num);
                  const isAllotted = status === 'ALLOTTED';
                  const isSelected = selectedSeat?.code === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedSeat({ code: num, zone: 'North Aisle', status })}
                      className={`arch-seat ${isAllotted ? 'is-allotted' : 'is-available'} ${isSelected ? 'is-selected' : ''}`}
                      title={`Cabin ${num} — ${isAllotted ? 'Occupied / Reserved' : 'Available'}`}
                    >
                      <span className="seat-code">{num}</span>
                      <span className="seat-indicator" />
                      <span className="seat-status-mini">{isAllotted ? 'OCCUPIED' : 'OPEN'}</span>
                    </button>
                  );
                })}
              </div>

              {/* Walkway 1 */}
              <div className="walkway-track">
                <span className="walkway-text">AISLE WALKWAY</span>
              </div>

              {/* Central Pod */}
              <div className="center-cluster-layout">
                <span className="aisle-title">Central Pod</span>
                <div className="front-row-seats">
                  {centralTop.map(num => {
                    const status = getSeatStatus(num);
                    const isAllotted = status === 'ALLOTTED';
                    const isSelected = selectedSeat?.code === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedSeat({ code: num, zone: 'Central Focus Pod', status })}
                        className={`arch-seat ${isAllotted ? 'is-allotted' : 'is-available'} ${isSelected ? 'is-selected' : ''}`}
                        title={`Pod ${num} — ${isAllotted ? 'Occupied / Reserved' : 'Available'}`}
                      >
                        <span className="seat-code">{num}</span>
                        <span className="seat-indicator" />
                        <span className="seat-status-mini">{isAllotted ? 'OCCUPIED' : 'OPEN'}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="center-pair-rows">
                  {centralPairs.map(([l, r], idx) => {
                    const statusL = getSeatStatus(l);
                    const statusR = getSeatStatus(r);
                    const isAllottedL = statusL === 'ALLOTTED';
                    const isAllottedR = statusR === 'ALLOTTED';
                    const isSelectedL = selectedSeat?.code === l;
                    const isSelectedR = selectedSeat?.code === r;
                    return (
                      <div key={idx} className="pair-row">
                        <button
                          type="button"
                          onClick={() => setSelectedSeat({ code: l, zone: 'Central Focus Pod', status: statusL })}
                          className={`arch-seat ${isAllottedL ? 'is-allotted' : 'is-available'} ${isSelectedL ? 'is-selected' : ''}`}
                          title={`Cabin ${l} — ${isAllottedL ? 'Occupied / Reserved' : 'Available'}`}
                        >
                          <span className="seat-code">{l}</span>
                          <span className="seat-indicator" />
                          <span className="seat-status-mini">{isAllottedL ? 'OCCUPIED' : 'OPEN'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSeat({ code: r, zone: 'Central Focus Pod', status: statusR })}
                          className={`arch-seat ${isAllottedR ? 'is-allotted' : 'is-available'} ${isSelectedR ? 'is-selected' : ''}`}
                          title={`Cabin ${r} — ${isAllottedR ? 'Occupied / Reserved' : 'Available'}`}
                        >
                          <span className="seat-code">{r}</span>
                          <span className="seat-indicator" />
                          <span className="seat-status-mini">{isAllottedR ? 'OCCUPIED' : 'OPEN'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Walkway 2 */}
              <div className="walkway-track">
                <span className="walkway-text">AISLE WALKWAY</span>
              </div>

              {/* South Aisle */}
              <div className="floor-aisle">
                <span className="aisle-title">South Aisle</span>
                {southAisle.map(num => {
                  const status = getSeatStatus(num);
                  const isAllotted = status === 'ALLOTTED';
                  const isSelected = selectedSeat?.code === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedSeat({ code: num, zone: 'South Aisle', status })}
                      className={`arch-seat ${isAllotted ? 'is-allotted' : 'is-available'} ${isSelected ? 'is-selected' : ''}`}
                      title={`Cabin ${num} — ${isAllotted ? 'Occupied / Reserved' : 'Available'}`}
                    >
                      <span className="seat-code">{num}</span>
                      <span className="seat-indicator" />
                      <span className="seat-status-mini">{isAllotted ? 'OCCUPIED' : 'OPEN'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Seat Notification */}
            <div className="seat-inspector-panel public-seat-inspector">
              <div className="inspector-info">
                <span className="inspector-badge" style={{ color: selectedSeat?.status === 'ALLOTTED' ? 'var(--terracotta)' : 'var(--olive)' }}>
                  {selectedSeat 
                    ? (selectedSeat.status === 'ALLOTTED' ? '● CURRENTLY OCCUPIED / RESERVED' : '● AVAILABLE FOR ENROLLMENT') 
                    : 'REAL-TIME SEAT AVAILABILITY AUDIT'}
                </span>
                <span className="inspector-title">
                  {selectedSeat 
                    ? `Cabin ${selectedSeat.code} — ${selectedSeat.zone} (${selectedSeat.status === 'ALLOTTED' ? 'Occupied' : 'Available'})` 
                    : 'Tap any cabin on the blueprint above to inspect live availability'}
                </span>
                <span className="inspector-specs">
                  {selectedSeat?.status === 'ALLOTTED'
                    ? 'CURRENTLY ALLOTTED TO A REGISTERED ASPIRANT · STUDY SESSIONS RUNNING'
                    : 'EQUIPPED WITH: INDIVIDUAL 3-PIN POWER · WARM LED TASK LIGHT · HIGH MATTE PRIVACY PARTITIONS'}
                </span>
              </div>
              <div className="inspector-actions">
                {selectedSeat?.status === 'ALLOTTED' ? (
                  <Link to="/member/login" className="btn btn-terracotta btn-sm">
                    Member Sign In ➔
                  </Link>
                ) : (
                  <a 
                    href={`https://wa.me/919492722891?text=${encodeURIComponent(
                      selectedSeat 
                        ? `Hi Synapz Study Zone, I would like to reserve Cabin ${selectedSeat.code} (${selectedSeat.zone}) in Madhurawada.` 
                        : 'Hi Synapz Study Zone, I am interested in checking cabin availability in Madhurawada.'
                    )}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-terracotta btn-sm"
                  >
                    Inquire / Reserve via WhatsApp ➔
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Location */}
      <section className="location-section" id="location">
        <div className="arch-container">
          <div className="location-layout-grid">
            <div className="location-lead-col">
              <span className="datum-tag datum-tag--dark">04 / VISIT US</span>
              <h2 className="location-closing-title">
                Madhurawada,
                <span className="serif-accent"> Visakhapatnam.</span>
              </h2>
              <p className="location-closing-lede">
                Situated in a purely residential, noise-free pocket of Midhilapuri VUDA Colony away from coastal highway traffic.
              </p>

              <div className="location-details-box">
                <div className="loc-item">
                  <span className="loc-item-label">PHYSICAL ADDRESS</span>
                  <p className="loc-item-val">
                    <strong>LIG-A-333, 2-110/10, Midhilapuri Vuda Colony</strong><br />
                    Near Pothinamallayya Palem (PM Palem), Madhurawada,<br />
                    Visakhapatnam, Andhra Pradesh — 530041
                  </p>
                </div>
                <div className="loc-item">
                  <span className="loc-item-label">DIRECT PHONE & WHATSAPP</span>
                  <p className="loc-item-val font-mono">
                    <a href="tel:+919492722891" style={{ color: 'var(--terracotta)' }}>+91 94927 22891</a>
                  </p>
                </div>
                <div className="loc-item">
                  <span className="loc-item-label">TIMINGS</span>
                  <p className="loc-item-val font-mono">06:00 AM – 10:00 PM (Daily, All 7 Days)</p>
                </div>
              </div>

              <div className="loc-actions-row">
                <a
                  href="https://maps.google.com/?q=Synapz+Study+Zone+Madhurawada"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-terracotta"
                >
                  Open in Google Maps ↗
                </a>
                <Link to="/member/login" className="btn btn-ghost-light">
                  Member Portal Login ➔
                </Link>
              </div>
            </div>

            <div className="location-visual-col">
              <div className="arch-map-frame">
                <div className="arch-map-preview">
                  <iframe
                    title="Synapz Study Zone Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3798.530965749716!2d83.361117!3d17.8015441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a395b28d7b3ffff%3A0x67399f92934ec98c!2sSynapz%20Study%20Zone!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="arch-footer">
        <div className="arch-container">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="brand-meta">
                <span className="brand-title text-chalk font-sans font-bold">SYNAPZ STUDY ZONE</span>
                <span className="brand-loc font-mono text-parchment-muted">THE ARCHITECTURE OF FOCUS · MADHURAWADA</span>
              </div>
              <p className="footer-summary" style={{ marginTop: '0.8rem', color: 'rgba(242, 238, 229, 0.7)' }}>
                A quiet, dedicated reading room engineered for rigorous preparation, deep work, and high-stakes goals in Visakhapatnam.
              </p>
            </div>

            <div className="footer-links-col font-mono">
              <span className="footer-heading" style={{ color: 'var(--lavender)' }}>PORTALS</span>
              <ul role="list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <li><Link to="/member/login">Member Login</Link></li>
                <li><Link to="/admin/login">Admin Console</Link></li>
                <li><Link to="/member/dashboard">Attendance Dashboard</Link></li>
              </ul>
            </div>

            <div className="footer-links-col font-mono">
              <span className="footer-heading" style={{ color: 'var(--lavender)' }}>FACILITY</span>
              <ul role="list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <li><a href="#seats">32 Study Cabins</a></li>
                <li><a href="#essence">The Quiet Hour</a></li>
                <li><a href="#location">Find in Madhurawada</a></li>
              </ul>
            </div>

            <div className="footer-links-col font-mono">
              <span className="footer-heading" style={{ color: 'var(--lavender)' }}>CONTACT</span>
              <p style={{ marginTop: '0.5rem', color: 'rgba(242, 238, 229, 0.7)' }}>
                LIG-A-333, Midhilapuri Vuda Colony,<br />
                Madhurawada, Visakhapatnam — 530041
              </p>
              <a href="tel:+919492722891" style={{ color: 'var(--terracotta)', display: 'block', marginTop: '0.4rem' }}>
                +91 94927 22891
              </a>
            </div>
          </div>

          <div className="footer-bottom-row font-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-dark)', fontSize: '0.75rem', color: 'rgba(242, 238, 229, 0.5)' }}>
            <span>© 2026 SYNAPZ STUDY ZONE. ALL RIGHTS RESERVED.</span>
            <span>TIMEZONE: ASIA/KOLKATA (IST)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
