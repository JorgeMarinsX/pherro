// Days between first PAYMENT_OVERDUE and suspension.
export function billingGraceDays(): number {
  const days = Number(process.env.BILLING_GRACE_DAYS)
  return Number.isFinite(days) && days > 0 ? days : 7
}
