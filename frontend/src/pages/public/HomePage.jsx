import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SparklesIcon, CheckBadgeIcon, MapPinIcon, StarIcon, ArrowRightIcon, CameraIcon, PaintBrushIcon, MusicalNoteIcon, ClipboardDocumentListIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';
import WeddingAIWidget from '../../components/ui/WeddingAIWidget';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';

const PINK = '#E83E8C';
const DARK = '#12330F';

// ─── slide images ─────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  { url: '/images/mandap-floral-heart-chandelier.jpg', label: 'Floral Heart Chandelier Stage' },
  { url: '/images/venue-lattice-entrance-gate.jpg',    label: 'Illuminated Lattice Entrance Gate' },
  { url: '/images/mandap-lotus-floral-stage.jpg',      label: 'Lotus Floral Wedding Stage' },
  { url: '/images/mandap-classical-stage.png',      label: 'Classical Wedding Stage' },
  { url: '/images/mandap-pink-throne-outdoor.png',  label: 'Pink Throne Outdoor Mandap' },
  { url: '/images/mandap-golden-marigold.png',      label: 'Golden Marigold Mandap' },
  { url: '/images/mandap-white-floral-arch.png',    label: 'White Floral Arch Stage' },
  { url: '/images/mandap-garden-chandelier.png',    label: 'Garden Chandelier Venue' },
  { url: '/images/mandap-red-gold-hanging.png',     label: 'Red Gold Hanging Decor' },
  { url: '/images/mandap-royal-pink.png',           label: 'Royal Pink Stage' },
  { url: '/images/mandap-gold-royal-stage.png',     label: 'Gold Royal Carved Stage' },
  { url: '/images/mandap-temple-gold.jpg',          label: 'Temple Gold Mandap' },
  { url: '/images/mandap-floral-pink.jpg',          label: 'Floral Pink Celebration' },
];


// ─── keyframe animations ──────────────────────────────────────────────────────
const CSS_ANIMS = `
  @keyframes kenBurns {
    from { transform: scale(1.0) translate(0, 0); }
    to   { transform: scale(1.1) translate(-1.5%, -1%); }
  }
  @keyframes kenBurnsB {
    from { transform: scale(1.1) translate(-1%, 0); }
    to   { transform: scale(1.0) translate(1%, -0.8%); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
@keyframes dotBounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-9px); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-bg-img { animation: none !important; }
    .fade-anim { animation: none !important; opacity: 1 !important; }
  }
`;

// ─── one-time splash loader ────────────────────────────────────────────────────
function SplashLoader() {
  const [phase, setPhase] = useState(() => {
    try { return sessionStorage.getItem('mrb_v3') ? 'gone' : 'show'; } catch { return 'show'; }
  });

  useEffect(() => {
    if (phase !== 'show') return;
    try { sessionStorage.setItem('mrb_v3', '1'); } catch {}
    const t1 = setTimeout(() => setPhase('fade'), 1600);
    const t2 = setTimeout(() => setPhase('gone'), 2250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  if (phase === 'gone') return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #142B0A 0%, #1a3410 55%, #0e1f07 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fade' ? 0 : 1,
      transition: 'opacity 0.65s ease',
      pointerEvents: phase === 'fade' ? 'none' : 'all',
    }}>
      <div style={{ position:'absolute', width:340, height:340, borderRadius:'50%', background:'rgba(214,173,69,0.07)', top:-90, left:-90, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:230, height:230, borderRadius:'50%', background:'rgba(214,173,69,0.05)', bottom:-55, right:-55, pointerEvents:'none' }} />
      <img src="/logo.png" alt=""
        style={{ height:68, width:'auto', objectFit:'contain', marginBottom:28, filter:'brightness(0) invert(1)', animation:'fadeIn 0.5s ease both' }} />
      <div style={{ display:'flex', gap:10 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:9, height:9, borderRadius:'50%', background:'#D6AD45',
            animation:`dotBounce 1.1s ${i*0.17}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <p style={{ color:'rgba(214,173,69,0.6)', fontSize:11, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', marginTop:20 }}>
        Loading…
      </p>
    </div>
  );
}

const EVENT_TYPES = ['Mandap Wedding', 'Resort Wedding', 'Destination Wedding', 'Banquet Hall', 'Garden Wedding'];

// ─── main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [slideIdx, setSlideIdx] = useState(0);
  const [prevIdx,  setPrevIdx]  = useState(HERO_SLIDES.length - 1);
  const [vis, setVis] = useState(false);
  const [searchEvent, setSearchEvent] = useState('');
  const [searchDate,  setSearchDate]  = useState('');
  const [searchGuests, setSearchGuests] = useState('');

  const [welcomeType] = useState(() => {
    try {
      const v = sessionStorage.getItem('mrb_welcome');
      if (v) sessionStorage.removeItem('mrb_welcome');
      return v;
    } catch { return null; }
  });

  const firstName = user?.role === 'CUSTOMER' && user?.fullName
    ? user.fullName.trim().split(/\s+/)[0] : null;

  const greetingText = firstName
    ? (welcomeType === 'new' ? `Welcome, ${firstName}!` : `Welcome Back, ${firstName}!`) : null;

  useEffect(() => { const t = setTimeout(() => setVis(true), 400); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx(cur => { setPrevIdx(cur); return (cur + 1) % HERO_SLIDES.length; });
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i) => { setPrevIdx(slideIdx); setSlideIdx(i); };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchEvent) params.set('type', searchEvent);
    if (searchDate)  params.set('date', searchDate);
    if (searchGuests) params.set('guests', searchGuests);
    navigate(`/search?${params.toString()}`);
  };

  const anim = (delay) => ({
    opacity: vis ? 1 : 0,
    animation: vis ? `fadeInUp 0.7s ${delay}s ease both` : 'none',
  });

  return (
    <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', background:'#FFF8FA' }}>
      <style>{CSS_ANIMS}</style>
      <SplashLoader />

      {/* ── Sticky header (transparent on hero, solid on scroll) ── */}
      <PublicHeader />

      {/* ── Hero: full viewport, pulled up behind the 64px header ── */}
      <div style={{ height:'100vh', marginTop:'-64px', position:'relative', overflow:'hidden', flexShrink:0 }}>

        {/* Background slideshow */}
        {HERO_SLIDES.map((slide, i) => (
          <div key={slide.url} style={{
            position:'absolute', inset:0,
            opacity: i === slideIdx ? 1 : (i === prevIdx ? 0.25 : 0),
            transition: 'opacity 1.5s ease-in-out',
            zIndex: i === slideIdx ? 2 : (i === prevIdx ? 1 : 0),
          }}>
            <img src={slide.url} alt={slide.label} className="hero-bg-img"
              style={{ width:'100%', height:'100%', objectFit:'cover',
                animation: i === slideIdx ? `${i % 2 === 0 ? 'kenBurns' : 'kenBurnsB'} 7s ease-in-out forwards` : 'none' }}
              loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}

        {/* Dark gradient overlays */}
        <div style={{ position:'absolute', inset:0, zIndex:10,
          background:'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.75) 100%)' }} />
        <div style={{ position:'absolute', inset:0, zIndex:10,
          background:'linear-gradient(105deg, rgba(10,20,5,0.55) 0%, transparent 55%)' }} />

        {/* ── Main text — left-aligned ── */}
        <div style={{
          position:'absolute', inset:0, zIndex:30,
          display:'flex', flexDirection:'column', justifyContent:'center',
          padding:'0 5% 120px', paddingTop:80,
        }}>
          <div style={{ color:'white', maxWidth:680 }}>

            {greetingText && (
              <div className="fade-anim font-display" style={{
                fontSize:'clamp(1rem,3vw,1.5rem)', fontWeight:600, color:'#D6AD45',
                marginBottom:14, opacity:vis?1:0, animation:vis?'fadeInUp 0.65s 0s ease both':'none',
                textShadow:'0 2px 12px rgba(0,0,0,0.5)',
              }}>{greetingText}</div>
            )}

            {/* Badge */}
            <div className="fade-anim" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(214,173,69,0.18)', border:'1px solid rgba(214,173,69,0.42)',
              color:'#D6AD45', fontSize:11, fontWeight:700, letterSpacing:'0.14em',
              textTransform:'uppercase', padding:'8px 18px', borderRadius:999, marginBottom:22,
              ...anim(0.08),
            }}>
              <SparklesIcon style={{ width:13, height:13 }} />
              Odisha's #1 Wedding Venue Platform
            </div>

            {/* Headline */}
            <h1 className="fade-anim font-display" style={{
              fontWeight:800, lineHeight:1.08, marginBottom:18,
              fontSize:'clamp(2rem, 6vw, 4.4rem)', textShadow:'0 2px 20px rgba(0,0,0,0.4)',
              ...anim(0.14),
            }}>
              Make Your Special<br />
              <span style={{ color:'#D6AD45' }}>Moments Unforgettable</span>
            </h1>

            {/* Subtitle pill row */}
            <p className="fade-anim" style={{
              fontSize:'clamp(0.95rem,2vw,1.15rem)', color:'rgba(255,255,255,0.78)',
              fontWeight:500, letterSpacing:'0.04em', marginBottom:32,
              ...anim(0.24),
            }}>
              Mandaps &nbsp;•&nbsp; Resorts &nbsp;•&nbsp; Events
            </p>

            {/* Explore Venues button */}
            <div className="fade-anim" style={{ ...anim(0.34) }}>
              <button onClick={() => navigate('/search')} style={{
                background:'#D6AD45', color:'#142B0A', fontWeight:700,
                padding:'15px 36px', borderRadius:12, border:'none', cursor:'pointer',
                fontSize:'clamp(0.9rem,1.8vw,1.05rem)',
                boxShadow:'0 8px 28px rgba(214,173,69,0.4)',
                transition:'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#c09930'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#D6AD45'; e.currentTarget.style.transform=''; }}>
                Explore Venues →
              </button>
            </div>
          </div>
        </div>

        {/* ── Slide dots — bottom-left ── */}
        <div style={{ position:'absolute', bottom:120, left:'5%', zIndex:30, display:'flex', gap:8 }}>
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i+1}`} style={{
              width: i === slideIdx ? 26 : 8, height:8, borderRadius:4, padding:0, border:'none', cursor:'pointer',
              background: i === slideIdx ? '#D6AD45' : 'rgba(255,255,255,0.35)',
              transition:'all 0.4s ease',
            }} />
          ))}
        </div>

        {/* ── Bottom search bar ── */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:30, padding:'0 16px 28px' }}>
          <div style={{
            maxWidth:960, margin:'0 auto',
            background:'rgba(255,255,255,0.97)', borderRadius:16,
            boxShadow:'0 20px 60px rgba(0,0,0,0.35)', backdropFilter:'blur(16px)',
            display:'flex', alignItems:'stretch', overflow:'hidden',
          }}>
            {/* Select Event */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'14px 18px', borderRight:'1px solid #E5E7EB', minWidth:0 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Select Event</label>
              <select value={searchEvent} onChange={e => setSearchEvent(e.target.value)}
                style={{ border:'none', outline:'none', fontSize:14, fontWeight:600, color:'#1F2937', background:'transparent', cursor:'pointer' }}>
                <option value="">All Events</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Select Date */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'14px 18px', borderRight:'1px solid #E5E7EB', minWidth:0 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Select Date</label>
              <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ border:'none', outline:'none', fontSize:14, fontWeight:600, color:'#1F2937', background:'transparent', cursor:'pointer' }} />
            </div>

            {/* Guests */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'14px 18px', minWidth:0 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Guests</label>
              <input type="number" min="1" placeholder="Number of guests"
                value={searchGuests} onChange={e => setSearchGuests(e.target.value)}
                style={{ border:'none', outline:'none', fontSize:14, fontWeight:600, color:'#1F2937', background:'transparent', width:'100%' }} />
            </div>

            {/* Search button */}
            <button onClick={handleSearch} style={{
              background:'#D6AD45', color:'#142B0A', fontWeight:700, fontSize:15,
              padding:'0 36px', border:'none', cursor:'pointer', flexShrink:0,
              transition:'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='#c09930'}
            onMouseLeave={e => e.currentTarget.style.background='#D6AD45'}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTIONS BELOW THE HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <HomeSections />

      {/* ── Footer ── */}
      <PublicFooter />

      {/* ── AI Widget ── */}
      <WeddingAIWidget />
    </div>
  );
}

/* ─── Below-fold sections ──────────────────────────────────────────────────── */

function SectionHead({ title, sub, link, linkLabel = 'View All' }) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 leading-tight">{title}</h2>
        {sub && <p className="text-gray-500 text-sm mt-1">{sub}</p>}
      </div>
      {link && (
        <Link to={link}
          className="text-sm font-bold flex items-center gap-1 flex-shrink-0 hover:gap-2 transition-all"
          style={{ color: PINK }}>
          {linkLabel} <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function PropertyCard({ p }) {
  const price = p.pricePerDay ?? p.startingPrice ?? p.price;
  return (
    <Link to={`/venue/${p.slug || p.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {p.coverImageUrl || p.images?.[0] ? (
          <img src={p.coverImageUrl || p.images[0]} alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg, #FFF0F7 0%, #FEE2F2 100%)' }}>
            🏛️
          </div>
        )}
        {p.type && (
          <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest text-white px-2 py-1 rounded-lg"
            style={{ background: PINK }}>
            {p.type}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-pink-500 transition-colors">{p.name}</h3>
        {(p.city || p.location) && (
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <MapPinIcon className="h-3 w-3 flex-shrink-0" />
            {p.city || p.location}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          {price ? (
            <p className="text-sm font-black text-gray-900">
              ₹{Number(price).toLocaleString('en-IN')}
              <span className="font-normal text-xs text-gray-400">/day</span>
            </p>
          ) : <span />}
          {p.averageRating > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
              <StarIcon className="h-3.5 w-3.5 fill-amber-400" />
              {Number(p.averageRating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}


const WHY_US = [
  { icon: '✅', title: '100% Verified',      desc: 'Every venue is personally verified by our team' },
  { icon: '📸', title: 'Real Photographs',   desc: 'Authentic photos so you know exactly what to expect' },
  { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges — all costs visible upfront' },
  { icon: '🎯', title: 'Personalised Help',  desc: 'Dedicated relationship managers for your wedding' },
];

const MANDAP_PLACEHOLDERS = [
  { name: 'Shree Laxmi Mandap',   city: 'Bhubaneswar', type: 'MANDAP', price: 45000, emoji: '🏛️', bg: 'linear-gradient(135deg,#FFF0F7,#FEE2F2)', slug: 'search?type=MANDAP&city=Bhubaneswar' },
  { name: 'Royal Garden Mandap',  city: 'Cuttack',     type: 'MANDAP', price: 55000, emoji: '🌸', bg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', slug: 'search?type=MANDAP&city=Cuttack' },
  { name: 'Puri Seaview Mandap',  city: 'Puri',        type: 'MANDAP', price: 60000, emoji: '🌊', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', slug: 'search?type=MANDAP&city=Puri' },
  { name: 'Heritage Mandap Hall', city: 'Bhubaneswar', type: 'MANDAP', price: 70000, emoji: '🪔', bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', slug: 'search?type=MANDAP&city=Bhubaneswar' },
  { name: 'Mahalaxmi Kalyan Hall',city: 'Jajpur',      type: 'MANDAP', price: 38000, emoji: '🌺', bg: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', slug: 'search?type=MANDAP&city=Jajpur' },
  { name: 'Sunrise Mandap',       city: 'Rourkela',    type: 'MANDAP', price: 42000, emoji: '☀️', bg: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', slug: 'search?type=MANDAP' },
];

const RESORT_PLACEHOLDERS = [
  { name: 'Mayfair Beach Resort',    city: 'Puri',        type: 'RESORT', price: 150000, emoji: '🏖️', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', slug: 'search?type=RESORT&city=Puri' },
  { name: 'Swosti Premium',          city: 'Bhubaneswar', type: 'RESORT', price: 200000, emoji: '🌟', bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', slug: 'search?type=RESORT&city=Bhubaneswar' },
  { name: 'The Crown Resort',        city: 'Cuttack',     type: 'RESORT', price: 120000, emoji: '👑', bg: 'linear-gradient(135deg,#FFF0F7,#FEE2F2)', slug: 'search?type=RESORT&city=Cuttack' },
  { name: 'Panthanivas Konark',      city: 'Konark',      type: 'RESORT', price: 100000, emoji: '🏯', bg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', slug: 'search?type=RESORT&city=Konark' },
  { name: 'Toshali Sands Resort',    city: 'Puri',        type: 'RESORT', price: 180000, emoji: '🌴', bg: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)', slug: 'search?type=RESORT&city=Puri' },
  { name: 'Heritage Village Resort', city: 'Bhubaneswar', type: 'RESORT', price: 250000, emoji: '🏡', bg: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', slug: 'search?type=RESORT' },
];

const WEDDING_SERVICES = [
  {
    label: 'Wedding Photography', Icon: CameraIcon, accent: '#d97706', bg: '#FFFBEB',
    desc: 'Professional photographers and videographers for every wedding style.',
    to: '/wedding-services?category=photographer',
    tags: [
      { label: 'Photographers',          to: '/wedding-services?category=photographer&sub=photographers' },
      { label: 'Videographers',          to: '/wedding-services?category=photographer&sub=videographers' },
      { label: 'Drone Shoots',           to: '/wedding-services?category=photographer&sub=drone' },
      { label: 'Pre-Wedding Photography',to: '/wedding-services?category=photographer&sub=pre-wedding' },
      { label: 'Candid Photography',     to: '/wedding-services?category=photographer&sub=candid' },
    ],
  },
  {
    label: 'Makeup Artists', Icon: SparklesIcon, accent: '#db2777', bg: '#FDF2F8',
    desc: 'Bridal & family makeup artists for a flawless look on your big day.',
    to: '/wedding-services?category=makeup',
    tags: [
      { label: 'Bridal Makeup',  to: '/wedding-services?category=makeup&sub=bridal' },
      { label: 'Family Makeup',  to: '/wedding-services?category=makeup&sub=family' },
      { label: 'Hair Styling',   to: '/wedding-services?category=makeup&sub=hair' },
      { label: 'Airbrush Makeup',to: '/wedding-services?category=makeup&sub=airbrush' },
      { label: 'Saree Draping',  to: '/wedding-services?category=makeup&sub=saree' },
    ],
  },
  {
    label: 'Mehndi Artists', Icon: PaintBrushIcon, accent: '#16a34a', bg: '#F0FDF4',
    desc: 'Traditional & modern mehndi designs for brides and wedding guests.',
    to: '/wedding-services?category=mehndi',
    tags: [
      { label: 'Bridal Mehndi',     to: '/wedding-services?category=mehndi&sub=bridal' },
      { label: 'Traditional Mehndi',to: '/wedding-services?category=mehndi&sub=traditional' },
      { label: 'Arabic Mehndi',     to: '/wedding-services?category=mehndi&sub=arabic' },
      { label: 'Modern Mehndi',     to: '/wedding-services?category=mehndi&sub=modern' },
    ],
  },
  {
    label: 'Wedding DJs', Icon: MusicalNoteIcon, accent: '#2563eb', bg: '#EFF6FF',
    desc: 'DJs, live bands & music for the perfect wedding atmosphere.',
    to: '/wedding-services?category=dj',
    tags: [
      { label: 'Wedding DJs',          to: '/wedding-services?category=dj&sub=djs' },
      { label: 'Live Music',           to: '/wedding-services?category=dj&sub=live' },
      { label: 'Sound Systems',        to: '/wedding-services?category=dj&sub=sound' },
      { label: 'Wedding Entertainment',to: '/wedding-services?category=dj&sub=entertainment' },
    ],
  },
  {
    label: 'Wedding Planners', Icon: ClipboardDocumentListIcon, accent: '#ea580c', bg: '#FFF7ED',
    desc: 'Expert full-service & partial wedding planners across Odisha.',
    to: '/wedding-services?category=planner',
    tags: [
      { label: 'Full Wedding Planning',    to: '/wedding-services?category=planner&sub=full' },
      { label: 'Partial Wedding Planning', to: '/wedding-services?category=planner&sub=partial' },
      { label: 'Wedding Coordination',     to: '/wedding-services?category=planner&sub=coordination' },
      { label: 'Event Management',         to: '/wedding-services?category=planner&sub=event' },
    ],
  },
  {
    label: 'Virtual Planning', Icon: ComputerDesktopIcon, accent: '#7c3aed', bg: '#FAF5FF',
    desc: 'Plan your dream wedding remotely with certified virtual planners.',
    to: '/wedding-services?category=virtual',
    tags: [
      { label: 'Online Consultation',      to: '/wedding-services?category=virtual&sub=consultation' },
      { label: 'Virtual Planning',         to: '/wedding-services?category=virtual&sub=virtual' },
      { label: 'Wedding Budget Planning',  to: '/wedding-services?category=virtual&sub=budget' },
      { label: 'Online Event Coordination',to: '/wedding-services?category=virtual&sub=coordination' },
    ],
  },
];

const PHOTO_MAKEUP = [
  {
    title: 'Wedding Photography', sub: 'Capture your most precious moments beautifully',
    emoji: '📸', bg: 'linear-gradient(135deg,#FEF3C7,#FFF7ED)',
    to: '/search?service=photographer',
    items: ['Photographers', 'Videographers', 'Drone Shoots', 'Pre-Wedding', 'Candid'],
  },
  {
    title: 'Bridal Makeup & Styling', sub: 'Look stunning on your most special day',
    emoji: '💄', bg: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)',
    to: '/search?service=makeup',
    items: ['Bridal Makeup', 'Family Makeup', 'Hair Styling', 'Airbrush', 'Saree Draping'],
  },
];

const CATERING_TYPES = [
  { label: 'Traditional Odia',    emoji: '🍚', bg: '#FEF3C7', to: '/search?service=catering&cuisine=odia' },
  { label: 'North Indian',        emoji: '🍛', bg: '#FEE2F2', to: '/search?service=catering&cuisine=north-indian' },
  { label: 'South Indian',        emoji: '🌿', bg: '#DCFCE7', to: '/search?service=catering&cuisine=south-indian' },
  { label: 'Continental',         emoji: '🥗', bg: '#DBEAFE', to: '/search?service=catering&cuisine=continental' },
  { label: 'Sweets & Desserts',   emoji: '🍮', bg: '#E9D5FF', to: '/search?service=catering&cuisine=sweets' },
  { label: 'Beverages & Bar',     emoji: '🥂', bg: '#CCFBF1', to: '/search?service=catering&cuisine=beverages' },
];

const INVITATION_STYLES = [
  { style: 'Royal Gold',      emoji: '👑', palette: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', to: '/wedding-invitations?style=royal-gold' },
  { style: 'Pink Floral',     emoji: '🌸', palette: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)', to: '/wedding-invitations?style=pink-floral' },
  { style: 'Green Leaves',    emoji: '🌿', palette: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', to: '/wedding-invitations?style=green-leaves' },
  { style: 'Deep Maroon',     emoji: '🪔', palette: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', to: '/wedding-invitations?style=maroon' },
  { style: 'Ocean Blue',      emoji: '🌊', palette: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', to: '/wedding-invitations?style=ocean-blue' },
  { style: 'Pastel Dream',    emoji: '🦋', palette: 'linear-gradient(135deg,#FAF5FF,#EDE9FE)', to: '/wedding-invitations?style=pastel' },
];

const PACKAGES = [
  {
    name: 'Silver Package', price: '₹1.5 Lakhs', badge: 'Starter', highlight: false,
    features: ['Venue booking assistance', 'Basic decoration', 'Photography (4 hrs)', 'Catering for 100 guests', 'Invitation cards (50)'],
  },
  {
    name: 'Gold Package', price: '₹3.5 Lakhs', badge: '⭐ Most Popular', highlight: true,
    features: ['Premium venue + mandap', 'Full floral decoration', 'Photography + Videography', 'Catering for 300 guests', 'Bridal makeup + mehendi', 'DJ & music system'],
  },
  {
    name: 'Platinum Package', price: '₹7 Lakhs', badge: 'All Inclusive', highlight: false,
    features: ['Luxury resort venue', 'Designer decoration', 'Premium photo + drone', 'Catering for 500 guests', 'Full bridal package', 'DJ, live music & bar', 'Guest accommodation'],
  },
];

const ROOM_TYPES = [
  { name: 'Deluxe Rooms',   desc: 'Air-conditioned rooms with twin or king beds', emoji: '🛏️', bg: '#EFF6FF', to: '/room-booking?type=deluxe' },
  { name: 'Suite Rooms',    desc: 'Spacious suites for the bridal couple', emoji: '💎', bg: '#FDF2F8', to: '/room-booking?type=suite' },
  { name: 'Family Rooms',   desc: 'Large rooms ideal for guest families', emoji: '👨‍👩‍👧‍👦', bg: '#F0FDF4', to: '/room-booking?type=family' },
  { name: 'Dormitories',    desc: 'Budget-friendly shared accommodation', emoji: '🏠', bg: '#FFF7ED', to: '/room-booking?type=dorm' },
];

const TESTIMONIALS = [
  { name: 'Priya & Rohit',    location: 'Bhubaneswar', type: 'Mandap Wedding', rating: 5, text: 'Found our dream mandap within hours. The booking process was smooth and the venue was exactly as shown. Highly recommend to every couple planning their wedding!' },
  { name: 'Ankita & Suresh',  location: 'Cuttack',     type: 'Resort Wedding', rating: 5, text: 'We booked the Puri resort through this platform and it was absolutely magical. The team helped us coordinate everything. Our guests loved every moment.' },
  { name: 'Deepika & Arjun',  location: 'Puri',        type: 'Destination Wedding', rating: 5, text: 'The destination wedding package was worth every rupee. From mandap to catering to photography — everything was seamless. Will recommend to all our friends!' },
];

function StaticVenueCard({ name, city, type, price, emoji, bg, slug }) {
  return (
    <Link to={`/${slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-44 overflow-hidden" style={{ background: bg }}>
        <div className="w-full h-full flex items-center justify-center text-7xl opacity-70">{emoji}</div>
        <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest text-white px-2 py-1 rounded-lg" style={{ background: PINK }}>{type}</span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-pink-500 transition-colors">{name}</h3>
        <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <MapPinIcon className="h-3 w-3 flex-shrink-0" />{city}
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-black text-gray-900">₹{price.toLocaleString('en-IN')}<span className="font-normal text-xs text-gray-400">/day</span></p>
        </div>
      </div>
    </Link>
  );
}

function HomeSections() {
  const { data: mandapsData } = useQuery({
    queryKey: ['home-mandaps'],
    queryFn: () => api.get('/properties', { params: { type: 'MANDAP', limit: 6, status: 'APPROVED' } }).then(r => r.data),
  });
  const { data: resortsData } = useQuery({
    queryKey: ['home-resorts'],
    queryFn: () => api.get('/properties', { params: { type: 'RESORT', limit: 6, status: 'APPROVED' } }).then(r => r.data),
  });
  const { data: recentData } = useQuery({
    queryKey: ['home-recent'],
    queryFn: () => api.get('/properties', { params: { limit: 4, status: 'APPROVED', sort: 'newest' } }).then(r => r.data),
  });

  const mandaps = mandapsData?.properties || mandapsData?.data || [];
  const resorts = resortsData?.properties || resortsData?.data || [];
  const recent  = recentData?.properties  || recentData?.data  || [];

  const [venueFilter, setVenueFilter] = useState('ALL');

  return (
    <div className="flex-1 bg-white">

      {/* ── Stats strip ── */}
      <div style={{ background: DARK }} className="py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: '500+', label: 'Verified Venues' },
              { n: '10K+', label: 'Happy Couples' },
              { n: '25+',  label: 'Cities Covered' },
              { n: '4.8★', label: 'Average Rating' },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="text-3xl font-black" style={{ color: PINK }}>{n}</p>
                <p className="text-white/60 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="bg-white border-b border-gray-100 py-5 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="🔍  Search venues, mandaps, resorts..."
              className="flex-1 min-w-[180px] px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              onKeyDown={e => e.key === 'Enter' && (window.location.href = `/search?q=${encodeURIComponent(e.target.value)}`)}
            />
            <input type="date" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200" />
            <select className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
              <option value="">Guests</option>
              {[50, 100, 200, 300, 500, 750, 1000].map(n => <option key={n} value={n}>{n}+</option>)}
            </select>
            <Link to="/search"
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg,${PINK},#c0266f)`, boxShadow: '0 4px 14px rgba(232,62,140,0.35)' }}>
              Search →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Popular Wedding Venues ── */}
      {(() => {
        const allMandaps = mandaps.length > 0 ? mandaps : MANDAP_PLACEHOLDERS.map(m => ({
          id: m.name, name: m.name, city: m.city, type: m.type,
          pricePerDay: m.price, coverImageUrl: null, slug: m.slug, _placeholder: true,
        }));
        const allResorts = resorts.length > 0 ? resorts : RESORT_PLACEHOLDERS.map(r => ({
          id: r.name, name: r.name, city: r.city, type: r.type,
          pricePerDay: r.price, coverImageUrl: null, slug: r.slug, _placeholder: true,
        }));
        const venues = venueFilter === 'MANDAP' ? allMandaps
          : venueFilter === 'RESORT' ? allResorts
          : [...allMandaps, ...allResorts];
        const FILTERS = [
          { key: 'ALL',    label: 'All Venues' },
          { key: 'MANDAP', label: 'Mandaps' },
          { key: 'RESORT', label: 'Resorts' },
        ];
        return (
          <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
            <SectionHead title="Popular Wedding Venues" sub="Explore the best Mandaps and Wedding Resorts for your special day" link="/search" linkLabel="Explore All" />
            <div className="flex gap-2 mb-6 flex-wrap">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setVenueFilter(f.key)}
                  className="px-5 py-2 rounded-full text-sm font-bold border transition-all"
                  style={venueFilter === f.key
                    ? { background: PINK, color: '#fff', borderColor: PINK }
                    : { background: '#fff', color: '#374151', borderColor: '#E5E7EB' }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {venues.map(p => (
                p._placeholder ? (
                  <StaticVenueCard key={p.id} name={p.name} city={p.city} type={p.type} price={p.pricePerDay} emoji={p.type === 'MANDAP' ? '🏛️' : '🌟'} bg={p.type === 'MANDAP' ? 'linear-gradient(135deg,#FFF0F7,#FEE2F2)' : 'linear-gradient(135deg,#EFF6FF,#DBEAFE)'} slug={p.slug} />
                ) : (
                  <PropertyCard key={p.id} p={p} />
                )
              ))}
            </div>
          </section>
        );
      })()}

      {/* ── Recently Added ── */}
      {recent.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <SectionHead title="Recently Added" sub="New venues just listed on our platform" link="/search?sort=newest" linkLabel="See All New" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recent.slice(0, 4).map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Wedding Services ── */}
      <section className="py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <SectionHead title="Wedding Services" sub="Hire the best professionals for your perfect wedding" link="/wedding-services" linkLabel="Browse All" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WEDDING_SERVICES.map(({ label, Icon, desc, bg, accent, to, tags }) => (
              <div key={label} className="group flex gap-5 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300" style={{ background: bg }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: accent }}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-base" style={{ color: accent }}>{label}</h3>
                    <Link to={to} className="text-xs font-bold flex items-center gap-1 flex-shrink-0" style={{ color: PINK }}>
                      View All <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(({ label: tagLabel, to: tagTo }) => (
                      <Link key={tagLabel} to={tagTo}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/80 text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:bg-white transition-all font-medium shadow-sm">
                        {tagLabel}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Food & Catering Services ── */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <SectionHead title="Food & Catering Services" sub="From traditional feasts to modern cuisines" link="/search?service=catering" linkLabel="Find Caterers" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATERING_TYPES.map(({ label, emoji, bg, to }) => (
              <Link key={label} to={to}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ background: bg }}>{emoji}</div>
                <p className="text-xs font-semibold text-gray-700 group-hover:text-pink-500 transition-colors leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wedding Packages & Special Offers ── */}
      <section className="py-10" style={{ background: 'linear-gradient(135deg,#FFF0F7,#FEF9FF)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <SectionHead title="Wedding Packages & Special Offers" sub="All-inclusive packages for every budget" link="/wedding-packages" linkLabel="All Packages" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PACKAGES.map(({ name, price, features, badge, highlight }) => (
              <div key={name}
                className={`bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-xl hover:-translate-y-1 ${highlight ? 'border-pink-300 shadow-pink-100 shadow-lg' : 'border-gray-100'}`}>
                {badge && (
                  <div className="text-center py-2 text-xs font-black uppercase tracking-widest text-white"
                    style={{ background: highlight ? PINK : '#6b7280' }}>
                    {badge}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-display font-bold text-lg text-gray-900 mb-1">{name}</h3>
                  <p className="text-2xl font-black mb-5" style={{ color: highlight ? PINK : '#374151' }}>
                    {price}<span className="text-sm font-normal text-gray-400"> / event</span>
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/wedding-packages"
                    className="block w-full text-center py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: highlight ? PINK : '#f3f4f6', color: highlight ? 'white' : '#374151' }}>
                    Choose Package →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rooms & Accommodation ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
        <SectionHead title="Rooms & Accommodation" sub="Comfortable stays for you and your wedding guests" link="/room-booking" linkLabel="Book Rooms" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROOM_TYPES.map(({ name, desc, emoji, bg, to }) => (
            <Link key={name} to={to}
              className="group rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all bg-white">
              <div className="h-36 flex items-center justify-center text-6xl" style={{ background: bg }}>{emoji}</div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-pink-500 transition-colors">{name}</h3>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
                <p className="text-xs font-semibold mt-3 flex items-center gap-1" style={{ color: PINK }}>
                  View rooms <ArrowRightIcon className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Customize Wedding Menu ── */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, #fff7ed, #fef3c7)` }}>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:flex items-center justify-center text-9xl opacity-20 select-none pointer-events-none">
              🍽️
            </div>
            <div className="relative px-8 py-10 max-w-2xl">
              <span className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 text-white"
                style={{ background: '#f59e0b' }}>
                New Feature
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
                Customize Your Wedding Menu
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Work with our expert chefs to create the perfect menu for your wedding.
                Choose from traditional Odia cuisine, North Indian, Continental, and more.
                Customizable for dietary requirements and preferences.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {['Traditional Odia', 'North Indian', 'South Indian', 'Continental', 'Chinese', 'Jain Options'].map(c => (
                  <span key={c} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-amber-200 text-amber-800">{c}</span>
                ))}
              </div>
              <Link to="/wedding-packages"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#f59e0b', boxShadow: '0 4px 14px rgba(245,158,11,0.4)' }}>
                Customize Menu <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customer Reviews & Testimonials ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
        <SectionHead title="What Couples Say" sub="Real stories from real weddings across Odisha" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, location, text, rating, type }) => (
            <div key={name}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarSolid key={i} className={`h-4 w-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg,#FFF0F7,#FEE2F2)' }}>
                  👰
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{location} · {type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why choose us ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
        <SectionHead title="Why Choose Us" sub="Trusted by thousands of couples across Odisha" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_US.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-bold text-gray-900 mt-3 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="mx-4 sm:mx-6 mb-10 rounded-3xl overflow-hidden relative"
        style={{ background: `linear-gradient(135deg,${DARK},#1a4010)` }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(232,62,140,0.5)', top:-80, right:-60 }} />
          <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(214,173,69,0.4)', bottom:-50, left:-30 }} />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 py-12 text-center">
          <p className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: PINK }}>Start Planning Today</p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-4">Your Perfect Wedding Venue Awaits</h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8 text-sm">
            Browse 500+ verified mandaps and resorts across Odisha. Book with confidence — transparent pricing, real photos.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/search" className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{ background: PINK, boxShadow: '0 8px 24px rgba(232,62,140,0.45)' }}>
              Explore Venues →
            </Link>
            <Link to="/register" className="px-8 py-3 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all">
              Register Free
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
