import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TYPES = ['MANDAP', 'MARRIAGE_HALL', 'RESORT', 'BANQUET_HALL', 'WEDDING_VENUE'];
const STEPS = ['Basic Info', 'Location', 'Details', 'Halls', 'Pricing'];

export default function AddEditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', description: '', propertyType: 'MANDAP', addressLine: '',
    totalCapacity: '', hasAC: false, hasPool: false, hasRooms: false,
    outdoorArea: false, termsConditions: '', locationNodeId: '',
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property-edit', id],
    queryFn: () => api.get(`/properties/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: () => api.get('/locations/states').then(r => r.data),
  });

  useEffect(() => {
    if (property) {
      setForm({
        name: property.name || '', description: property.description || '',
        propertyType: property.propertyType || 'MANDAP', addressLine: property.addressLine || '',
        totalCapacity: property.totalCapacity || '', hasAC: property.hasAC || false,
        hasPool: property.hasPool || false, hasRooms: property.hasRooms || false,
        outdoorArea: property.outdoorArea || false, termsConditions: property.termsConditions || '',
        locationNodeId: property.locationNodeId || '',
      });
    }
  }, [property]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/properties/${id}`, data) : api.post('/properties', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Property updated' : 'Property submitted for review');
      navigate('/owner/properties');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving property'),
  });

  if (isEdit && isLoading) return <LoadingSpinner />;

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });
  const checkbox = (key) => ({ checked: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.checked })) });

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <button onClick={() => navigate('/owner/properties')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="section-title mt-1">{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              step === i ? 'bg-forest-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="label">Property Name *</label>
              <input {...f('name')} className="input" placeholder="e.g. Shree Laxmi Mandap" required />
            </div>
            <div>
              <label className="label">Venue Type *</label>
              <select {...f('propertyType')} className="input">
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea {...f('description')} rows={4} className="input resize-none"
                placeholder="Describe your venue — layout, facilities, what makes it special…" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="label">Full Address *</label>
              <textarea {...f('addressLine')} rows={3} className="input resize-none"
                placeholder="Building name, street, landmark, city, PIN" />
            </div>
            <div>
              <label className="label">Location (State / District / City)</label>
              <select value={form.locationNodeId}
                onChange={e => setForm(p => ({ ...p, locationNodeId: Number(e.target.value) }))}
                className="input">
                <option value="">Select location…</option>
                {(states || []).map(s => (
                  <optgroup key={s.id} label={s.name}>
                    {(s.nodes || []).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="label">Total Capacity (guests) *</label>
              <input type="number" {...f('totalCapacity')} min={1} className="input" placeholder="e.g. 500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'hasAC', label: 'Air Conditioned' },
                { key: 'hasPool', label: 'Swimming Pool' },
                { key: 'hasRooms', label: 'Rooms Available' },
                { key: 'outdoorArea', label: 'Outdoor Area' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...checkbox(key)} className="rounded w-4 h-4 text-forest-600" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="label">Terms & Conditions</label>
              <textarea {...f('termsConditions')} rows={4} className="input resize-none"
                placeholder="Advance payment policy, cancellation terms, rules…" />
            </div>
          </>
        )}

        {step === 3 && (
          <div>
            <p className="text-sm text-gray-600 mb-4">After saving the property, you can add halls from the Edit page.</p>
            <div className="bg-cream-100 rounded-xl p-4 text-sm text-gray-600">
              💡 Halls represent individual bookable spaces within your property (e.g., Main Hall, Garden Area, Roof Terrace).
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-sm text-gray-600 mb-4">After saving, configure pricing from the Edit page.</p>
            <div className="bg-cream-100 rounded-xl p-4 text-sm text-gray-600">
              💡 You can set full-day, hourly, weekend, and seasonal pricing along with advance payment percentage and cancellation policies.
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-outline flex-1">Previous</button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1">Next</button>
        ) : (
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.addressLine}
            className="btn-gold flex-1">
            {mutation.isPending ? 'Saving…' : isEdit ? 'Update Property' : 'Submit for Review'}
          </button>
        )}
      </div>
    </div>
  );
}
