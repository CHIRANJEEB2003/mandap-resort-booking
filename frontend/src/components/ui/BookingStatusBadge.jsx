const STATUS_MAP = {
  ENQUIRY:         { label: 'Enquiry',         cls: 'badge-blue' },
  PENDING_PAYMENT: { label: 'Pending Payment',  cls: 'badge-yellow' },
  CONFIRMED:       { label: 'Confirmed',        cls: 'badge-green' },
  CANCELLED:       { label: 'Cancelled',        cls: 'badge-red' },
  COMPLETED:       { label: 'Completed',        cls: 'badge-gray' },
};

export default function BookingStatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] || { label: status, cls: 'badge-gray' };
  return <span className={cls}>{label}</span>;
}
