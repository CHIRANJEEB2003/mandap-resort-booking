// MongoDB has no date-only type. Truncate to UTC midnight so stored values
// match what the former PostgreSQL `@db.Date` columns kept (the UTC calendar date),
// and equality checks like "is this date already booked?" keep working.
exports.toDateOnly = (value) => {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};
