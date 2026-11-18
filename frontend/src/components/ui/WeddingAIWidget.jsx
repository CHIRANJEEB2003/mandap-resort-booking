import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ChevronDownIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

const QUICK_PROMPTS = [
  'Plan my dream destination wedding',
  'Find mandaps in Bhubaneswar',
  'Best resorts for 500 guests',
  'Wedding budget under ₹10 lakhs',
];

const BOT_REPLIES = {
  default: "Thank you for your question! I'd love to help you plan your perfect wedding. Could you tell me more about your requirements — location, guest count, and budget?",
  destination: "That sounds absolutely exciting! 🌴 Let's start planning your dream destination wedding. Could you please share which destination you're considering? 😊",
  mandap: "Great choice! Bhubaneswar has some wonderful mandaps. 🏛️ What's your approximate guest count and preferred date range?",
  resort: "I can help you find the perfect resort! 🌿 Are you looking for an indoor or outdoor setup? And what's your preferred location?",
  budget: "Smart planning! 💰 For a wedding under ₹10 lakhs, I recommend focusing on a mandap with in-house catering. Would you like venue suggestions?",
};

function getReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('destination')) return BOT_REPLIES.destination;
  if (m.includes('mandap') || m.includes('bhubaneswar')) return BOT_REPLIES.mandap;
  if (m.includes('resort') || m.includes('guest')) return BOT_REPLIES.resort;
  if (m.includes('budget') || m.includes('lakh')) return BOT_REPLIES.budget;
  return BOT_REPLIES.default;
}

export default function WeddingAIWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Namaste! 🙏 I\'m Wedika, your personal Indian wedding assistant. How can I help you plan your dream wedding today?' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { from: 'user', text: text.trim() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { from: 'bot', text: getReply(text) }]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open Wedding AI Assistant"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
              style={{ background: 'linear-gradient(135deg,#9333ea,#ec4899,#f97316)' }}>
              <span className="text-2xl">💍</span>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask Wedika AI ✨
            </div>
          </div>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl"
          style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div className="relative px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#9333ea,#ec4899)' }}>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg,#c084fc,#f9a8d4)' }}>
                👰
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-black text-sm leading-tight">Wedika AI</p>
              <p className="text-white/70 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Indian Wedding Assistant
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8f4ff', minHeight: 240, maxHeight: 360 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#c084fc,#f9a8d4)' }}>
                    👰
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.from === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'text-gray-800 rounded-bl-sm'
                }`}
                  style={{
                    background: msg.from === 'user'
                      ? 'linear-gradient(135deg,#9333ea,#ec4899)'
                      : 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#c084fc,#f9a8d4)' }}>
                  👰
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center shadow-sm">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-purple-300"
                      style={{ animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length < 3 && (
            <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 border transition-colors hover:border-pink-400 hover:text-pink-500"
                  style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Ask a question…"
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-purple-400"
              style={{ '--tw-ring-color': '#9333ea' }}
            />
            <button onClick={() => send(input)}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#9333ea,#ec4899)' }}>
              <PaperAirplaneIcon className="h-4 w-4 text-white" />
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-400 py-1.5 bg-white border-t border-gray-50 flex-shrink-0">
            Wedika may make mistakes. Please verify key info.
          </p>
        </div>
      )}
    </>
  );
}
