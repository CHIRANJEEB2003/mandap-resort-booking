import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import {
  Bars3Icon, XMarkIcon, ChevronDownIcon, ChevronRightIcon,
  UserCircleIcon, CalendarDaysIcon, HomeIcon,
} from '@heroicons/react/24/outline';
import { useState, useRef, useEffect, useCallback } from 'react';

const PINK = '#E83E8C';

/* ─── Venues mega data ──────────────────────────────────────────────────────── */
const VENUE_TYPES = [
  'Banquet Halls',
  'Marriage Garden / Lawns',
  'Wedding Resorts',
  'Small Function / Party Halls',
  'Destination Wedding Venues',
  'Kalyana Mandapams',
  '4 Star & Above Hotels',
  '5 Star Luxury Hotels',
  'Wedding Farmhouses',
];

const VENUE_CITIES = [
  'Bhubaneswar', 'Cuttack', 'Puri', 'Rourkela',
  'Sambalpur', 'Berhampur', 'Balasore', 'Kolkata',
];

const DEST_CARDS = [
  { name: 'Goa',         gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)', emoji: '🏖️' },
  { name: 'Jaipur',      gradient: 'linear-gradient(135deg,#f97316,#ec4899)', emoji: '🏯' },
  { name: 'Udaipur',     gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)', emoji: '🏰' },
  { name: 'Jodhpur',     gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', emoji: '🌅' },
  { name: 'Puri',        gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', emoji: '🌊' },
  { name: 'Bhubaneswar', gradient: 'linear-gradient(135deg,#10b981,#059669)', emoji: '🏛️' },
];

/* ─── Services mega data — grouped sub-headings ─────────────────────────────── */
const SERVICES = [
  /* col 1 */
  [
    { group: 'Photographers', items: ['Photographers'] },
    { group: 'Makeup', items: ['Bridal Makeup Artists', 'Family Makeup'] },
    { group: 'Planning & Decor', items: ['Wedding Planners', 'Decorators'] },
    { group: 'Virtual Planning', items: ['Virtual Planning'] },
    { group: 'Mehndi', items: ['Mehendi Artists'] },
  ],
  /* col 2 */
  [
    { group: 'Music & Dance', items: ['DJs', 'Sangeet Choreographer', 'Wedding Entertainment'] },
    { group: 'Invites & Gifts', items: ['Invitations', 'Favors', 'Trousseau Packers', 'Invitation Gifts', 'Mehndi Favors'], viewAll: 'View All Invites & Gifts' },
    { group: 'Food', items: ['Catering Services', 'Cake', 'Chaat & Food Stalls', 'Bartenders'], viewAll: 'View All Food' },
  ],
  /* col 3 */
  [
    { group: 'Pre Wedding Shoot', items: ['Pre Wedding Shoot Locations', 'Pre Wedding Photographers'] },
    { group: 'Bridal Wear', items: ['Bridal Lehengas', 'Kanjeevaram / Silk Sarees', 'Cocktail Gowns', 'Trousseau Sarees', 'Bridal Lehenga on Rent'], viewAll: 'View All Bridal Wear' },
    { group: 'Groom Wear', items: ['Sherwani', 'Wedding Suits / Tuxes', 'Sherwani On Rent'], viewAll: 'View All Groom Wear' },
  ],
  /* col 4 */
  [
    { group: 'Jewellery & Accessories', items: ['Jewellery', 'Flower Jewellery', 'Bridal Jewellery on Rent', 'Accessories'], viewAll: 'View All Jewellery & Accessories' },
    { group: 'Pandits', items: ['Wedding Pandits'] },
    { group: 'Bridal Grooming', items: ['Beauty and Wellness'] },
  ],
];

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

function MegaLink({ children, href }) {
  return (
    <Link to={href || '/search'}
      className="block text-[13px] text-gray-600 hover:text-pink-500 py-[3px] transition-colors leading-snug">
      {children}
    </Link>
  );
}

/* ─── Venues mega ────────────────────────────────────────────────────────────── */
function VenuesMega({ close }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 bg-white rounded-b-2xl shadow-2xl border border-gray-100 z-50"
      style={{ width: 820, maxWidth: '96vw' }}>
      <div className="grid grid-cols-3 divide-x divide-gray-100">

        {/* By Type */}
        <div className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: PINK }}>By Type</p>
          {VENUE_TYPES.map(label => (
            <Link key={label} to={`/search?type=${slugify(label)}`}
              onClick={close}
              className="flex items-center justify-between group py-1.5 text-[13px] text-gray-700 hover:text-pink-500 transition-colors border-b border-gray-50 last:border-0">
              {label}
              <ChevronRightIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 text-pink-400 transition-opacity flex-shrink-0" />
            </Link>
          ))}
          <Link to="/search" onClick={close}
            className="mt-3 block text-[13px] font-bold text-gray-900 hover:text-pink-500 transition-colors">
            View all Venues
          </Link>
        </div>

        {/* By City */}
        <div className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: PINK }}>By City</p>
          {VENUE_CITIES.map(city => (
            <Link key={city} to={`/search?city=${encodeURIComponent(city)}`}
              onClick={close}
              className="flex items-center justify-between group py-1.5 text-[13px] text-gray-700 hover:text-pink-500 transition-colors border-b border-gray-50 last:border-0">
              {city}
              <ChevronRightIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 text-pink-400 transition-opacity flex-shrink-0" />
            </Link>
          ))}
          <Link to="/search" onClick={close}
            className="mt-3 block text-[13px] font-bold text-gray-900 hover:text-pink-500 transition-colors">
            More
          </Link>
        </div>

        {/* Destination image cards */}
        <div className="p-5 bg-gray-50/50">
          <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: PINK }}>Destination Wedding Venues</p>
          <div className="grid grid-cols-3 gap-2">
            {DEST_CARDS.map(({ name, gradient, emoji }) => (
              <Link key={name} to={`/search?city=${encodeURIComponent(name)}&type=destination`}
                onClick={close}
                className="group text-center hover:scale-105 transition-transform">
                <div className="rounded-xl overflow-hidden mb-1.5 flex items-center justify-center text-3xl"
                  style={{ background: gradient, height: 72 }}>
                  {emoji}
                </div>
                <p className="text-[12px] font-semibold text-gray-700 group-hover:text-pink-500 transition-colors leading-tight">{name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Services mega ──────────────────────────────────────────────────────────── */
function ServiceGroup({ group, items, viewAll }) {
  return (
    <div className="mb-4">
      <p className="text-[13px] font-black mb-1" style={{ color: PINK }}>{group}</p>
      {items.map(item => (
        <MegaLink key={item} href={`/search?service=${slugify(item)}`}>{item}</MegaLink>
      ))}
      {viewAll && (
        <Link to="/search"
          className="block text-[12px] font-bold text-gray-900 hover:text-pink-500 mt-1 transition-colors">
          {viewAll}
        </Link>
      )}
    </div>
  );
}

function ServicesMega({ close }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 bg-white rounded-b-2xl shadow-2xl border border-gray-100 z-50"
      style={{ width: 880, maxWidth: '96vw' }}>
      <div className="grid grid-cols-4 divide-x divide-gray-100 p-5 gap-1">
        {SERVICES.map((col, ci) => (
          <div key={ci} className={ci > 0 ? 'pl-5' : ''}>
            {col.map(g => (
              <ServiceGroup key={g.group} group={g.group} items={g.items} viewAll={g.viewAll} />
            ))}
          </div>
        ))}
      </div>
      <div className="bg-gray-50 border-t border-gray-100 px-5 py-2.5 flex items-center justify-between rounded-b-2xl">
        <span className="text-xs text-gray-400">Complete wedding services in Odisha</span>
        <Link to="/wedding-packages" onClick={close}
          className="text-xs font-bold hover:opacity-80 transition-opacity" style={{ color: PINK }}>
          Explore Wedding Packages →
        </Link>
      </div>
    </div>
  );
}

/* ─── Invitations dropdown ───────────────────────────────────────────────────── */
function InvitationsDrop({ close }) {
  return (
    <div className="absolute top-full left-0 mt-0 w-56 bg-white rounded-b-2xl shadow-xl border border-gray-100 z-50 py-3 px-4">
      <Link to="/wedding-invitations" onClick={close}
        className="block text-[13px] font-black mb-2 hover:opacity-80 transition-opacity" style={{ color: PINK }}>
        Wedding Invitation Maker
      </Link>
      {[
        ['Wedding Card Designs', '/wedding-invitations?tab=cards'],
        ['Invitation Video Templates', '/wedding-invitations?tab=video'],
        ['Save the Date Templates', '/wedding-invitations?tab=save-date'],
      ].map(([label, href]) => (
        <Link key={label} to={href} onClick={close}
          className="block text-[13px] text-gray-700 hover:text-pink-500 py-1 transition-colors">
          {label}
        </Link>
      ))}
    </div>
  );
}

/* ─── Nav trigger ────────────────────────────────────────────────────────────── */
function NavTrigger({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap ${
        active ? 'text-pink-500' : 'text-gray-700 hover:text-pink-500'
      }`}>
      {label}
      <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${active ? 'rotate-180' : ''}`} />
    </button>
  );
}

/* ─── Main header ────────────────────────────────────────────────────────────── */
export default function PublicHeader() {
  const { user, token, logout } = useAuthStore();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  const closeTimer = useRef(null);

  const isHome = location.pathname === '/';
  const dark = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardPath = user?.role === 'OWNER' ? '/owner'
    : user?.role === 'ADMIN' ? '/admin' : '/customer';

  useEffect(() => { setOpenMenu(null); setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (menu) => setOpenMenu(o => o === menu ? null : menu);
  const close = useCallback(() => setOpenMenu(null), []);

  const hoverEnter = (menu) => { clearTimeout(closeTimer.current); setOpenMenu(menu); };
  const hoverLeave = () => { closeTimer.current = setTimeout(() => setOpenMenu(null), 160); };

  const navLinkCls = dark
    ? 'px-3 py-5 text-sm font-medium text-white/90 hover:text-white transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-white/60'
    : 'px-3 py-5 text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-pink-500';

  return (
    <header ref={headerRef}
      className="sticky top-0 z-50 transition-all duration-300"
      style={dark
        ? { background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }
        : { background: '#fff', borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
      }>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">

          {/* Logo */}
          <Link to="/" onClick={close} className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="Mandap & Resort Booking" className="h-10 w-auto object-contain" style={dark ? { filter: 'brightness(0) invert(1)' } : {}} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">

            <Link to="/" className={navLinkCls}>Home</Link>

            {/* Venues */}
            <div className="relative" onMouseEnter={() => hoverEnter('venues')} onMouseLeave={hoverLeave}>
              <div className="px-3 py-5 border-b-2 border-transparent" style={{ borderColor: openMenu === 'venues' ? (dark ? 'rgba(255,255,255,0.6)' : PINK) : 'transparent' }}>
                <button onClick={() => toggle('venues')}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap ${dark ? (openMenu === 'venues' ? 'text-white' : 'text-white/90 hover:text-white') : (openMenu === 'venues' ? 'text-pink-500' : 'text-gray-700 hover:text-pink-500')}`}>
                  Venues <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${openMenu === 'venues' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {openMenu === 'venues' && <VenuesMega close={close} />}
            </div>

            {/* Wedding Services */}
            <div className="relative" onMouseEnter={() => hoverEnter('services')} onMouseLeave={hoverLeave}>
              <div className="px-3 py-5 border-b-2 border-transparent" style={{ borderColor: openMenu === 'services' ? (dark ? 'rgba(255,255,255,0.6)' : PINK) : 'transparent' }}>
                <button onClick={() => toggle('services')}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap ${dark ? (openMenu === 'services' ? 'text-white' : 'text-white/90 hover:text-white') : (openMenu === 'services' ? 'text-pink-500' : 'text-gray-700 hover:text-pink-500')}`}>
                  Wedding Services <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${openMenu === 'services' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {openMenu === 'services' && <ServicesMega close={close} />}
            </div>

            {/* Wedding Invitations */}
            <div className="relative" onMouseEnter={() => hoverEnter('invitations')} onMouseLeave={hoverLeave}>
              <div className="px-3 py-5 border-b-2 border-transparent" style={{ borderColor: openMenu === 'invitations' ? (dark ? 'rgba(255,255,255,0.6)' : PINK) : 'transparent' }}>
                <button onClick={() => toggle('invitations')}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap ${dark ? (openMenu === 'invitations' ? 'text-white' : 'text-white/90 hover:text-white') : (openMenu === 'invitations' ? 'text-pink-500' : 'text-gray-700 hover:text-pink-500')}`}>
                  Invitations <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${openMenu === 'invitations' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {openMenu === 'invitations' && <InvitationsDrop close={close} />}
            </div>

            <Link to="/search?type=mandap" className={navLinkCls} onClick={close}>Mandap</Link>
            <Link to="/search?type=resort" className={navLinkCls} onClick={close}>Resorts</Link>
            <Link to="/room-booking" className={navLinkCls} onClick={close}>Rooms</Link>

            {token && user?.role === 'CUSTOMER' && (
              <Link to="/customer/bookings" className={`${navLinkCls} flex items-center gap-1`} onClick={close}>
                <CalendarDaysIcon className="h-4 w-4" /> My Bookings
              </Link>
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {token ? (
              <>
                <Link to={dashboardPath}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${dark ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-pink-500 hover:bg-pink-50'}`}>
                  <UserCircleIcon className="h-4 w-4" />
                  {user?.fullName?.split(' ')[0] || 'Profile'}
                </Link>
                <button onClick={logout} className={`text-xs transition-colors ${dark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${dark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-pink-500 hover:bg-pink-50'}`}>
                  Sign in
                </Link>
                <Link to="/register"
                  className="text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-px"
                  style={dark
                    ? { background: '#D6AD45', color: '#142B0A', boxShadow: '0 4px 14px rgba(214,173,69,0.4)' }
                    : { background: `linear-gradient(135deg,${PINK},#c0266f)`, color: '#fff', boxShadow: '0 4px 14px rgba(232,62,140,0.35)' }
                  }>
                  Book Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className={`lg:hidden p-2 rounded-lg transition-colors ${dark ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-0.5">

            <Link to="/" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-semibold text-gray-800 border-b border-gray-100">
              Home
            </Link>

            {[
              ['venues', 'Venues'],
              ['services', 'Wedding Services'],
              ['invitations', 'Wedding Invitations'],
            ].map(([key, label]) => (
              <div key={key}>
                <button onClick={() => setMobileSection(s => s === key ? null : key)}
                  className="flex items-center justify-between w-full py-3 text-sm font-semibold text-gray-800 border-b border-gray-100">
                  {label}
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${mobileSection === key ? 'rotate-180 text-pink-500' : 'text-gray-400'}`} />
                </button>
                {mobileSection === key && key === 'venues' && (
                  <div className="pl-3 pb-2 mt-1 space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest py-1" style={{ color: PINK }}>By Type</p>
                    {VENUE_TYPES.map(label => (
                      <Link key={label} to={`/search?type=${slugify(label)}`} onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-xs text-gray-600 hover:text-pink-500">{label}</Link>
                    ))}
                    <p className="text-[10px] font-black uppercase tracking-widest py-1 mt-2" style={{ color: PINK }}>By City</p>
                    {VENUE_CITIES.map(city => (
                      <Link key={city} to={`/search?city=${encodeURIComponent(city)}`} onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-xs text-gray-600 hover:text-pink-500">{city}</Link>
                    ))}
                    <Link to="/search" onClick={() => setMobileOpen(false)}
                      className="block py-1.5 text-xs font-bold mt-1" style={{ color: PINK }}>View All Venues →</Link>
                  </div>
                )}
                {mobileSection === key && key === 'services' && (
                  <div className="pl-3 pb-2 mt-1">
                    {SERVICES.flat().map(({ group, items, viewAll }) => (
                      <div key={group} className="mb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest py-0.5" style={{ color: PINK }}>{group}</p>
                        {items.map(item => (
                          <Link key={item} to={`/search?service=${slugify(item)}`} onClick={() => setMobileOpen(false)}
                            className="block py-1 text-xs text-gray-600 hover:text-pink-500">{item}</Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {mobileSection === key && key === 'invitations' && (
                  <div className="pl-3 pb-2 mt-1">
                    {[
                      ['Wedding Invitation Maker', '/wedding-invitations'],
                      ['Wedding Card Designs', '/wedding-invitations?tab=cards'],
                      ['Invitation Video Templates', '/wedding-invitations?tab=video'],
                      ['Save the Date Templates', '/wedding-invitations?tab=save-date'],
                    ].map(([label, href]) => (
                      <Link key={label} to={href} onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-xs text-gray-600 hover:text-pink-500">{label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {['Mandap', 'Resorts', 'Rooms'].map(label => (
              <Link key={label}
                to={label === 'Rooms' ? '/room-booking' : `/search?type=${label.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm font-semibold text-gray-800 border-b border-gray-100">
                {label}
              </Link>
            ))}

            {token && user?.role === 'CUSTOMER' && (
              <Link to="/customer/bookings" onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm font-semibold text-gray-800 border-b border-gray-100">
                My Bookings
              </Link>
            )}

            <div className="pt-3 pb-2 flex flex-col gap-2">
              {token ? (
                <>
                  <Link to={dashboardPath} onClick={() => setMobileOpen(false)}
                    className="text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: `linear-gradient(135deg,${PINK},#c0266f)` }}>
                    My Dashboard
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }}
                    className="text-sm text-gray-500 hover:text-red-500 py-2">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/register" onClick={() => setMobileOpen(false)}
                    className="text-center py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg,${PINK},#c0266f)`, boxShadow: '0 4px 14px rgba(232,62,140,0.35)' }}>
                    Get Started — Free
                  </Link>
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    className="text-center py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
