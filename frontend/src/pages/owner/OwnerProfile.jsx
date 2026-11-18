import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DOC_TYPES = ['Aadhaar Card', 'PAN Card', 'GST Certificate', 'Electricity Bill', 'Property Documents', 'Other'];
const STATUS_BADGE = {
  PENDING: 'badge-yellow', APPROVED: 'badge-green', REJECTED: 'badge-red', SUSPENDED: 'badge-gray',
};

export default function OwnerProfile() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docFile, setDocFile] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['owner-profile'],
    queryFn: () => api.get('/owner/profile').then(r => r.data),
  });

  useEffect(() => {
    if (profile) {
      setForm({ fullName: profile.fullName, businessName: profile.businessName, address: profile.address, gstNumber: profile.gstNumber || '', panNumber: profile.panNumber || '' });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/owner/profile', data),
    onSuccess: () => { toast.success('Profile updated'); setEditing(false); qc.invalidateQueries(['owner-profile']); },
    onError: () => toast.error('Update failed'),
  });

  const uploadDocMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('docType', docType);
      return api.post('/owner/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { toast.success('Document uploaded'); setDocFile(null); qc.invalidateQueries(['owner-profile']); },
    onError: () => toast.error('Upload failed'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="section-title">Owner Profile</h1>
        <p className="section-subtitle">Your business information and documents</p>
      </div>

      {/* Verification status */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Verification Status</p>
          <p className="text-xs text-gray-500 mt-0.5">Documents are reviewed within 2-3 business days</p>
        </div>
        <span className={STATUS_BADGE[profile?.verificationStatus] || 'badge-gray'}>
          {profile?.verificationStatus}
        </span>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-gray-900 text-lg">Business Details</h2>
          {!editing && <button onClick={() => { setForm({ fullName: profile.fullName, businessName: profile.businessName, address: profile.address, gstNumber: profile.gstNumber || '', panNumber: profile.panNumber || '' }); setEditing(true); }} className="btn-outline text-sm py-1.5">Edit</button>}
        </div>

        {editing ? (
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
            {[
              { key: 'fullName', label: 'Owner Name' },
              { key: 'businessName', label: 'Business / Venue Name' },
              { key: 'gstNumber', label: 'GST Number (optional)' },
              { key: 'panNumber', label: 'PAN Number (optional)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input" />
              </div>
            ))}
            <div>
              <label className="label">Address</label>
              <textarea value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3} className="input resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            {[
              { label: 'Owner Name', value: profile?.fullName },
              { label: 'Business Name', value: profile?.businessName },
              { label: 'Address', value: profile?.address },
              { label: 'GST', value: profile?.gstNumber || '—' },
              { label: 'PAN', value: profile?.panNumber || '—' },
            ].map(item => (
              <div key={item.label} className="flex gap-4">
                <span className="text-gray-400 w-32 flex-shrink-0">{item.label}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 text-lg mb-4">Verification Documents</h2>

        {profile?.documents?.length > 0 && (
          <div className="space-y-2 mb-5">
            {profile.documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{d.docType}</p>
                  <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  {d.verified ? <span className="badge-green">Verified</span> : <span className="badge-yellow">Pending</span>}
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-forest-600 hover:underline">View</a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="label">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="input text-sm">
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Upload File</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setDocFile(e.target.files[0])}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-forest-50 file:text-forest-700 file:font-medium hover:file:bg-forest-100 cursor-pointer" />
          </div>
          <button onClick={() => uploadDocMutation.mutate()} disabled={!docFile || uploadDocMutation.isPending}
            className="btn-primary text-sm w-full">
            {uploadDocMutation.isPending ? 'Uploading…' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
