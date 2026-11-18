import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Razorpay is loaded from their CDN; include this in index.html:
// <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.get(`/bookings/${bookingId}`).then(r => r.data),
  });

  const createOrderMutation = useMutation({
    mutationFn: () => api.post('/payments/create-order', { bookingId }).then(r => r.data),
    onSuccess: (orderData) => initiateRazorpay(orderData),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create payment order'),
  });

  const verifyMutation = useMutation({
    mutationFn: (data) => api.post('/payments/verify', data),
    onSuccess: () => { toast.success('Payment successful!'); navigate(`/customer/bookings/${bookingId}`); },
    onError: () => toast.error('Payment verification failed'),
  });

  const initiateRazorpay = (orderData) => {
    if (!window.Razorpay) { toast.error('Payment SDK not loaded'); return; }

    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: 'Mandap & Resort Booking',
      description: `Advance for Booking #${bookingId.slice(-8).toUpperCase()}`,
      handler: (response) => {
        verifyMutation.mutate({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          paymentId: orderData.paymentId,
        });
      },
      prefill: { contact: booking?.customer?.user?.phone },
      theme: { color: '#1E3B0E' },
    });
    rzp.open();
  };

  if (isLoading) return <div className="p-8"><LoadingSpinner text="Loading…" /></div>;
  if (!booking) return <div className="p-8 text-gray-500">Booking not found</div>;

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center space-y-6">
          <div className="text-5xl">💳</div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Complete Payment</h1>
            <p className="text-gray-500 text-sm">{booking.property?.name}</p>
          </div>

          <div className="bg-cream-100 rounded-xl p-5 space-y-2 text-sm text-left">
            <div className="flex justify-between text-gray-600"><span>Booking ID</span><span>#{bookingId.slice(-8).toUpperCase()}</span></div>
            <div className="flex justify-between text-gray-600"><span>Total Amount</span><span>₹{Number(booking.totalAmount).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between font-bold text-forest-700 text-base border-t border-gray-200 pt-2">
              <span>Advance Due</span>
              <span>₹{Number(booking.advanceAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button onClick={() => createOrderMutation.mutate()} disabled={createOrderMutation.isPending}
            className="btn-gold w-full text-base py-3">
            {createOrderMutation.isPending ? 'Processing…' : `Pay ₹${Number(booking.advanceAmount).toLocaleString('en-IN')}`}
          </button>

          <p className="text-xs text-gray-400">Secured by Razorpay · Amount is advance payment only</p>

          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      </div>
    </div>
  );
}
