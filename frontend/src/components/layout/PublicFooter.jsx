import { Link } from 'react-router-dom';

const PINK = '#E83E8C';
const DARK = '#12330F';

const QUICK_LINKS = [
  { label: 'Home',                 to: '/' },
  { label: 'Mandap',               to: '/search?type=MANDAP' },
  { label: 'Resorts',              to: '/search?type=RESORT' },
  { label: 'Rooms',                to: '/room-booking' },
  { label: 'Wedding Services',     to: '/wedding-packages' },
  { label: 'Wedding Invitations',  to: '/wedding-invitations' },
  { label: 'Browse All Venues',    to: '/search' },
];

const OWNER_LINKS = [
  { label: 'Register as Owner',    to: '/register?role=owner' },
  { label: 'Add Your Property',    to: '/register?role=owner' },
  { label: 'Owner Login',          to: '/login?role=owner' },
  { label: 'Owner Dashboard',      to: '/owner' },
  { label: 'Manage Listings',      to: '/owner/properties' },
];

const SOCIAL = [
  { name: 'Facebook',  href: '#', icon: '📘' },
  { name: 'Instagram', href: '#', icon: '📸' },
  { name: 'YouTube',   href: '#', icon: '📺' },
  { name: 'Twitter/X', href: '#', icon: '🐦' },
];

const VENDOR_CATS = {
  'Wedding Venues': [
    { label: 'Banquet Halls',          to: '/search?subtype=banquet-hall' },
    { label: 'Marriage Gardens',       to: '/search?subtype=marriage-garden' },
    { label: 'Wedding Resorts',        to: '/search?type=RESORT' },
    { label: 'Heritage Venues',        to: '/search?subtype=heritage' },
    { label: 'Destination Venues',     to: '/search?subtype=destination' },
    { label: 'Wedding Mandaps',        to: '/search?type=MANDAP' },
  ],
  'Wedding Vendors': [
    { label: 'Photographers',          to: '/search?service=photographer' },
    { label: 'Bridal Makeup Artists',  to: '/search?service=makeup' },
    { label: 'Wedding Planners',       to: '/search?service=planner' },
    { label: 'Decorators',            to: '/search?service=decorator' },
    { label: 'Catering Services',      to: '/search?service=catering' },
    { label: 'DJs & Entertainment',    to: '/search?service=dj' },
  ],
};

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: DARK }} className="text-white mt-0">
      {/* Top decorative strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${PINK}, transparent)` }} />

      {/* ── Vendor categories section (image 32) ── */}
      <div className="border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <h3 className="text-base font-black uppercase tracking-widest mb-7"
            style={{ color: PINK }}>
            Wedding vendors by category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Object.entries(VENDOR_CATS).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-sm font-bold text-white mb-3">{heading}</h4>
                <ul className="space-y-1.5">
                  {links.map(({ label, to }) => (
                    <li key={label}>
                      <Link to={to} className="text-xs text-white/50 hover:text-white/80 transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Col 1 — Brand */}
          <div>
            <img src="/logo.png" alt="Mandap & Resort Booking"
              className="h-12 w-auto object-contain mb-4"
              style={{ filter: 'brightness(0) invert(1)' }} />
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Odisha's trusted platform for booking wedding mandaps, resorts, and venues.
              Making every celebration memorable.
            </p>
            <div className="flex gap-2 flex-wrap">
              {SOCIAL.map(({ name, href, icon }) => (
                <a key={name} href={href}
                  aria-label={name}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  title={name}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-4"
              style={{ color: PINK }}>
              Quick Links
            </h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5 group">
                    <span className="text-pink-400 group-hover:translate-x-0.5 transition-transform">›</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — For Property Owners */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-4"
              style={{ color: PINK }}>
              For Property Owners
            </h4>
            <ul className="space-y-2">
              {OWNER_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5 group">
                    <span className="text-pink-400 group-hover:translate-x-0.5 transition-transform">›</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-3 rounded-xl border border-white/10" style={{ background: 'rgba(232,62,140,0.08)' }}>
              <p className="text-xs text-white/70 leading-relaxed">
                List your mandap, resort or wedding venue and reach thousands of couples planning their dream wedding.
              </p>
              <Link to="/register?role=owner"
                className="mt-2 inline-block text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ background: PINK }}>
                List Your Venue →
              </Link>
            </div>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-4"
              style={{ color: PINK }}>
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex gap-2">
                <span className="text-base flex-shrink-0">📍</span>
                <span>Mandap & Resort Booking Pvt. Ltd.<br />
                  Bhubaneswar, Odisha – 751001<br />India</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="text-base flex-shrink-0">📞</span>
                <a href="tel:+919000000000" className="hover:text-white transition-colors">+91 90000 00000</a>
              </li>
              <li className="flex gap-2 items-center">
                <span className="text-base flex-shrink-0">✉️</span>
                <a href="mailto:support@mandapbooking.in" className="hover:text-white transition-colors break-all">
                  support@mandapbooking.in
                </a>
              </li>
              <li className="flex gap-2 items-center">
                <span className="text-base flex-shrink-0">🕐</span>
                <span>Mon – Sat: 9 AM – 7 PM IST</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
          <p>© {year} Mandap &amp; Resort Booking Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-4 flex-wrap">
            <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white/70 transition-colors">Terms of Service</Link>
            <Link to="/refund" className="hover:text-white/70 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
