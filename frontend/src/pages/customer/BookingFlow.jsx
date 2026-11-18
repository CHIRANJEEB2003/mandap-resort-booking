import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate Event', 'Other'];
const STEPS = ['Details', 'Review', 'Confirm'];

const SLOTS = [
  { value: 'MORNING',  label: '🌅 Morning',  time: '6 AM – 2 PM',    start: '06:00', end: '14:00' },
  { value: 'EVENING',  label: '🌇 Evening',  time: '4 PM – 12 AM',   start: '16:00', end: '00:00' },
  { value: 'FULL_DAY', label: '☀️ Full Day', time: '6 AM – 12 AM',   start: '06:00', end: '00:00' },
];

export default function BookingFlow() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    eventDate: '', eventType: '', guestCount: '', hallId: '', notes: '', slot: 'FULL_DAY',
    cateringPkgId: '', decorationPkgId: '',
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => api.get(`/properties/${slug}`).then(r => r.data),
  });

  const { data: cateringPkgs = [] } = useQuery({
    queryKey: ['catering-packages', property?.id],
    queryFn: () => api.get(`/properties/${property.id}/catering`).then(r => r.data),
    enabled: !!property?.id,
  });

  const { data: decorationPkgs = [] } = useQuery({
    queryKey: ['decoration-packages', property?.id],
    queryFn: () => api.get(`/properties/${property.id}/decoration`).then(r => r.data),
    enabled: !!property?.id,
  });

  const bookMutation = useMutation({
    mutationFn: (data) => api.post('/bookings', data),
    onSuccess: (res) => {
      toast.success('Booking request submitted!');
      navigate(`/customer/bookings/${res.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit booking'),
  });

  if (isLoading) return <div className="p-8"><LoadingSpinner text="Loading venue…" /></div>;
  if (!property) return <div className="p-8 text-gray-500">Venue not found</div>;

  const price = property.pricingRules?.[0];
  const baseAmount = Number(price?.basePrice || 0);
  const selectedCatering = cateringPkgs.find(p => p.id === form.cateringPkgId);
  const selectedDecoration = decorationPkgs.find(p => p.id === form.decorationPkgId);
  const guestNum = Number(form.guestCount) || 0;
  const cateringAmount = selectedCatering ? Number(selectedCatering.pricePerHead) * guestNum : 0;
  const decorationAmount = selectedDecoration ? Number(selectedDecoration.price) : 0;
  const servicesAmount = cateringAmount + decorationAmount;
  const taxAmount = Math.round((baseAmount + servicesAmount) * 0.18);
  const totalAmount = baseAmount + servicesAmount + taxAmount;
  const advanceAmount = Math.round(totalAmount * (price?.advancePercent || 30) / 100);

  const selectedSlot = SLOTS.find(s => s.value === form.slot);

  const handleSubmit = () => {
    const eventDateObj = new Date(form.eventDate);
    const makeDateTime = (timeStr) => {
      if (!timeStr || timeStr === '00:00') {
        // midnight = next calendar day 00:00
        const d = new Date(form.eventDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString();
      }
      const [h, m] = timeStr.split(':');
      const d = new Date(form.eventDate);
      d.setHours(Number(h), Number(m), 0, 0);
      return d.toISOString();
    };
    const services = [];
    if (selectedCatering) {
      services.push({
        serviceName: `Catering: ${selectedCatering.name}`,
        quantity: guestNum,
        unitPrice: Number(selectedCatering.pricePerHead),
        totalPrice: cateringAmount,
      });
    }
    if (selectedDecoration) {
      services.push({
        serviceName: `Decoration: ${selectedDecoration.name}`,
        quantity: 1,
        unitPrice: Number(selectedDecoration.price),
        totalPrice: decorationAmount,
      });
    }
    bookMutation.mutate({
      propertyId: property.id,
      hallId: form.hallId || undefined,
      eventDate: form.eventDate,
      startTime: makeDateTime(selectedSlot.start),
      endTime: makeDateTime(selectedSlot.end),
      eventType: form.eventType,
      guestCount: Number(form.guestCount),
      notes: form.notes,
      services,
    });
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-6 block">← Back to venue</button>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i <= step ? 'bg-forest-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium ${i === step ? 'text-forest-700' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-gray-900 mb-1">Book {property.name}</h2>
          <p className="text-sm text-gray-500 mb-6">{property.addressLine}</p>

          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Event Date *</label>
                  <input type="date" value={form.eventDate} required
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                    className="input" />
                </div>
                <div>
                  <label className="label">Expected Guests *</label>
                  <input type="number" value={form.guestCount} min={1} max={property.totalCapacity}
                    onChange={e => setForm(f => ({ ...f, guestCount: e.target.value }))}
                    className="input" placeholder={`Max ${property.totalCapacity}`} />
                </div>
              </div>

              <div>
                <label className="label">Event Type *</label>
                <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} className="input">
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Booking slot */}
              <div>
                <label className="label">Booking Slot *</label>
                <div className="grid grid-cols-3 gap-2">
                  {SLOTS.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setForm(f => ({ ...f, slot: s.value }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.slot === s.value
                          ? 'border-forest-600 bg-forest-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.time}</p>
                    </button>
                  ))}
                </div>
              </div>

              {property.halls?.length > 0 && (
                <div>
                  <label className="label">Select Hall</label>
                  <select value={form.hallId} onChange={e => setForm(f => ({ ...f, hallId: e.target.value }))} className="input">
                    <option value="">No preference</option>
                    {property.halls.map(h => <option key={h.id} value={h.id}>{h.name} (cap: {h.capacity})</option>)}
                  </select>
                </div>
              )}

              {/* Catering packages */}
              {cateringPkgs.length > 0 && (
                <div>
                  <label className="label">Catering Package <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="space-y-2">
                    <div
                      onClick={() => setForm(f => ({ ...f, cateringPkgId: '' }))}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${!form.cateringPkgId ? 'border-forest-600 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-sm font-medium text-gray-700">No catering</p>
                    </div>
                    {cateringPkgs.map(pkg => (
                      <div key={pkg.id} onClick={() => setForm(f => ({ ...f, cateringPkgId: pkg.id }))}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${form.cateringPkgId === pkg.id ? 'border-forest-600 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{pkg.name}</p>
                            <p className="text-xs text-gray-500">{pkg.isVeg ? '🥦 Veg' : '🍖 Non-Veg'} · Min {pkg.minGuests} guests</p>
                          </div>
                          <p className="text-sm font-bold text-forest-700">₹{Number(pkg.pricePerHead).toLocaleString('en-IN')}/head</p>
                        </div>
                        {guestNum > 0 && form.cateringPkgId === pkg.id && (
                          <p className="text-xs text-forest-600 mt-1">Total: ₹{(Number(pkg.pricePerHead) * guestNum).toLocaleString('en-IN')} for {guestNum} guests</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decoration packages */}
              {decorationPkgs.length > 0 && (
                <div>
                  <label className="label">Decoration Theme <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setForm(f => ({ ...f, decorationPkgId: '' }))}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${!form.decorationPkgId ? 'border-forest-600 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-sm font-medium text-gray-700">No decoration</p>
                    </div>
                    {decorationPkgs.map(pkg => (
                      <div key={pkg.id} onClick={() => setForm(f => ({ ...f, decorationPkgId: pkg.id }))}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${form.decorationPkgId === pkg.id ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <p className="text-sm font-semibold text-gray-800">🌸 {pkg.name}</p>
                        <p className="text-xs font-bold text-gold-600 mt-0.5">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Special Requests</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} className="input resize-none" placeholder="Any special arrangements or requests…" />
              </div>

              <button
                disabled={!form.eventDate || !form.eventType || !form.guestCount || !form.slot}
                onClick={() => setStep(1)} className="btn-primary w-full">
                Review Booking
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-cream-100 rounded-xl p-4 space-y-3 text-sm">
                {[
                  { label: 'Venue', value: property.name },
                  { label: 'Event Date', value: form.eventDate },
                  { label: 'Booking Slot', value: `${selectedSlot?.label} (${selectedSlot?.time})` },
                  { label: 'Event Type', value: form.eventType },
                  { label: 'Guests', value: form.guestCount },
                  { label: 'Hall', value: property.halls?.find(h => h.id === form.hallId)?.name || 'No preference' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Venue charge</span><span>₹{baseAmount.toLocaleString('en-IN')}</span></div>
                {selectedCatering && (
                  <div className="flex justify-between text-gray-600">
                    <span>Catering — {selectedCatering.name} ({guestNum} guests)</span>
                    <span>₹{cateringAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedDecoration && (
                  <div className="flex justify-between text-gray-600">
                    <span>Decoration — {selectedDecoration.name}</span>
                    <span>₹{decorationAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>₹{taxAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                  <span>Total</span><span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gold-600 font-semibold">
                  <span>Advance payable now</span><span>₹{advanceAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-outline flex-1">Edit</button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1">Confirm Details</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 text-center">
              <div className="text-5xl">✅</div>
              <h3 className="font-display text-xl font-semibold text-gray-900">Ready to Submit?</h3>
              <p className="text-sm text-gray-500">
                Your booking request will be sent to the venue owner. You'll need to pay the advance of
                <strong className="text-forest-700"> ₹{advanceAmount.toLocaleString('en-IN')}</strong> once they confirm.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                <button onClick={handleSubmit} disabled={bookMutation.isPending} className="btn-gold flex-1">
                  {bookMutation.isPending ? 'Submitting…' : 'Submit Booking Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
