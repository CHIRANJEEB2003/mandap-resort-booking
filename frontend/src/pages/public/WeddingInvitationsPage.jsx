import { Link } from 'react-router-dom';
import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';

const PINK = '#E83E8C';
const DARK = '#12330F';

const STYLES = [
  { style: 'Royal Gold',    emoji: '👑', palette: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', items: ['Gold foil printing', 'Embossed borders', 'Formal script font'] },
  { style: 'Pink Floral',  emoji: '🌸', palette: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)', items: ['Floral watercolour', 'Rose gold accents', 'Pastel backgrounds'] },
  { style: 'Green Leaves', emoji: '🌿', palette: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', items: ['Botanical prints', 'Earthy tones', 'Eco-friendly paper'] },
  { style: 'Deep Maroon',  emoji: '🪔', palette: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', items: ['Traditional motifs', 'Rich maroon & gold', 'Classical typography'] },
  { style: 'Ocean Blue',   emoji: '🌊', palette: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', items: ['Coastal vibes', 'Silver accents', 'Watercolour washes'] },
  { style: 'Pastel Dream', emoji: '🦋', palette: 'linear-gradient(135deg,#FAF5FF,#EDE9FE)', items: ['Soft lilac tones', 'Whimsical illustrations', 'Modern minimalist'] },
];

const TYPES = [
  { icon: '💌', name: 'Digital E-Cards',       desc: 'WhatsApp & email ready, shareable instantly' },
  { icon: '🎥', name: 'Video Invitations',      desc: 'Animated video cards for a modern touch' },
  { icon: '📅', name: 'Save the Date',          desc: 'Announce your date to guests in advance' },
  { icon: '🖨️', name: 'Printed Cards',          desc: 'Premium paper quality with custom finishes' },
];

export default function WeddingInvitationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <div className="py-14 text-center px-4" style={{ background: 'linear-gradient(135deg,#FDF2F8,#FFF0F7,#FEF9FF)' }}>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: PINK }}>Create & Send</p>
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-gray-900 mb-4">
          Wedding Invitation Designs
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
          Beautiful digital and printed invitations for every style. Choose from our curated collection or request a custom design.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link to="/wedding-packages"
            className="px-7 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
            style={{ background: PINK, boxShadow: '0 4px 14px rgba(232,62,140,0.35)' }}>
            Browse Wedding Packages
          </Link>
          <Link to="/search"
            className="px-7 py-3 rounded-xl font-bold border border-gray-200 text-gray-700 hover:border-pink-300 hover:text-pink-500 transition-all">
            Explore Venues
          </Link>
        </div>
      </div>

      {/* Invitation Types */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Types of Invitations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TYPES.map(({ icon, name, desc }) => (
            <div key={name}
              className="rounded-2xl border border-gray-100 p-5 text-center bg-white hover:shadow-md hover:-translate-y-1 transition-all">
              <span className="text-4xl">{icon}</span>
              <h3 className="font-bold text-gray-900 mt-3 mb-1 text-sm">{name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Style Gallery */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Design Styles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STYLES.map(({ style, emoji, palette, items }) => (
              <div key={style}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="h-36 flex items-center justify-center text-6xl" style={{ background: palette }}>
                  {emoji}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-3">{style}</h3>
                  <ul className="space-y-1.5">
                    {items.map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-green-400">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 text-white"
                    style={{ background: PINK }}
                    onClick={() => alert('Custom invitation design — coming soon! Contact us via Wedding Packages.')}>
                    Choose This Style
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="rounded-3xl px-8 py-10 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg,${DARK},#1a4010)` }}>
          <div className="absolute top-0 right-0 text-9xl opacity-10 select-none pointer-events-none translate-x-6 -translate-y-4">💌</div>
          <p className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: PINK }}>Custom Invitations</p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
            Need a Personalised Design?
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            Our design team creates bespoke wedding invitations tailored to your theme, colours, and style.
          </p>
          <Link to="/wedding-packages"
            className="inline-block px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: PINK, boxShadow: '0 8px 24px rgba(232,62,140,0.45)' }}>
            View Wedding Packages →
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
