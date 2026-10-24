/**
 * SYNAPZ STUDY ZONE — THE ARCHITECTURE OF FOCUS
 * Client interactions, interactive seat map, dynamic theme awareness, and lightbox.
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileDrawer();
  initInteractiveSeatMap();
  initPhotoLightbox();
  initEnquiryModal();
  initIntersectionReveals();
});

/* --------------------------------------------------------------------------
   1. Sticky Header & Dynamic Light/Dark Section Observer
   -------------------------------------------------------------------------- */
function initStickyHeader() {
  const header = document.querySelector('.arch-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Dark sections observer to flip header theme when over dark backgrounds
  const darkSections = document.querySelectorAll('.quiet-hour-section, .seating-section, .location-section, .arch-footer');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      let isOverDark = false;
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          isOverDark = true;
        }
      });
      if (isOverDark) {
        header.classList.add('is-dark-mode');
      } else {
        header.classList.remove('is-dark-mode');
      }
    }, {
      rootMargin: '-80px 0px -70% 0px',
      threshold: [0.1, 0.5]
    });

    darkSections.forEach(sec => observer.observe(sec));
  }
}

/* --------------------------------------------------------------------------
   2. Mobile Drawer Navigation
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const toggle = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!toggle || !drawer) return;

  const toggleMenu = () => {
    const isOpen = drawer.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggle.addEventListener('click', toggleMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* --------------------------------------------------------------------------
   3. Architectural Interactive Seat Map (32 Seats)
   -------------------------------------------------------------------------- */
const SEAT_DATABASE = {
  // Left Aisle (10 seats)
  'C': { zone: 'North Aisle — Executive Corner', spec: 'Private perimeter partition · 230V socket · Warm LED task lamp' },
  '9': { zone: 'North Aisle — Deep Silence Cabin', spec: 'Single-sided privacy barrier · 230V socket · Laptop shelf' },
  '8': { zone: 'North Aisle — Deep Silence Cabin', spec: 'Acoustic baffle lining · 230V socket · Dedicated storage' },
  '7': { zone: 'North Aisle — Quiet Focus Bay', spec: 'Comfort ergonomic chair · 230V socket · Dual switch' },
  '6': { zone: 'North Aisle — Quiet Focus Bay', spec: 'Natural sightline shield · 230V socket · LED study light' },
  '5': { zone: 'North Aisle — Central Bay', spec: 'Minimalist wood desk · 230V socket · High-speed Wi-Fi tier' },
  '4': { zone: 'North Aisle — Central Bay', spec: 'Acoustic divider · 230V socket · Reading lamp' },
  '3': { zone: 'North Aisle — Entry Approach Bay', spec: 'Corner comfort setup · 230V socket · Desk shelf' },
  '2': { zone: 'North Aisle — Entry Approach Bay', spec: 'Quick access cabin · 230V socket · Task illumination' },
  '1': { zone: 'North Aisle — Entrance Quiet Bay', spec: 'Front corner cabin · 230V socket · Dual-power surge guard' },

  // Center Cluster Front (4 seats)
  'B': { zone: 'Central Focus Wing — Front Row', spec: 'Spacious desk depth · 230V socket · Direct overhead lighting' },
  'E': { zone: 'Central Focus Wing — Front Row', spec: 'Center island cabin · 230V socket · Bookshelf compartment' },
  'A': { zone: 'Central Focus Wing — Front Row', spec: 'Center island cabin · 230V socket · Ergonomic lumbar mesh' },
  'D': { zone: 'Central Focus Wing — Front Row', spec: 'Spacious desk depth · 230V socket · Independent power point' },

  // Center Cluster Spine Pairs (8 seats)
  '13': { zone: 'Central Spine — Deep Study Cabin', spec: 'Double divider shield · 230V socket · Quiet tier' },
  '14': { zone: 'Central Spine — Deep Study Cabin', spec: 'Double divider shield · 230V socket · Quiet tier' },
  '12': { zone: 'Central Spine — Core Workstation', spec: 'High-focus cocoon · 230V socket · Reading task light' },
  '15': { zone: 'Central Spine — Core Workstation', spec: 'High-focus cocoon · 230V socket · Reading task light' },
  '11': { zone: 'Central Spine — Core Workstation', spec: 'Vibration-dampened desk · 230V socket · Storage tier' },
  '16': { zone: 'Central Spine — Core Workstation', spec: 'Vibration-dampened desk · 230V socket · Storage tier' },
  '10': { zone: 'Central Spine — Southern Wing', spec: 'Quiet alcove desk · 230V socket · Wi-Fi antenna sightline' },
  '17': { zone: 'Central Spine — Southern Wing', spec: 'Quiet alcove desk · 230V socket · Extra legroom frame' },

  // Right Aisle (10 seats)
  'F': { zone: 'South Aisle — Executive Corner', spec: 'Private perimeter partition · 230V socket · Warm LED task lamp' },
  '26': { zone: 'South Aisle — Deep Silence Cabin', spec: 'Single-sided privacy barrier · 230V socket · Laptop shelf' },
  '25': { zone: 'South Aisle — Deep Silence Cabin', spec: 'Acoustic baffle lining · 230V socket · Dedicated storage' },
  '24': { zone: 'South Aisle — Quiet Focus Bay', spec: 'Comfort ergonomic chair · 230V socket · Dual switch' },
  '23': { zone: 'South Aisle — Quiet Focus Bay', spec: 'Natural sightline shield · 230V socket · LED study light' },
  '22': { zone: 'South Aisle — Central Bay', spec: 'Minimalist wood desk · 230V socket · High-speed Wi-Fi tier' },
  '21': { zone: 'South Aisle — Central Bay', spec: 'Acoustic divider · 230V socket · Reading lamp' },
  '20': { zone: 'South Aisle — Entry Approach Bay', spec: 'Corner comfort setup · 230V socket · Desk shelf' },
  '19': { zone: 'South Aisle — Entry Approach Bay', spec: 'Quick access cabin · 230V socket · Task illumination' },
  '18': { zone: 'South Aisle — Entrance Quiet Bay', spec: 'Front corner cabin · 230V socket · Dual-power surge guard' }
};

function initInteractiveSeatMap() {
  const seatButtons = document.querySelectorAll('.arch-seat');
  const titleEl = document.getElementById('inspector-seat-title');
  const zoneEl = document.getElementById('inspector-seat-zone');
  const specEl = document.getElementById('inspector-seat-specs');
  const ctaBtn = document.getElementById('inspector-seat-cta');

  if (!seatButtons.length || !titleEl) return;

  const updateInspector = (seatCode) => {
    const data = SEAT_DATABASE[seatCode] || {
      zone: 'Dedicated Individual Cabin',
      spec: '230V power socket · Task illumination · Wi-Fi access'
    };

    // Remove active class from others
    seatButtons.forEach(btn => btn.classList.remove('is-selected'));
    
    // Set selected
    const activeBtn = document.querySelector(`.arch-seat[data-seat="${seatCode}"]`);
    if (activeBtn) activeBtn.classList.add('is-selected');

    // Update inspector content
    titleEl.textContent = `Cabin Seat ${seatCode}`;
    if (zoneEl) zoneEl.textContent = data.zone;
    if (specEl) specEl.textContent = data.spec;

    if (ctaBtn) {
      const waMsg = encodeURIComponent(`Hello Synapz Study Zone, I'd like to enquire about allotting Seat ${seatCode} for my study routine.`);
      ctaBtn.href = `https://wa.me/919492722891?text=${waMsg}`;
      ctaBtn.setAttribute('aria-label', `Enquire about allotting Cabin Seat ${seatCode} on WhatsApp`);
    }
  };

  seatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const seatCode = btn.getAttribute('data-seat');
      if (seatCode) updateInspector(seatCode);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const seatCode = btn.getAttribute('data-seat');
        if (seatCode) updateInspector(seatCode);
      }
    });
  });

  // Default selection
  updateInspector('C');
}

/* --------------------------------------------------------------------------
   4. Lightbox for Real Photography Inspection
   -------------------------------------------------------------------------- */
function initPhotoLightbox() {
  const modal = document.getElementById('photo-lightbox-modal');
  const modalImg = document.getElementById('lightbox-target-img');
  const modalCaption = document.getElementById('lightbox-target-caption');
  const closeBtn = document.getElementById('lightbox-close-btn');

  if (!modal || !modalImg) return;

  const openLightbox = (src, caption) => {
    modalImg.src = src;
    if (modalCaption) modalCaption.textContent = caption || '';
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-lightbox-src]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const src = trigger.getAttribute('data-lightbox-src');
      const caption = trigger.getAttribute('data-lightbox-caption');
      if (src) openLightbox(src, caption);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeLightbox();
    }
  });
}

/* --------------------------------------------------------------------------
   5. Direct Seat Enquiry Modal
   -------------------------------------------------------------------------- */
function initEnquiryModal() {
  const modal = document.getElementById('enquiry-modal');
  const openTriggers = document.querySelectorAll('[data-open-enquiry]');
  const closeBtn = document.getElementById('enquiry-close-btn');
  const form = document.getElementById('quick-enquiry-form');

  if (!modal) return;

  const openModal = () => {
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  };

  openTriggers.forEach(t => t.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('enquiry-name')?.value || 'Student';
      const goal = document.getElementById('enquiry-goal')?.value || 'Competitive Exam / Study';
      const shift = document.getElementById('enquiry-shift')?.value || 'Full Day';
      
      const message = encodeURIComponent(`Hello Synapz Study Zone, my name is ${name}. I am preparing for ${goal} and would like to enquire about seat allotment (${shift} shift).`);
      window.open(`https://wa.me/919492722891?text=${message}`, '_blank');
      closeModal();
    });
  }
}

/* --------------------------------------------------------------------------
   6. Subtle Intersection Reveal Animations
   -------------------------------------------------------------------------- */
function initIntersectionReveals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const elements = document.querySelectorAll(
    '.hero-title, .hero-photo-frame, .quiet-statement, .quiet-vignette, .benefit-card-hero, .benefit-card-side, .benefit-trio-item, .sequence-row, .reviews-editorial-box, .blueprint-wrapper, .location-details-box'
  );

  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.1
  });

  elements.forEach(el => observer.observe(el));
}
